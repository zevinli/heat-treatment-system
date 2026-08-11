import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TenantService, type CreateOrganizationDto, type UpdateOrganizationDto, type AddOrgMemberDto } from './tenant.service';
import { TenantConnectionService } from './tenant-connection.service';
import type { Request } from 'express';
import { CanRole, NeedLogin } from '@lark-apaas/fullstack-nestjs-core';

@Controller('api/tenant')
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly tenantConnectionService: TenantConnectionService,
  ) {}

  private async assertOrgManager(id: string, req: Request) {
    const userId = req.userContext?.userId;
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.tenantService.assertCanManageOrganization(id, userId, req.userContext?.accountRole);
  }

  /**
   * 获取当前用户的组织列表
   */
  @NeedLogin()
  @Get('my-organizations')
  async getMyOrganizations(@Req() req: Request) {
    const userId = req.userContext?.userId;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const organizations = await this.tenantService.findUserOrganizations(userId);
    return {
      items: organizations.map(org => ({
        id: org.id,
        code: org.code,
        name: org.name,
        role: (org as any).role,
        businessRole: (org as any).businessRole,
        status: org.status,
        createdAt: org.createdAt,
      })),
    };
  }

  /**
   * 创建新组织
   */
  @NeedLogin()
  @Post('organizations')
  async createOrganization(
    @Body() dto: CreateOrganizationDto,
    @Req() req: Request,
  ) {
    const userId = req.userContext?.userId;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const organization = await this.tenantService.createOrganization(dto, userId);
    return {
      id: organization.id,
      code: organization.code,
      name: organization.name,
      status: organization.status,
      message: 'Organization created successfully',
    };
  }

  /**
   * 获取组织列表
   */
  @NeedLogin()
  @CanRole('admin')
  @Get('organizations')
  async getOrganizations(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    await this.tenantService.assertPlatformAdmin(req.userContext!.userId!);
    return this.tenantService.findAll({
      search,
      status,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  /**
   * 获取组织详情
   */
  @NeedLogin()
  @Get('organizations/:id')
  async getOrganization(@Param('id') id: string, @Req() req: Request) {
    await this.assertOrgManager(id, req);
    const organization = await this.tenantService.findById(id);
    if (!organization) {
      throw new NotFoundException(`Organization not found: ${id}`);
    }

    return {
      id: organization.id,
      code: organization.code,
      name: organization.name,
      dbName: organization.dbName,
      dbHost: organization.dbHost,
      dbPort: organization.dbPort,
      status: organization.status,
      maxUsers: organization.maxUsers,
      maxStorageGb: organization.maxStorageGb,
      expiresAt: organization.expiresAt,
      contactName: organization.contactName,
      contactPhone: organization.contactPhone,
      contactEmail: organization.contactEmail,
      description: organization.description,
      logoUrl: organization.logoUrl,
      isActive: organization.isActive,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }

  /**
   * 更新组织
   */
  @NeedLogin()
  @Put('organizations/:id')
  async updateOrganization(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @Req() req: Request,
  ) {
    await this.assertOrgManager(id, req);
    const organization = await this.tenantService.update(id, dto);

    // 清除缓存的连接（如果配置有变更）
    if (dto.status === 'inactive' || dto.status === 'suspended') {
      const org = await this.tenantService.findById(id);
      if (org) {
        await this.tenantConnectionService.clearConnection(org.code);
      }
    }

    return {
      id: organization.id,
      code: organization.code,
      name: organization.name,
      message: 'Organization updated successfully',
    };
  }

  /**
   * 删除组织
   */
  @NeedLogin()
  @Delete('organizations/:id')
  async deleteOrganization(@Param('id') id: string, @Req() req: Request) {
    await this.assertOrgManager(id, req);
    await this.tenantService.delete(id);
    return { message: 'Organization deleted successfully' };
  }

  /**
   * 添加成员到组织
   */
  @NeedLogin()
  @Post('organizations/:id/members')
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddOrgMemberDto,
    @Req() req: Request,
  ) {
    const access = await this.assertOrgManager(id, req);
    const member = await this.tenantService.addMember(id, dto, access);
    return {
      id: member.id,
      userId: member.userId,
      role: member.role,
      businessRole: member.businessRole,
      status: member.status,
      message: 'Member added successfully',
    };
  }

  /** 查看当前组织成员（平台管理员或组织管理员）。 */
  @NeedLogin()
  @Get('organizations/:id/members')
  async getMembers(@Param('id') id: string, @Req() req: Request) {
    await this.assertOrgManager(id, req);
    return { items: await this.tenantService.listMembers(id) };
  }

  /** 业务页面的组织成员姓名目录，不暴露账号、角色或状态等管理字段。 */
  @NeedLogin()
  @Get('organizations/:id/member-directory')
  async getMemberDirectory(@Param('id') id: string, @Req() req: Request) {
    const userId = req.userContext?.userId;
    if (!userId) throw new BadRequestException('User not authenticated');
    await this.tenantService.assertOrganizationMembership(id, userId);
    return { items: await this.tenantService.listMemberDirectory(id) };
  }

  /** 组织管理角色与租户内业务角色分开设置。 */
  @NeedLogin()
  @Put('organizations/:id/members/:userId')
  async updateMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: {
      role?: 'super_admin' | 'admin' | 'member';
      businessRole?: 'admin' | 'operator' | 'finance' | 'viewer';
    },
    @Req() req: Request,
  ) {
    const access = await this.assertOrgManager(id, req);
    const member = await this.tenantService.updateMember(id, userId, body, access);
    return { id: member.id, userId: member.userId, role: member.role, businessRole: member.businessRole };
  }

  /**
   * 移除成员
   */
  @NeedLogin()
  @Delete('organizations/:id/members/:userId')
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    const access = await this.assertOrgManager(id, req);
    await this.tenantService.removeMember(id, userId, access);
    return { message: 'Member removed successfully' };
  }

  /**
   * 创建邀请码
   */
  @NeedLogin()
  @Post('organizations/:id/invite-codes')
  async createInviteCode(
    @Param('id') id: string,
    @Body() body: { role?: string; businessRole?: string; maxUses?: number; expiresDays?: number },
    @Req() req: Request,
  ) {
    const userId = req.userContext?.userId;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }
    const access = await this.assertOrgManager(id, req);

    const inviteCode = await this.tenantService.createInviteCode(
      id,
      userId,
      access,
      body.role,
      body.businessRole,
      body.maxUses,
      body.expiresDays,
    );

    return {
      inviteCode,
      message: 'Invite code created successfully',
    };
  }

  /**
   * 使用邀请码加入组织
   */
  @NeedLogin()
  @Post('join')
  async joinWithInviteCode(
    @Body('inviteCode') inviteCode: string,
    @Req() req: Request,
  ) {
    const userId = req.userContext?.userId;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    if (!inviteCode) {
      throw new BadRequestException('Invite code is required');
    }

    const organization = await this.tenantService.joinWithInviteCode(inviteCode, userId);
    return {
      id: organization.id,
      code: organization.code,
      name: organization.name,
      message: 'Successfully joined organization',
    };
  }

  /**
   * 获取连接统计（管理员接口）
   */
  @NeedLogin()
  @CanRole('admin')
  @Get('admin/connection-stats')
  async getConnectionStats(@Req() req: Request) {
    await this.tenantService.assertPlatformAdmin(req.userContext!.userId!);
    return {
      cachedConnections: this.tenantConnectionService.getCachedConnectionCount(),
      organizations: this.tenantConnectionService.getCachedOrganizations(),
    };
  }
}

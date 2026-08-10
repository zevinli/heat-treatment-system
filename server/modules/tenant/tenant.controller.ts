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
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
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
  @CanRole('admin')
  @Get('organizations/:id')
  async getOrganization(@Param('id') id: string) {
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
  @CanRole('admin')
  @Put('organizations/:id')
  async updateOrganization(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    const organization = await this.tenantService.update(id, dto);

    // 清除缓存的连接（如果配置有变更）
    if (dto.status === 'inactive' || dto.status === 'suspended') {
      const org = await this.tenantService.findById(id);
      if (org) {
        this.tenantConnectionService.clearConnection(org.code);
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
  @CanRole('admin')
  @Delete('organizations/:id')
  async deleteOrganization(@Param('id') id: string) {
    await this.tenantService.delete(id);
    return { message: 'Organization deleted successfully' };
  }

  /**
   * 添加成员到组织
   */
  @NeedLogin()
  @CanRole('admin')
  @Post('organizations/:id/members')
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddOrgMemberDto,
  ) {
    const member = await this.tenantService.addMember(id, dto);
    return {
      id: member.id,
      userId: member.userId,
      role: member.role,
      status: member.status,
      message: 'Member added successfully',
    };
  }

  /**
   * 移除成员
   */
  @NeedLogin()
  @CanRole('admin')
  @Delete('organizations/:id/members/:userId')
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    await this.tenantService.removeMember(id, userId);
    return { message: 'Member removed successfully' };
  }

  /**
   * 创建邀请码
   */
  @NeedLogin()
  @CanRole('admin')
  @Post('organizations/:id/invite-codes')
  async createInviteCode(
    @Param('id') id: string,
    @Body() body: { role?: string; maxUses?: number; expiresDays?: number },
    @Req() req: Request,
  ) {
    const userId = req.userContext?.userId;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const inviteCode = await this.tenantService.createInviteCode(
      id,
      userId,
      body.role,
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
  getConnectionStats() {
    return {
      cachedConnections: this.tenantConnectionService.getCachedConnectionCount(),
      organizations: this.tenantConnectionService.getCachedOrganizations(),
    };
  }
}

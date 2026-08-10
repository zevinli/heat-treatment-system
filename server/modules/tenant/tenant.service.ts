import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { eq, and, like, desc, sql } from 'drizzle-orm';
import { DRIZZLE_DATABASE } from '@lark-apaas/fullstack-nestjs-core';
import { organization, organizationUser, organizationInvite } from '../../database/schema';
import { TenantConnectionService } from './tenant-connection.service';
import { randomInt } from 'crypto';

export interface CreateOrganizationDto {
  code: string;
  name: string;
  dbHost?: string;
  dbPort?: number;
  dbUser?: string;
  dbPassword?: string;
  maxUsers?: number;
  maxStorageGb?: number;
  expiresAt?: Date;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  status?: 'active' | 'suspended' | 'inactive';
  maxUsers?: number;
  maxStorageGb?: number;
  expiresAt?: Date;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
}

export interface AddOrgMemberDto {
  userId: string;
  role?: 'super_admin' | 'admin' | 'member';
}

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly masterDb: any,
    private readonly tenantConnections: TenantConnectionService,
  ) {}

  /**
   * 创建新组织
   */
  async createOrganization(dto: CreateOrganizationDto, creatorId: string): Promise<typeof organization.$inferSelect> {
    // 检查组织编码是否已存在
    const existing = await this.masterDb
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.code, dto.code))
      .limit(1);

    if (existing.length > 0) {
      throw new BadRequestException(`Organization code '${dto.code}' already exists`);
    }

    const masterUrl = process.env.DATABASE_URL || process.env.SUDA_DATABASE_URL;
    let masterConfig: URL | undefined;
    if (masterUrl) {
      try { masterConfig = new URL(masterUrl); } catch { /* validation below */ }
    }

    // 默认在同一个受管 PostgreSQL 集群中创建独立数据库。
    const dbName = `db_tenant_${dto.code}`;
    const dbHost = dto.dbHost || masterConfig?.hostname;
    const dbPort = dto.dbPort || Number(masterConfig?.port || 5432);
    const dbUser = dto.dbUser || (masterConfig ? decodeURIComponent(masterConfig.username) : undefined);
    const dbPassword = dto.dbPassword || (masterConfig ? decodeURIComponent(masterConfig.password) : undefined);
    if (process.env.NODE_ENV === 'production' && (!dbHost || !dbUser || !dbPassword)) {
      throw new BadRequestException('无法从主数据库推导租户数据库配置，请提供完整数据库连接信息');
    }

    await this.tenantConnections.provisionTenantDatabase({
      code: dto.code,
      dbName,
      dbHost: dbHost || null,
      dbPort,
      dbUser: dbUser || null,
      dbPassword: dbPassword || null,
    });

    // 创建组织记录
    const result = await this.masterDb
      .insert(organization)
      .values({
        code: dto.code,
        name: dto.name,
        dbName: dbName,
        dbHost,
        dbPort,
        dbUser,
        dbPassword,
        maxUsers: dto.maxUsers || 50,
        maxStorageGb: dto.maxStorageGb || 10,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        description: dto.description,
        status: 'active',
        isActive: true,
      })
      .returning();

    const newOrg = result[0];

    // 将创建者添加为超级管理员
    await this.masterDb.insert(organizationUser).values({
      orgId: newOrg.id,
      userId: creatorId,
      role: 'super_admin',
      status: 'active',
    });

    this.logger.log(`Organization created: ${dto.code} by ${creatorId}`);

    return newOrg;
  }

  /**
   * 获取组织列表
   */
  async findAll(params: {
    search?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: (typeof organization.$inferSelect)[]; total: number; page: number; pageSize: number }> {
    const { search, status, page = 1, pageSize = 20 } = params;

    const conditions = [];
    if (search) {
      conditions.push(
        like(organization.name, `%${search}%`),
      );
    }
    if (status) {
      conditions.push(eq(organization.status, status));
    }

    const offset = (page - 1) * pageSize;

    // 查询总数
    const countResult = conditions.length > 0
      ? await this.masterDb.select({ count: sql<number>`count(*)` }).from(organization).where(and(...conditions))
      : await this.masterDb.select({ count: sql<number>`count(*)` }).from(organization);

    const total = countResult[0]?.count || 0;

    // 查询数据
    const query = conditions.length > 0
      ? this.masterDb.select().from(organization).where(and(...conditions)).orderBy(desc(organization.createdAt)).limit(pageSize).offset(offset)
      : this.masterDb.select().from(organization).orderBy(desc(organization.createdAt)).limit(pageSize).offset(offset);

    const items = await query;

    return { items, total, page, pageSize };
  }

  /**
   * 根据ID获取组织
   */
  async findById(id: string): Promise<typeof organization.$inferSelect | null> {
    const result = await this.masterDb
      .select()
      .from(organization)
      .where(eq(organization.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * 根据编码获取组织
   */
  async findByCode(code: string): Promise<typeof organization.$inferSelect | null> {
    const result = await this.masterDb
      .select()
      .from(organization)
      .where(eq(organization.code, code))
      .limit(1);

    return result[0] || null;
  }

  /**
   * 更新组织
   */
  async update(id: string, dto: UpdateOrganizationDto): Promise<typeof organization.$inferSelect> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`Organization not found: ${id}`);
    }

    const result = await this.masterDb
      .update(organization)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(organization.id, id))
      .returning();

    this.logger.log(`Organization updated: ${id}`);
    return result[0];
  }

  /**
   * 删除组织
   */
  async delete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`Organization not found: ${id}`);
    }

    // 软删除：将状态设置为 inactive
    await this.masterDb
      .update(organization)
      .set({
        status: 'inactive',
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(organization.id, id));

    this.logger.log(`Organization deleted (soft): ${id}`);
  }

  /**
   * 获取用户的组织列表
   */
  async findUserOrganizations(userId: string): Promise<(typeof organization.$inferSelect & { role: string })[]> {
    const result = await this.masterDb
      .select({
        org: organization,
        role: organizationUser.role,
      })
      .from(organizationUser)
      .innerJoin(organization, eq(organizationUser.orgId, organization.id))
      .where(
        and(
          eq(organizationUser.userId, userId),
          eq(organizationUser.status, 'active'),
          eq(organization.status, 'active'),
        ),
      )
      .orderBy(desc(organizationUser.joinedAt));

    return result.map(r => ({ ...r.org, role: r.role }));
  }

  /**
   * 添加成员到组织
   */
  async addMember(orgId: string, dto: AddOrgMemberDto): Promise<typeof organizationUser.$inferSelect> {
    // 检查组织是否存在
    const org = await this.findById(orgId);
    if (!org) {
      throw new NotFoundException(`Organization not found: ${orgId}`);
    }

    // 检查是否已存在
    const existing = await this.masterDb
      .select({ id: organizationUser.id })
      .from(organizationUser)
      .where(
        and(
          eq(organizationUser.orgId, orgId),
          eq(organizationUser.userId, dto.userId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new BadRequestException('User already exists in this organization');
    }

    // 检查成员数限制
    const memberCount = await this.masterDb
      .select({ count: sql<number>`count(*)` })
      .from(organizationUser)
      .where(
        and(
          eq(organizationUser.orgId, orgId),
          eq(organizationUser.status, 'active'),
        ),
      );

    if (memberCount[0]?.count >= org.maxUsers) {
      throw new ForbiddenException('Organization member limit reached');
    }

    const result = await this.masterDb
      .insert(organizationUser)
      .values({
        orgId,
        userId: dto.userId,
        role: dto.role || 'member',
        status: 'active',
      })
      .returning();

    this.logger.log(`Member added to org ${orgId}: ${dto.userId}`);
    return result[0];
  }

  /**
   * 移除成员
   */
  async removeMember(orgId: string, userId: string): Promise<void> {
    await this.masterDb
      .update(organizationUser)
      .set({
        status: 'inactive',
      })
      .where(
        and(
          eq(organizationUser.orgId, orgId),
          eq(organizationUser.userId, userId),
        ),
      );

    this.logger.log(`Member removed from org ${orgId}: ${userId}`);
  }

  /**
   * 创建邀请码
   */
  async createInviteCode(
    orgId: string,
    createdBy: string,
    role: string = 'member',
    maxUses: number = 1,
    expiresDays: number = 7,
  ): Promise<string> {
    const inviteCode = this.generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresDays);

    await this.masterDb.insert(organizationInvite).values({
      orgId,
      inviteCode,
      role,
      maxUses,
      usedCount: 0,
      expiresAt,
      createdBy,
    });

    this.logger.log(`Invite code created for org ${orgId}`);
    return inviteCode;
  }

  /**
   * 使用邀请码加入组织
   */
  async joinWithInviteCode(inviteCode: string, userId: string): Promise<typeof organization.$inferSelect> {
    // 查询邀请码
    const invite = await this.masterDb
      .select()
      .from(organizationInvite)
      .where(eq(organizationInvite.inviteCode, inviteCode))
      .limit(1);

    if (!invite[0]) {
      throw new NotFoundException('Invalid invite code');
    }

    const inviteData = invite[0];

    // 检查是否过期
    if (inviteData.expiresAt && new Date(inviteData.expiresAt) < new Date()) {
      throw new ForbiddenException('Invite code expired');
    }

    // 检查使用次数
    if (inviteData.usedCount >= inviteData.maxUses) {
      throw new ForbiddenException('Invite code usage limit reached');
    }

    // 添加成员
    await this.addMember(inviteData.orgId, {
      userId,
      role: inviteData.role as 'super_admin' | 'admin' | 'member',
    });

    // 更新使用次数
    await this.masterDb
      .update(organizationInvite)
      .set({
        usedCount: inviteData.usedCount + 1,
      })
      .where(eq(organizationInvite.id, inviteData.id));

    // 返回组织信息
    const org = await this.findById(inviteData.orgId);
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  /**
   * 生成随机密码
   */
  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(randomInt(chars.length));
    }
    return password;
  }

  /**
   * 生成邀请码
   */
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(randomInt(chars.length));
    }
    return code;
  }
}

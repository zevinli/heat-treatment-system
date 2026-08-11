import { Injectable, Logger, BadRequestException, ConflictException, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { eq, and, like, desc, sql } from 'drizzle-orm';
import { DRIZZLE_DATABASE } from '@lark-apaas/fullstack-nestjs-core';
import { appUserTable, organization, organizationUser, organizationInvite } from '../../database/schema';
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
  businessRole?: 'admin' | 'operator' | 'finance' | 'viewer';
}

export type OrganizationManagerAccess = 'platform_admin' | 'super_admin' | 'admin';

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
    const code = dto.code?.trim().toLowerCase();
    const name = dto.name?.trim();
    if (!code || !/^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(code)) {
      throw new BadRequestException('组织编码需为1-50位小写字母、数字或连字符，且不能以连字符开头或结尾');
    }
    if (!name || name.length > 100) throw new BadRequestException('组织名称不能为空且不能超过100个字符');
    if ((dto.dbHost || dto.dbUser || dto.dbPassword || dto.dbPort) && process.env.ALLOW_CUSTOM_TENANT_DATABASE !== 'true') {
      throw new ForbiddenException('当前部署不允许由请求指定租户数据库连接');
    }
    const maxUsers = dto.maxUsers ?? 50;
    const maxStorageGb = dto.maxStorageGb ?? 10;
    if (!Number.isInteger(maxUsers) || maxUsers < 1 || maxUsers > 10_000) throw new BadRequestException('组织成员上限必须为1-10000的整数');
    if (!Number.isFinite(maxStorageGb) || maxStorageGb <= 0 || maxStorageGb > 100_000) throw new BadRequestException('存储上限必须大于0且不超过100000GB');
    // 检查组织编码是否已存在
    const existing = await this.masterDb
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.code, code))
      .limit(1);

    if (existing.length > 0) {
      throw new BadRequestException(`Organization code '${code}' already exists`);
    }

    const masterUrl = process.env.DATABASE_URL || process.env.SUDA_DATABASE_URL;
    let masterConfig: URL | undefined;
    if (masterUrl) {
      try { masterConfig = new URL(masterUrl); } catch { /* validation below */ }
    }

    // 默认在同一个受管 PostgreSQL 集群中创建独立数据库。
    const dbName = `db_tenant_${code.replace(/-/g, '_')}`;
    const dbHost = dto.dbHost || masterConfig?.hostname;
    const dbPort = dto.dbPort || Number(masterConfig?.port || 5432);
    const dbUser = dto.dbUser || (masterConfig ? decodeURIComponent(masterConfig.username) : undefined);
    const dbPassword = dto.dbPassword || (masterConfig ? decodeURIComponent(masterConfig.password) : undefined);
    if (process.env.NODE_ENV === 'production' && (!dbHost || !dbUser || !dbPassword)) {
      throw new BadRequestException('无法从主数据库推导租户数据库配置，请提供完整数据库连接信息');
    }

    await this.tenantConnections.provisionTenantDatabase({
      code,
      dbName,
      dbHost: dbHost || null,
      dbPort,
      dbUser: dbUser || null,
      dbPassword: dbPassword || null,
    });

    let newOrg: typeof organization.$inferSelect;
    try {
      newOrg = await this.masterDb.transaction(async (tx: any) => {
        const [created] = await tx.insert(organization).values({
          code,
          name,
          dbName,
          dbHost,
          dbPort,
          dbUser,
          dbPassword,
          maxUsers,
          maxStorageGb,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
          contactName: dto.contactName?.trim() || null,
          contactPhone: dto.contactPhone?.trim() || null,
          contactEmail: dto.contactEmail?.trim() || null,
          description: dto.description?.trim() || null,
          status: 'active',
          isActive: true,
        }).returning();
        await tx.insert(organizationUser).values({
          orgId: created.id,
          userId: creatorId,
          role: 'super_admin',
          businessRole: 'admin',
          status: 'active',
        });
        return created;
      });
    } catch (error: any) {
      if (error?.code === '23505') throw new ConflictException(`组织编码 '${code}' 已存在`);
      throw error;
    }

    this.logger.log(`Organization created: ${code} by ${creatorId}`);

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
  }): Promise<{ items: Omit<typeof organization.$inferSelect, 'dbUser' | 'dbPassword'>[]; total: number; page: number; pageSize: number }> {
    const search = params.search?.trim();
    const status = params.status?.trim();
    if (status && !['active', 'suspended', 'inactive'].includes(status)) throw new BadRequestException('无效组织状态');
    const page = Number.isInteger(params.page) && (params.page as number) > 0 ? params.page as number : 1;
    const pageSize = Number.isInteger(params.pageSize) && (params.pageSize as number) > 0
      ? Math.min(params.pageSize as number, 100)
      : 20;

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

    const rows = await query;
    // 数据库账号和密码只供服务端连接池使用，绝不返回浏览器。
    const items = rows.map(({ dbUser: _dbUser, dbPassword: _dbPassword, ...item }: typeof organization.$inferSelect) => item);

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

    if (dto.name !== undefined && (!dto.name.trim() || dto.name.trim().length > 100)) throw new BadRequestException('组织名称不能为空且不能超过100个字符');
    if (dto.status !== undefined && !['active', 'suspended', 'inactive'].includes(dto.status)) throw new BadRequestException('无效组织状态');
    if (dto.maxUsers !== undefined && (!Number.isInteger(dto.maxUsers) || dto.maxUsers < 1 || dto.maxUsers > 10_000)) throw new BadRequestException('组织成员上限必须为1-10000的整数');
    if (dto.maxStorageGb !== undefined && (!Number.isFinite(dto.maxStorageGb) || dto.maxStorageGb <= 0 || dto.maxStorageGb > 100_000)) throw new BadRequestException('存储上限必须大于0且不超过100000GB');
    const updates = {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.status !== undefined ? { status: dto.status, isActive: dto.status === 'active' } : {}),
      ...(dto.maxUsers !== undefined ? { maxUsers: dto.maxUsers } : {}),
      ...(dto.maxStorageGb !== undefined ? { maxStorageGb: dto.maxStorageGb } : {}),
      ...(dto.expiresAt !== undefined ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null } : {}),
      ...(dto.contactName !== undefined ? { contactName: dto.contactName.trim() || null } : {}),
      ...(dto.contactPhone !== undefined ? { contactPhone: dto.contactPhone.trim() || null } : {}),
      ...(dto.contactEmail !== undefined ? { contactEmail: dto.contactEmail.trim() || null } : {}),
      ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
      updatedAt: new Date(),
    };
    const result = await this.masterDb
      .update(organization)
      .set(updates)
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
  async findUserOrganizations(userId: string): Promise<(typeof organization.$inferSelect & { role: string; businessRole: string })[]> {
    const result = await this.masterDb
      .select({
        org: organization,
        role: organizationUser.role,
        businessRole: organizationUser.businessRole,
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

    return result.map(r => ({ ...r.org, role: r.role, businessRole: r.businessRole }));
  }

  /**
   * 添加成员到组织
   */
  async addMember(
    orgId: string,
    dto: AddOrgMemberDto,
    actorAccess: OrganizationManagerAccess,
  ): Promise<typeof organizationUser.$inferSelect> {
    if (dto.role === 'super_admin' && !['platform_admin', 'super_admin'].includes(actorAccess)) {
      throw new ForbiddenException('只有组织超级管理员可以授予超级管理员角色');
    }
    return this.masterDb.transaction((tx: any) => this.addMemberInTransaction(tx, orgId, dto));
  }

  private async addMemberInTransaction(database: any, orgId: string, dto: AddOrgMemberDto): Promise<typeof organizationUser.$inferSelect> {
    if (!dto.userId?.trim()) throw new BadRequestException('User id is required');
    if (dto.role && !['super_admin', 'admin', 'member'].includes(dto.role)) {
      throw new BadRequestException('Invalid organization role');
    }
    if (dto.businessRole && !['admin', 'operator', 'finance', 'viewer'].includes(dto.businessRole)) {
      throw new BadRequestException('Invalid business role');
    }
    const [account] = await database.select({ id: appUserTable.id }).from(appUserTable)
      .where(eq(appUserTable.id, dto.userId)).limit(1);
    if (!account) throw new NotFoundException('User account not found');
    // 锁住组织行，把成员上限检查和插入串行化，避免并发请求突破 maxUsers。
    const [org] = await database.select().from(organization)
      .where(eq(organization.id, orgId)).for('update');
    if (!org) {
      throw new NotFoundException(`Organization not found: ${orgId}`);
    }
    if (org.status !== 'active' || !org.isActive) {
      throw new ForbiddenException('Organization is not active');
    }

    const existing = await database
      .select({ id: organizationUser.id, status: organizationUser.status })
      .from(organizationUser)
      .where(
        and(
          eq(organizationUser.orgId, orgId),
          eq(organizationUser.userId, dto.userId),
        ),
      )
      .limit(1);

    if (existing[0]?.status === 'active') {
      throw new BadRequestException('User already exists in this organization');
    }

    // 检查成员数限制
    const memberCount = await database
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

    if (existing[0]) {
      const [reactivated] = await database.update(organizationUser).set({
        role: dto.role || 'member',
        businessRole: dto.role && dto.role !== 'member' ? 'admin' : (dto.businessRole || 'operator'),
        status: 'active',
        joinedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(organizationUser.id, existing[0].id)).returning();
      return reactivated;
    }

    const result = await database.insert(organizationUser).values({
        orgId,
        userId: dto.userId,
        role: dto.role || 'member',
        businessRole: dto.role && dto.role !== 'member' ? 'admin' : (dto.businessRole || 'operator'),
        status: 'active',
      })
      .returning();

    this.logger.log(`Member added to org ${orgId}: ${dto.userId}`);
    return result[0];
  }

  /** 平台管理员，或当前组织的 super_admin/admin，才可管理该组织。 */
  async assertCanManageOrganization(
    orgId: string,
    userId: string,
    accountRole?: string,
  ): Promise<OrganizationManagerAccess> {
    if (accountRole === 'admin') {
      await this.assertPlatformAdmin(userId);
      return 'platform_admin';
    }
    const [membership] = await this.masterDb.select({ role: organizationUser.role })
      .from(organizationUser)
      .where(and(
        eq(organizationUser.orgId, orgId),
        eq(organizationUser.userId, userId),
        eq(organizationUser.status, 'active'),
      )).limit(1);
    if (!membership || !['super_admin', 'admin'].includes(membership.role || '')) {
      throw new ForbiddenException('You are not an administrator of this organization');
    }
    return membership.role as OrganizationManagerAccess;
  }

  async assertPlatformAdmin(userId: string): Promise<void> {
    const [account] = await this.masterDb.select({ role: appUserTable.role, status: appUserTable.status })
      .from(appUserTable)
      .where(eq(appUserTable.id, userId))
      .limit(1);
    if (!account || account.status !== 'active' || account.role !== 'admin') {
      throw new ForbiddenException('仅平台管理员可执行此操作');
    }
  }

  async assertOrganizationMembership(orgId: string, userId: string): Promise<void> {
    const [membership] = await this.masterDb.select({ id: organizationUser.id })
      .from(organizationUser)
      .where(and(
        eq(organizationUser.orgId, orgId),
        eq(organizationUser.userId, userId),
        eq(organizationUser.status, 'active'),
      ))
      .limit(1);
    if (!membership) throw new ForbiddenException('您不是该组织的有效成员');
  }

  /** 供业务单据展示制单人使用，只返回组织内可公开的最小身份信息。 */
  async listMemberDirectory(orgId: string) {
    return this.masterDb.select({
      userId: organizationUser.userId,
      name: appUserTable.name,
    }).from(organizationUser)
      // organization_user.user_id 是历史 VARCHAR 字段，而 app_user.id 是 UUID。
      // 显式把 UUID 转成 text，兼容既有数据库并避免 PostgreSQL 的 varchar = uuid 错误。
      .innerJoin(appUserTable, eq(organizationUser.userId, sql<string>`${appUserTable.id}::text`))
      .where(and(
        eq(organizationUser.orgId, orgId),
        eq(organizationUser.status, 'active'),
        eq(appUserTable.status, 'active'),
      ))
      .orderBy(appUserTable.name);
  }

  async listMembers(orgId: string) {
    return this.masterDb.select({
      id: organizationUser.id,
      userId: organizationUser.userId,
      username: appUserTable.username,
      name: appUserTable.name,
      department: appUserTable.department,
      accountStatus: appUserTable.status,
      role: organizationUser.role,
      businessRole: organizationUser.businessRole,
      status: organizationUser.status,
      joinedAt: organizationUser.joinedAt,
    }).from(organizationUser)
      .innerJoin(appUserTable, eq(organizationUser.userId, sql<string>`${appUserTable.id}::text`))
      .where(and(eq(organizationUser.orgId, orgId), eq(organizationUser.status, 'active')))
      .orderBy(desc(organizationUser.joinedAt));
  }

  async updateMember(
    orgId: string,
    userId: string,
    dto: { role?: 'super_admin' | 'admin' | 'member'; businessRole?: 'admin' | 'operator' | 'finance' | 'viewer' },
    actorAccess: OrganizationManagerAccess,
  ) {
    if (dto.role !== undefined && !['super_admin', 'admin', 'member'].includes(dto.role)) {
      throw new BadRequestException('Invalid organization role');
    }
    if (dto.businessRole !== undefined && !['admin', 'operator', 'finance', 'viewer'].includes(dto.businessRole)) {
      throw new BadRequestException('Invalid business role');
    }
    return this.masterDb.transaction(async (tx: any) => {
      await tx.select({ id: organization.id }).from(organization).where(eq(organization.id, orgId)).for('update');
      const [member] = await tx.select().from(organizationUser).where(and(
        eq(organizationUser.orgId, orgId),
        eq(organizationUser.userId, userId),
        eq(organizationUser.status, 'active'),
      )).limit(1);
      if (!member) throw new NotFoundException('Organization member not found');
      const nextRole = dto.role || member.role || 'member';
      if ((member.role === 'super_admin' || nextRole === 'super_admin') && !['platform_admin', 'super_admin'].includes(actorAccess)) {
        throw new ForbiddenException('只有组织超级管理员可管理超级管理员角色');
      }
      if (member.role === 'super_admin' && nextRole !== 'super_admin') {
        const [{ count }] = await tx.select({ count: sql<number>`count(*)::int` }).from(organizationUser).where(and(
          eq(organizationUser.orgId, orgId),
          eq(organizationUser.role, 'super_admin'),
          eq(organizationUser.status, 'active'),
        ));
        if (count <= 1) throw new BadRequestException('组织必须保留至少一名超级管理员');
      }
      const [updated] = await tx.update(organizationUser).set({
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        businessRole: nextRole === 'member' ? (dto.businessRole || member.businessRole || 'operator') : 'admin',
        updatedAt: new Date(),
      }).where(eq(organizationUser.id, member.id)).returning();
      return updated;
    });
  }

  /**
   * 移除成员
   */
  async removeMember(orgId: string, userId: string, actorAccess: OrganizationManagerAccess): Promise<void> {
    await this.masterDb.transaction(async (tx: any) => {
      await tx.select({ id: organization.id }).from(organization)
        .where(eq(organization.id, orgId)).for('update');
      const [member] = await tx.select().from(organizationUser).where(and(
        eq(organizationUser.orgId, orgId),
        eq(organizationUser.userId, userId),
        eq(organizationUser.status, 'active'),
      )).limit(1);
      if (!member) throw new NotFoundException('Organization member not found');
      if (member.role === 'super_admin' && !['platform_admin', 'super_admin'].includes(actorAccess)) {
        throw new ForbiddenException('组织管理员不能移除超级管理员');
      }
      if (member.role === 'super_admin') {
        const [{ count }] = await tx.select({ count: sql<number>`count(*)::int` }).from(organizationUser).where(and(
          eq(organizationUser.orgId, orgId),
          eq(organizationUser.role, 'super_admin'),
          eq(organizationUser.status, 'active'),
        ));
        if (count <= 1) throw new BadRequestException('组织必须保留至少一名超级管理员');
      }
      await tx.update(organizationUser).set({ status: 'inactive', updatedAt: new Date() })
        .where(eq(organizationUser.id, member.id));
    });

    this.logger.log(`Member removed from org ${orgId}: ${userId}`);
  }

  /**
   * 创建邀请码
   */
  async createInviteCode(
    orgId: string,
    createdBy: string,
    actorAccess: OrganizationManagerAccess,
    role: string = 'member',
    businessRole: string = 'operator',
    maxUses: number = 1,
    expiresDays: number = 7,
  ): Promise<string> {
    if (!['super_admin', 'admin', 'member'].includes(role)) throw new BadRequestException('Invalid invite role');
    if (!['admin', 'operator', 'finance', 'viewer'].includes(businessRole)) throw new BadRequestException('Invalid business role');
    if (role === 'super_admin' && !['platform_admin', 'super_admin'].includes(actorAccess)) {
      throw new ForbiddenException('只有组织超级管理员可以创建超级管理员邀请码');
    }
    if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 1000) throw new BadRequestException('maxUses must be between 1 and 1000');
    if (!Number.isInteger(expiresDays) || expiresDays < 1 || expiresDays > 365) throw new BadRequestException('expiresDays must be between 1 and 365');
    const inviteCode = this.generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresDays);

    await this.masterDb.insert(organizationInvite).values({
      orgId,
      inviteCode,
      role,
      businessRole: role === 'member' ? businessRole : 'admin',
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
    return this.masterDb.transaction(async (tx: any) => {
    // 锁住邀请码，确保“检查次数→增加次数”在并发加入时是原子的。
    const invite = await tx
      .select()
      .from(organizationInvite)
      .where(eq(organizationInvite.inviteCode, inviteCode))
      .limit(1)
      .for('update');

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
    await this.addMemberInTransaction(tx, inviteData.orgId, {
      userId,
      role: inviteData.role as 'super_admin' | 'admin' | 'member',
      businessRole: inviteData.businessRole as 'admin' | 'operator' | 'finance' | 'viewer',
    });

    // 更新使用次数
    await tx
      .update(organizationInvite)
      .set({
        usedCount: inviteData.usedCount + 1,
      })
      .where(eq(organizationInvite.id, inviteData.id));

    // 返回组织信息
    const [org] = await tx.select().from(organization).where(eq(organization.id, inviteData.orgId)).limit(1);
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
    });
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

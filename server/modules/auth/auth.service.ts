import { BadRequestException, Inject, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import { and, desc, eq, gt, isNull, lt, ne, sql } from 'drizzle-orm';
import { DRIZZLE_DATABASE } from '@lark-apaas/fullstack-nestjs-core';
import { appUserTable, authSessionTable } from '../../database/schema';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: any,
    private readonly tokens: TokenService,
  ) {}

  private hashPassword(password: string, salt = randomBytes(16).toString('hex')): string {
    return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
  }

  private verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const expected = Buffer.from(hash, 'hex');
    const actual = scryptSync(password, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  private async ensureBootstrapAdmin(username: string, password: string) {
    const [{ count }] = await this.db.select({ count: sql<number>`count(*)::int` }).from(appUserTable);
    if (count > 0) return;
    const configuredUser = process.env.INITIAL_ADMIN_USERNAME || (process.env.NODE_ENV !== 'production' ? 'admin' : '');
    const configuredPassword = process.env.INITIAL_ADMIN_PASSWORD || (process.env.NODE_ENV !== 'production' ? 'admin123' : '');
    if (!configuredUser || !configuredPassword) {
      throw new ServiceUnavailableException('系统尚未初始化管理员，请配置 INITIAL_ADMIN_USERNAME 和 INITIAL_ADMIN_PASSWORD');
    }
    if (username !== configuredUser || password !== configuredPassword) return;
    await this.db.insert(appUserTable).values({
      username: configuredUser,
      passwordHash: this.hashPassword(configuredPassword),
      name: '系统管理员',
      role: 'admin',
      department: '管理部',
      deviceLimit: 3,
    });
  }

  async login(username: string, password: string, deviceName?: string) {
    if (!username?.trim() || !password) throw new BadRequestException('请输入用户名和密码');
    await this.ensureBootstrapAdmin(username.trim(), password);
    const [user] = await this.db.select().from(appUserTable).where(eq(appUserTable.username, username.trim())).limit(1);
    if (!user || user.status !== 'active' || !this.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    await this.db.delete(authSessionTable).where(lt(authSessionTable.expiresAt, new Date()));
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(authSessionTable)
      .where(and(eq(authSessionTable.userId, user.id), isNull(authSessionTable.revokedAt), gt(authSessionTable.expiresAt, new Date())));
    if (count >= user.deviceLimit) throw new UnauthorizedException(`已达到最大登录设备数 ${user.deviceLimit}，请先退出其他设备`);

    const tokenId = randomUUID();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const token = this.tokens.sign({ sub: user.id, username: user.username, name: user.name, role: user.role, jti: tokenId });
    await this.db.insert(authSessionTable).values({ userId: user.id, tokenId, deviceName: deviceName?.slice(0, 255), expiresAt });
    await this.db.update(appUserTable).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(appUserTable.id, user.id));
    return { token, expiresAt, user: this.toPublicUser(user) };
  }

  async logout(tokenId: string) {
    await this.db.update(authSessionTable).set({ revokedAt: new Date() }).where(eq(authSessionTable.tokenId, tokenId));
    return { success: true };
  }

  async getMe(id: string) {
    const [user] = await this.db.select().from(appUserTable).where(eq(appUserTable.id, id)).limit(1);
    if (!user) throw new UnauthorizedException('用户不存在');
    return this.toPublicUser(user);
  }

  async updateSelf(id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    department?: string;
    position?: string;
    location?: string;
  }) {
    const name = data.name?.trim();
    if (data.name !== undefined && !name) throw new BadRequestException('姓名不能为空');
    const email = data.email?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('邮箱格式不正确');
    const phone = data.phone?.trim();
    if (phone && !/^[0-9+()\-\s]{6,30}$/.test(phone)) throw new BadRequestException('手机号格式不正确');
    if (data.avatar && data.avatar.length > 1_500_000) throw new BadRequestException('头像数据过大');
    if (data.avatar && !data.avatar.startsWith('data:image/') && !data.avatar.startsWith('https://')) {
      throw new BadRequestException('头像地址不合法');
    }
    const [updated] = await this.db.update(appUserTable).set({
      ...(data.name !== undefined ? { name } : {}),
      ...(data.email !== undefined ? { email: email || null } : {}),
      ...(data.phone !== undefined ? { phone: phone || null } : {}),
      ...(data.avatar !== undefined ? { avatar: data.avatar || null } : {}),
      ...(data.department !== undefined ? { department: data.department.trim() || null } : {}),
      ...(data.position !== undefined ? { position: data.position.trim() || null } : {}),
      ...(data.location !== undefined ? { location: data.location.trim() || null } : {}),
      updatedAt: new Date(),
    }).where(eq(appUserTable.id, id)).returning();
    if (!updated) throw new UnauthorizedException('用户不存在');
    return this.toPublicUser(updated);
  }

  async changePassword(id: string, tokenId: string, currentPassword: string, newPassword: string) {
    if (!currentPassword) throw new BadRequestException('请输入当前密码');
    if (!newPassword || newPassword.length < 8) throw new BadRequestException('新密码至少8位');
    if (currentPassword === newPassword) throw new BadRequestException('新密码不能与当前密码相同');
    const [user] = await this.db.select().from(appUserTable).where(eq(appUserTable.id, id)).limit(1);
    if (!user || !this.verifyPassword(currentPassword, user.passwordHash)) {
      throw new BadRequestException('当前密码错误');
    }
    await this.db.update(appUserTable).set({
      passwordHash: this.hashPassword(newPassword),
      updatedAt: new Date(),
    }).where(eq(appUserTable.id, id));
    // 保留当前会话，撤销其他设备，避免改密后把正在操作的用户立即踢出。
    await this.db.update(authSessionTable).set({ revokedAt: new Date() })
      .where(and(
        eq(authSessionTable.userId, id),
        isNull(authSessionTable.revokedAt),
        ne(authSessionTable.tokenId, tokenId),
      ));
    return { success: true };
  }

  async listUsers() {
    const rows = await this.db.select().from(appUserTable).orderBy(desc(appUserTable.createdAt));
    return rows.map((user: any) => this.toPublicUser(user));
  }

  async createUser(data: {
    username: string;
    password: string;
    name: string;
    role: string;
    department?: string;
    deviceLimit?: number;
  }) {
    const username = data.username?.trim();
    const name = data.name?.trim();
    if (!username || !/^[A-Za-z0-9_.-]{3,50}$/.test(username)) {
      throw new BadRequestException('用户名需为3-50位字母、数字、点、横线或下划线');
    }
    if (!name) throw new BadRequestException('姓名不能为空');
    if (!data.password || data.password.length < 8) throw new BadRequestException('初始密码至少8位');
    if (!['admin', 'operator', 'finance', 'viewer'].includes(data.role)) throw new BadRequestException('无效角色');
    const deviceLimit = Number(data.deviceLimit || 3);
    if (!Number.isInteger(deviceLimit) || deviceLimit < 1 || deviceLimit > 10) {
      throw new BadRequestException('设备上限必须为1-10的整数');
    }
    const [duplicate] = await this.db.select({ id: appUserTable.id }).from(appUserTable)
      .where(eq(appUserTable.username, username)).limit(1);
    if (duplicate) throw new BadRequestException('用户名已存在');
    const [created] = await this.db.insert(appUserTable).values({
      username,
      passwordHash: this.hashPassword(data.password),
      name,
      role: data.role,
      department: data.department?.trim() || null,
      deviceLimit,
      status: 'active',
    }).returning();
    return this.toPublicUser(created);
  }

  async updateUser(id: string, actorId: string, data: {
    name?: string;
    role?: string;
    department?: string;
    status?: 'active' | 'inactive';
    deviceLimit?: number;
  }) {
    const [existing] = await this.db.select().from(appUserTable).where(eq(appUserTable.id, id));
    if (!existing) throw new BadRequestException('用户不存在');
    if (id === actorId && (data.status === 'inactive' || (data.role && data.role !== existing.role))) {
      throw new BadRequestException('不能禁用自己或修改自己的角色');
    }
    if (data.role && !['admin', 'operator', 'finance', 'viewer'].includes(data.role)) {
      throw new BadRequestException('无效角色');
    }
    if (data.deviceLimit !== undefined && (!Number.isInteger(data.deviceLimit) || data.deviceLimit < 1 || data.deviceLimit > 10)) {
      throw new BadRequestException('设备上限必须为1-10的整数');
    }
    if (existing.role === 'admin' && (data.status === 'inactive' || (data.role && data.role !== 'admin'))) {
      const [{ count }] = await this.db.select({ count: sql<number>`count(*)::int` }).from(appUserTable)
        .where(and(eq(appUserTable.role, 'admin'), eq(appUserTable.status, 'active'), ne(appUserTable.id, id)));
      if (count === 0) throw new BadRequestException('系统必须保留至少一个启用的管理员');
    }
    const [updated] = await this.db.update(appUserTable).set({
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.department !== undefined ? { department: data.department.trim() || null } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.deviceLimit !== undefined ? { deviceLimit: data.deviceLimit } : {}),
      updatedAt: new Date(),
    }).where(eq(appUserTable.id, id)).returning();
    if (data.status === 'inactive' || data.role !== undefined) {
      await this.db.update(authSessionTable).set({ revokedAt: new Date() })
        .where(and(eq(authSessionTable.userId, id), isNull(authSessionTable.revokedAt)));
    }
    return this.toPublicUser(updated);
  }

  async resetPassword(id: string, password: string) {
    if (!password || password.length < 8) throw new BadRequestException('新密码至少8位');
    const [updated] = await this.db.update(appUserTable).set({
      passwordHash: this.hashPassword(password), updatedAt: new Date(),
    }).where(eq(appUserTable.id, id)).returning({ id: appUserTable.id });
    if (!updated) throw new BadRequestException('用户不存在');
    await this.db.update(authSessionTable).set({ revokedAt: new Date() })
      .where(and(eq(authSessionTable.userId, id), isNull(authSessionTable.revokedAt)));
    return { success: true };
  }

  toPublicUser(user: any) {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      position: user.position,
      location: user.location,
      status: user.status,
      deviceLimit: user.deviceLimit,
      lastLogin: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}

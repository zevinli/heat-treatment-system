import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { eq, and, sql, desc, isNull, ne } from 'drizzle-orm';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { TENANT_DATABASE } from '../../common/tenant-database.provider';
import {
  rolePermissionTable,
  customerTable,
  productTable,
  inboundOrderTable,
  inboundDetailTable,
  outboundOrderTable,
  outboundDetailTable,
  reconciliationTable,
  reconciliationDetailTable,
  inventoryRecordTable,
  productBatchTable,
  productBatchStockTable,
  operationLogTable,
  undoLogTable,
  statisticsDailyTable,
  qualityInspectionTable,
  approvalRequestTable,
  outboundBatchDetailTable,
  appUserTable,
  authSessionTable,
} from '../../database/schema';

export type PermissionCode =
  | 'customer:view' | 'customer:create' | 'customer:update' | 'customer:delete'
  | 'product:view' | 'product:create' | 'product:update' | 'product:delete'
  | 'inbound:view' | 'inbound:create' | 'inbound:undo'
  | 'outbound:view' | 'outbound:create' | 'outbound:delete' | 'outbound:undo'
  | 'inventory:view' | 'inventory:adjust' | 'inventory:request-adjust' | 'inventory:approve'
  | 'reconciliation:view' | 'reconciliation:create' | 'reconciliation:audit' | 'reconciliation:unaudit'
  | 'statistics:view'
  | 'system:settings' | 'system:permission';

export const ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  admin: [
    'customer:view', 'customer:create', 'customer:update', 'customer:delete',
    'product:view', 'product:create', 'product:update', 'product:delete',
    'inbound:view', 'inbound:create', 'inbound:undo',
    'outbound:view', 'outbound:create', 'outbound:delete', 'outbound:undo',
    'inventory:view', 'inventory:adjust', 'inventory:request-adjust', 'inventory:approve',
    'reconciliation:view', 'reconciliation:create', 'reconciliation:audit', 'reconciliation:unaudit',
    'statistics:view',
    'system:settings', 'system:permission',
  ],
  operator: [
    'customer:view', 'customer:create', 'customer:update',
    'product:view', 'product:create', 'product:update',
    'inbound:view', 'inbound:create', 'inbound:undo',
    'outbound:view', 'outbound:create', 'outbound:undo',
    'inventory:view', 'inventory:request-adjust',
    'reconciliation:view',
    'statistics:view',
  ],
  finance: [
    'customer:view',
    'product:view',
    'inbound:view',
    'outbound:view',
    'inventory:view',
    'reconciliation:view', 'reconciliation:create', 'reconciliation:audit', 'reconciliation:unaudit',
    'statistics:view',
  ],
  viewer: [
    'customer:view',
    'product:view',
    'inbound:view',
    'outbound:view',
    'inventory:view',
    'reconciliation:view',
    'statistics:view',
  ],
};

@Injectable()
export class PermissionService {
  constructor(
    @Inject(TENANT_DATABASE) private readonly db: PostgresJsDatabase,
    @Inject(DRIZZLE_DATABASE) private readonly masterDb: PostgresJsDatabase,
  ) {}

  /**
   * 检查用户是否有指定权限
   */
  async hasPermission(userId: string, permissionCode: PermissionCode): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    
    for (const role of roles) {
      const permissions = ROLE_PERMISSIONS[role] || [];
      if (permissions.includes(permissionCode)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 获取用户所有权限
   */
  async getUserPermissions(userId: string): Promise<PermissionCode[]> {
    const roles = await this.getUserRoles(userId);
    const permissions = new Set<PermissionCode>();
    
    for (const role of roles) {
      const rolePermissions = ROLE_PERMISSIONS[role] || [];
      rolePermissions.forEach(p => permissions.add(p));
    }
    
    return Array.from(permissions);
  }

  /**
   * 获取用户角色列表（从数据库）
   */
  async getUserRoles(userId: string): Promise<string[]> {
    // 登录账号的角色存储在主库，是鉴权的唯一权威来源。
    const [account] = await this.masterDb
      .select({ role: appUserTable.role })
      .from(appUserTable)
      .where(eq(appUserTable.id, userId))
      .limit(1);
    if (account?.role) return [account.role];

    // 兼容早期仅写入租户 role_permission 的数据。
    const roles = await this.db
      .select({ roleName: rolePermissionTable.roleName })
      .from(rolePermissionTable)
      .where(and(
        eq(rolePermissionTable.userId, userId),
        eq(rolePermissionTable.isActive, true),
      ));
    
    if (roles.length === 0) {
      // 默认返回viewer角色
      return ['viewer'];
    }
    
    return roles.map(r => r.roleName);
  }

  /**
   * 为用户分配角色
   */
  async assignRole(userId: string, roleName: string, actorId: string) {
    const [actor] = await this.masterDb.select({ role: appUserTable.role, status: appUserTable.status })
      .from(appUserTable).where(eq(appUserTable.id, actorId)).limit(1);
    if (!actor || actor.status !== 'active' || actor.role !== 'admin') {
      throw new ForbiddenException('仅平台管理员可修改全局账号角色');
    }
    if (!Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, roleName)) {
      throw new ForbiddenException('无效角色');
    }

    const [existing] = await this.masterDb
      .select({ id: appUserTable.id, role: appUserTable.role })
      .from(appUserTable)
      .where(eq(appUserTable.id, userId))
      .limit(1);
    if (!existing) throw new ForbiddenException('用户不存在');
    if (userId === actorId && existing.role !== roleName) {
      throw new ForbiddenException('不能修改自己的角色');
    }
    if (existing.role === 'admin' && roleName !== 'admin') {
      const [{ count }] = await this.masterDb
        .select({ count: sql<number>`count(*)::int` })
        .from(appUserTable)
        .where(and(eq(appUserTable.role, 'admin'), eq(appUserTable.status, 'active'), ne(appUserTable.id, userId)));
      if (count === 0) throw new ForbiddenException('系统必须保留至少一个启用的管理员');
    }

    await this.masterDb
      .update(appUserTable)
      .set({ role: roleName, updatedAt: new Date() })
      .where(eq(appUserTable.id, userId))
      .returning({ id: appUserTable.id });

    // 角色变更后立即撤销旧会话，防止旧令牌继续保留原权限。
    await this.masterDb
      .update(authSessionTable)
      .set({ revokedAt: new Date() })
      .where(and(eq(authSessionTable.userId, userId), isNull(authSessionTable.revokedAt)));

    // 先删除该用户的现有角色关联
    await this.db
      .delete(rolePermissionTable)
      .where(eq(rolePermissionTable.userId, userId));
    
    // 创建新角色关联
    await this.db.insert(rolePermissionTable).values({
      roleName,
      userId,
      permissionCode: roleName, // 存储角色标识
      isActive: true,
    });
    
    return { success: true };
  }

  /**
   * 获取所有可用角色
   */
  getAllRoles() {
    return Object.keys(ROLE_PERMISSIONS).map(roleName => ({
      name: roleName,
      permissions: ROLE_PERMISSIONS[roleName],
    }));
  }

  /**
   * 获取角色的权限列表
   */
  getRolePermissions(roleName: string): PermissionCode[] {
    return ROLE_PERMISSIONS[roleName] || [];
  }

  async getOperationLogs(limit = 500) {
    return this.db.select().from(operationLogTable)
      .orderBy(desc(operationLogTable.createdAt))
      .limit(Math.min(Math.max(limit, 1), 1000));
  }

  /**
   * 清空数据库 - 恢复初始化设置
   * 危险操作，仅管理员可执行
   */
  async resetDatabase(userId: string) {
    // 检查用户是否有管理员权限
    const isAdmin = await this.hasPermission(userId, 'system:permission');
    if (!isAdmin) {
      throw new ForbiddenException('无权执行此操作，需要管理员权限');
    }

    // 按依赖顺序清空数据表（先删子表，再删父表）
    // 1. 明细表
    await this.db.delete(outboundBatchDetailTable);
    await this.db.delete(reconciliationDetailTable);
    await this.db.delete(outboundDetailTable);
    await this.db.delete(inboundDetailTable);

    // 2. 批次相关表
    await this.db.delete(productBatchStockTable);
    await this.db.delete(productBatchTable);

    // 3. 单据主表
    await this.db.delete(reconciliationTable);
    await this.db.delete(outboundOrderTable);
    await this.db.delete(inboundOrderTable);

    // 4. 产品客户关联表
    await this.db.delete(inventoryRecordTable);

    // 5. 统计和日志表
    await this.db.delete(statisticsDailyTable);
    await this.db.delete(qualityInspectionTable);
    await this.db.delete(approvalRequestTable);
    await this.db.delete(operationLogTable);
    await this.db.delete(undoLogTable);

    // 6. 基础数据表（保留角色权限配置）
    await this.db.delete(productTable);
    await this.db.delete(customerTable);

    return {
      success: true,
      message: '数据库已清空，系统已恢复初始化状态',
      clearedAt: new Date().toISOString(),
    };
  }
}

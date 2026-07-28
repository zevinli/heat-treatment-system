import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
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
} from '../../database/schema';

export type PermissionCode =
  | 'customer:view' | 'customer:create' | 'customer:update' | 'customer:delete'
  | 'product:view' | 'product:create' | 'product:update' | 'product:delete'
  | 'inbound:view' | 'inbound:create' | 'inbound:undo'
  | 'outbound:view' | 'outbound:create' | 'outbound:delete' | 'outbound:undo'
  | 'inventory:view' | 'inventory:adjust'
  | 'reconciliation:view' | 'reconciliation:create' | 'reconciliation:audit' | 'reconciliation:unaudit'
  | 'statistics:view'
  | 'system:settings' | 'system:permission';

export const ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  admin: [
    'customer:view', 'customer:create', 'customer:update', 'customer:delete',
    'product:view', 'product:create', 'product:update', 'product:delete',
    'inbound:view', 'inbound:create', 'inbound:undo',
    'outbound:view', 'outbound:create', 'outbound:delete', 'outbound:undo',
    'inventory:view', 'inventory:adjust',
    'reconciliation:view', 'reconciliation:create', 'reconciliation:audit', 'reconciliation:unaudit',
    'statistics:view',
    'system:settings', 'system:permission',
  ],
  operator: [
    'customer:view', 'customer:create', 'customer:update',
    'product:view', 'product:create', 'product:update',
    'inbound:view', 'inbound:create', 'inbound:undo',
    'outbound:view', 'outbound:create', 'outbound:undo',
    'inventory:view',
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
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
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
  async assignRole(userId: string, roleName: string) {
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

  /**
   * 清空数据库 - 恢复初始化设置
   * 危险操作，仅管理员可执行
   */
  async resetDatabase(userId: string) {
    // 检查用户是否有管理员权限
    // 如果 rolePermissionTable 为空（系统刚初始化），允许任何已登录用户执行
    const allPermissions = await this.db.select().from(rolePermissionTable).limit(1);
    const skipPermissionCheck = allPermissions.length === 0;
    
    if (!skipPermissionCheck) {
      const isAdmin = await this.hasPermission(userId, 'system:permission');
      if (!isAdmin) {
        throw new ForbiddenException('无权执行此操作，需要管理员权限');
      }
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

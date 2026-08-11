import { getCurrentUser } from '@/lib/auth-session';

export type AppPermission =
  | 'customer:create' | 'customer:update' | 'customer:delete'
  | 'product:create' | 'product:update' | 'product:delete'
  | 'inbound:create' | 'inbound:undo'
  | 'outbound:create' | 'outbound:undo'
  | 'inventory:adjust' | 'inventory:request-adjust' | 'inventory:approve'
  | 'reconciliation:create' | 'reconciliation:audit' | 'reconciliation:unaudit'
  | 'system:settings';

const ROLE_PERMISSIONS: Record<string, ReadonlySet<AppPermission>> = {
  '1': new Set<AppPermission>([
    'customer:create', 'customer:update', 'customer:delete',
    'product:create', 'product:update', 'product:delete',
    'inbound:create', 'inbound:undo', 'outbound:create', 'outbound:undo',
    'inventory:adjust', 'inventory:request-adjust', 'inventory:approve',
    'reconciliation:create', 'reconciliation:audit', 'reconciliation:unaudit',
    'system:settings',
  ]),
  '2': new Set<AppPermission>([
    'customer:create', 'customer:update', 'product:create', 'product:update',
    'inbound:create', 'inbound:undo', 'outbound:create', 'outbound:undo',
    'inventory:request-adjust',
  ]),
  '4': new Set<AppPermission>([
    'reconciliation:create', 'reconciliation:audit', 'reconciliation:unaudit',
  ]),
  '5': new Set<AppPermission>(),
};

/** 与服务端固定 RBAC 保持一致，仅用于隐藏无权操作；服务端仍是最终授权边界。 */
export function hasAppPermission(permission: AppPermission): boolean {
  const roleId = getCurrentUser()?.roleId;
  return Boolean(roleId && ROLE_PERMISSIONS[roleId]?.has(permission));
}

export function useAppPermission(permission: AppPermission): boolean {
  return hasAppPermission(permission);
}

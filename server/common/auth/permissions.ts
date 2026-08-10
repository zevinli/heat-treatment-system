export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  operator: [
    'customer:view', 'customer:create', 'customer:update',
    'product:view', 'product:create', 'product:update',
    'inbound:view', 'inbound:create', 'inbound:undo',
    'outbound:view', 'outbound:create', 'outbound:undo',
    'inventory:view', 'statistics:view', 'reconciliation:view',
    'inventory:request-adjust',
  ],
  finance: [
    'customer:view', 'product:view', 'inbound:view', 'outbound:view',
    'inventory:view', 'statistics:view', 'reconciliation:view',
    'reconciliation:create', 'reconciliation:audit', 'reconciliation:unaudit',
  ],
  viewer: [
    'customer:view', 'product:view', 'inbound:view', 'outbound:view',
    'inventory:view', 'statistics:view', 'reconciliation:view',
  ],
};

export function permissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

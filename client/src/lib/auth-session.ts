export interface CurrentUser {
  id: string;
  username: string;
  name: string;
  roleId: string;
  roleName: string;
  department: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  deviceLimit: number;
  password?: string;
  accountRoleId?: string;
  accountRoleName?: string;
}

const CURRENT_USER_KEY = 'heat_treatment_current_user';

const ROLE_PERMISSIONS: Record<string, { menus: string[]; actions: string[] }> = {
  '1': { menus: ['*'], actions: ['*'] },
  '2': {
    menus: ['dashboard', 'inbound', 'outbound', 'orders', 'inventory', 'reconciliation', 'statistics', 'customers', 'products', 'display', 'manual', 'profile'],
    actions: ['view', 'create', 'edit', 'delete', 'export', 'print'],
  },
  '4': {
    menus: ['dashboard', 'orders', 'reconciliation', 'statistics', 'customers', 'display', 'manual', 'profile'],
    actions: ['view', 'create', 'edit', 'export', 'print', 'approve'],
  },
  '5': {
    menus: ['dashboard', 'orders', 'inventory', 'reconciliation', 'statistics', 'customers', 'products', 'display', 'manual', 'profile'],
    actions: ['view'],
  },
};

export const checkPermission = (
  userRoleId: string,
  permissionType: 'menu' | 'action',
  permissionKey: string,
): boolean => {
  const role = ROLE_PERMISSIONS[userRoleId];
  if (!role) return false;
  const granted = permissionType === 'menu' ? role.menus : role.actions;
  return granted.includes('*') || granted.includes(permissionKey);
};

export const getCurrentUser = (): CurrentUser | null => {
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!userStr) return null;
  try {
    const parsed = JSON.parse(userStr);
    return parsed && typeof parsed.id === 'string' && typeof parsed.roleId === 'string'
      ? parsed as CurrentUser
      : null;
  } catch {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('authToken');
    return null;
  }
};

export const setCurrentUser = (user: CurrentUser | null): void => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.setItem('userId', user.id);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userRole', String(user.roleId));
    return;
  }
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userRole');
  localStorage.removeItem('authToken');
};

export const applyTenantRole = (
  orgRole: 'super_admin' | 'admin' | 'member',
  businessRole: 'admin' | 'operator' | 'finance' | 'viewer' = 'operator',
): void => {
  const user = getCurrentUser();
  if (!user) return;
  const accountRoleId = user.accountRoleId || user.roleId;
  const accountRoleName = user.accountRoleName || user.roleName;
  const businessRoleMap = {
    admin: { id: '1', name: '组织管理员' },
    operator: { id: '2', name: '操作员' },
    finance: { id: '4', name: '财务人员' },
    viewer: { id: '5', name: '只读用户' },
  } as const;
  const effective = orgRole === 'super_admin' || orgRole === 'admin'
    ? businessRoleMap.admin
    : businessRoleMap[businessRole] || businessRoleMap.operator;
  setCurrentUser({ ...user, accountRoleId, accountRoleName, roleId: effective.id, roleName: effective.name });
};

export const restoreAccountRole = (): void => {
  const user = getCurrentUser();
  if (!user?.accountRoleId) return;
  setCurrentUser({
    ...user,
    roleId: user.accountRoleId,
    roleName: user.accountRoleName || user.roleName,
  });
};

import { getCurrentUser } from '@/lib/auth-session';

/** 浏览器本地数据同时按登录账号和组织隔离，避免共享设备上的草稿互相串用。 */
export function tenantScopedStorageKey(namespace: string, orgCode?: string | null): string {
  const user = getCurrentUser() as any;
  const userKey = String(user?.id || user?.userId || user?.username || 'anonymous');
  return `heat_treatment:${userKey}:${orgCode || 'unselected'}:${namespace}`;
}

export function readTenantScopedJson<T>(namespace: string, orgCode: string | null | undefined, fallback: T): T {
  try {
    const value = localStorage.getItem(tenantScopedStorageKey(namespace, orgCode));
    return value ? { ...fallback, ...JSON.parse(value) } : fallback;
  } catch {
    return fallback;
  }
}

export function writeTenantScopedJson(namespace: string, orgCode: string | null | undefined, value: unknown): void {
  try {
    localStorage.setItem(tenantScopedStorageKey(namespace, orgCode), JSON.stringify(value));
  } catch {
    // 浏览器禁用存储时不阻断核心业务。
  }
}

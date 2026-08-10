import { AsyncLocalStorage } from 'async_hooks';
import type { TenantContext } from './decorators/tenant.decorator';

/** Request-safe tenant context shared by middleware and database proxy. */
export const tenantAsyncStorage = new AsyncLocalStorage<TenantContext>();

export function getCurrentTenantContext(): TenantContext | undefined {
  return tenantAsyncStorage.getStore();
}

export function getCurrentTenantDb<T = any>(): T | undefined {
  return tenantAsyncStorage.getStore()?.db as T | undefined;
}

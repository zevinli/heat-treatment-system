import type { Provider } from '@nestjs/common';
import { DRIZZLE_DATABASE } from '@lark-apaas/fullstack-nestjs-core';
import { getCurrentTenantDb } from './tenant-context.storage';

export const TENANT_DATABASE = Symbol('TENANT_DATABASE');

/**
 * A stable proxy injected into singleton services. Every property access resolves
 * the database from the current AsyncLocalStorage request, preventing services
 * from accidentally retaining a connection belonging to another tenant.
 */
export const TenantDatabaseProvider: Provider = {
  provide: TENANT_DATABASE,
  inject: [DRIZZLE_DATABASE],
  useFactory: (masterDb: any) => new Proxy({}, {
    get(_target, property) {
      const database = getCurrentTenantDb<any>() || masterDb;
      const value = database[property];
      return typeof value === 'function' ? value.bind(database) : value;
    },
  }),
};

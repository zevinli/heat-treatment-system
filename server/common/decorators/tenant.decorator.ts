import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TENANT_CONTEXT = Symbol('TENANT_CONTEXT');

export interface TenantContext {
  orgCode: string;
  orgId: string;
  db: unknown;
}

/**
 * 获取当前租户上下文
 * @usage @CurrentTenant() tenant: TenantContext
 * @usage @CurrentTenant('orgCode') orgCode: string
 */
export const CurrentTenant = createParamDecorator(
  (data: keyof TenantContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantContext: TenantContext | undefined = request[TENANT_CONTEXT];
    return data ? tenantContext?.[data] : tenantContext;
  },
);

/**
 * 获取当前租户数据库
 * @usage @CurrentTenantDb() db: any
 */
export const CurrentTenantDb = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantContext: TenantContext | undefined = request[TENANT_CONTEXT];
    return tenantContext?.db;
  },
);

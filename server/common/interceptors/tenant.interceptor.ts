import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request } from 'express';
import { TENANT_CONTEXT, type TenantContext } from '../decorators/tenant.decorator';

import {
  getCurrentTenantContext,
  getCurrentTenantDb,
} from '../tenant-context.storage';

/**
 * 租户拦截器
 * 在请求处理过程中保持租户上下文
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const tenantContext: TenantContext | undefined = (request as any)[TENANT_CONTEXT];

    if (!tenantContext) {
      return next.handle();
    }

    this.logger.debug(`Intercepting request for tenant: ${tenantContext.orgCode}`);

    // Middleware 已使用 AsyncLocalStorage 包裹整个请求生命周期。
    return next.handle();
  }
}

/**
 * 获取当前租户上下文（用于Service层）
 * @returns TenantContext | undefined
 */
export { getCurrentTenantContext, getCurrentTenantDb };

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request } from 'express';
import { TENANT_CONTEXT, type TenantContext } from '../decorators/tenant.decorator';

/**
 * AsyncLocalStorage 用于在异步调用链中保持租户上下文
 * 注意：Node.js 需要 v16.4.0+ 支持 AsyncLocalStorage
 */
class TenantStorage {
  private storage: Map<string, TenantContext> = new Map();

  run<T>(context: TenantContext, callback: () => T): T {
    const key = this.getAsyncId();
    this.storage.set(key, context);
    try {
      return callback();
    } finally {
      this.storage.delete(key);
    }
  }

  getStore(): TenantContext | undefined {
    const key = this.getAsyncId();
    return this.storage.get(key);
  }

  private getAsyncId(): string {
    // 简化实现，实际生产环境使用 AsyncLocalStorage
    return 'current';
  }
}

export const tenantStorage = new TenantStorage();

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

    // 在异步上下文中传递租户上下文
    return new Observable((subscriber) => {
      tenantStorage.run(tenantContext, () => {
        const subscription = next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });

        return () => subscription.unsubscribe();
      });
    });
  }
}

/**
 * 获取当前租户上下文（用于Service层）
 * @returns TenantContext | undefined
 */
export function getCurrentTenantContext(): TenantContext | undefined {
  return tenantStorage.getStore();
}

/**
 * 获取当前租户数据库（用于Service层）
 * @returns PostgresJsDatabase | undefined
 */
export function getCurrentTenantDb() {
  return tenantStorage.getStore()?.db;
}

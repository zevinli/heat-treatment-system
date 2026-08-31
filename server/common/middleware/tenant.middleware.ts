import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException, Logger, Inject } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE_DATABASE } from '@lark-apaas/fullstack-nestjs-core';
import { TenantConnectionService } from '../../modules/tenant/tenant-connection.service';
import { organization, organizationUser } from '../../database/schema';
import { TENANT_CONTEXT, type TenantContext } from '../decorators/tenant.decorator';
import { tenantAsyncStorage } from '../tenant-context.storage';
import { permissionsForRole } from '../auth/permissions';

/**
 * 租户中间件
 * 从请求中提取租户信息，验证用户权限，并设置租户上下文
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(
    private readonly tenantConnectionService: TenantConnectionService,
    @Inject(DRIZZLE_DATABASE) private readonly masterDb: any,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Nest/Express 在中间件匹配过程中可能重写 req.path（例如只剩
      // `/customers`），因此安全边界必须使用未被路由层截断的原始 URL。
      // 否则漏传租户头的 `/api/*` 请求会被误判为前端页面并落到主库。
      const requestPath = this.getRequestPath(req);
      // 登录和健康检查与租户无关。即使浏览器残留了上一会话的组织头，
      // 也不能让失效/损坏的租户配置阻断用户重新登录。
      if (requestPath === '/api/auth/login' || requestPath === '/api/auth/register' || requestPath.startsWith('/api/health')) {
        return next();
      }
      // 1. 从请求头获取组织编码
      const orgCode = this.extractOrgCode(req);

      if (!orgCode) {
        // 如果是公开路由（如登录、组织列表），允许继续
        if (this.isPublicRoute(requestPath)) {
          return next();
        }
        // 如果是前端页面路由（非API路径），允许继续
        if (!requestPath.startsWith('/api/')) {
          return next();
        }
        throw new UnauthorizedException('请先选择组织');
      }

    // 2. 主数据库连接已通过依赖注入获取

      // 3. 查询组织ID
      const orgId = await this.getOrgId(orgCode, this.masterDb);
      if (!orgId) {
        // 如果组织不存在，但访问的是公开路由则允许继续
        if (this.isPublicRoute(requestPath)) {
          return next();
        }
        throw new UnauthorizedException(`Organization '${orgCode}' not found`);
      }

      // 4. 验证用户是否有权访问该组织
      const userId = req.userContext?.userId;
      if (userId) {
        const membership = await this.getUserOrgMembership(userId, orgCode, this.masterDb);
        if (!membership) {
          // 如果用户没有权限，但访问的是公开路由则允许继续
          if (this.isPublicRoute(requestPath)) {
            return next();
          }
          throw new ForbiddenException('Access denied for this organization');
        }
        // 组织内角色是租户权限边界。组织管理员拥有该组织管理权限；普通成员
        // 继承账号的业务角色，但全局 admin 以普通成员加入时不能自动获得租户管理员权限。
        const effectiveRole = ['super_admin', 'admin'].includes(membership.role || '')
          ? 'admin'
          : membership.businessRole || 'operator';
        req.userContext!.orgCode = orgCode;
        req.userContext!.orgRole = membership.role || 'member';
        req.userContext!.businessRole = membership.businessRole || 'operator';
        req.userContext!.userRole = effectiveRole;
        req.userContext!.permissions = permissionsForRole(effectiveRole);
      }

      // 5. 获取租户数据库连接。生产环境禁止静默回退主库，避免跨租户数据泄漏。
      const tenantDb = await this.tenantConnectionService.getTenantDb(orgCode, this.masterDb);
      const tenantContext: TenantContext = { orgCode, orgId, db: tenantDb };
      (req as any)[TENANT_CONTEXT] = tenantContext;
      this.logger.debug(`Tenant context set for: ${orgCode}, user: ${userId}`);

      tenantAsyncStorage.run(tenantContext, next);
    } catch (error) {
      this.logger.error('Tenant middleware error:', error instanceof Error ? error.message : String(error));
      next(error);
    }
  }

  private getRequestPath(req: Request): string {
    const raw = req.originalUrl || req.url || req.path || '/';
    const withoutQuery = raw.split('?')[0] || '/';
    return withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  }

  /**
   * 从请求中提取组织编码
   * 优先级：Header > Subdomain > Query Param
   */
  private extractOrgCode(req: Request): string | null {
    // 1. 从请求头获取
    const headerCode = req.headers['x-organization-code'] as string;
    if (headerCode) {
      return headerCode;
    }

    // 2. 仅在明确配置的基础域名下启用子域名租户识别。
    // Railway/Vercel 等平台域名绝不能被误认为组织编码。
    const baseDomain = process.env.TENANT_BASE_DOMAIN?.trim().toLowerCase();
    const host = (req.hostname || req.headers.host || '').split(':')[0].toLowerCase();
    if (baseDomain && host.endsWith(`.${baseDomain}`)) {
      const subdomain = host.slice(0, -(baseDomain.length + 1)).split('.').pop();
      if (subdomain && !['www', 'app', 'api'].includes(subdomain)) return subdomain;
    }

    // 3. 查询参数只允许在非生产环境用于开发/测试
    const queryCode = req.query.org as string;
    if (queryCode && process.env.NODE_ENV !== 'production') {
      return queryCode;
    }

    return null;
  }

  /**
   * 验证用户是否有权访问该组织
   */
  private async getUserOrgMembership(
    userId: string,
    orgCode: string,
    masterDb: any,
  ): Promise<{ id: string; role: string | null; businessRole: string } | null> {
    try {
      const result = await masterDb
        .select({ id: organizationUser.id, role: organizationUser.role, businessRole: organizationUser.businessRole })
        .from(organizationUser)
        .innerJoin(organization, eq(organizationUser.orgId, organization.id))
        .where(
          and(
            eq(organizationUser.userId, userId),
            eq(organization.code, orgCode),
            eq(organizationUser.status, 'active'),
            eq(organization.status, 'active'),
          ),
        )
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.logger.error('Error verifying user org access:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * 获取组织ID
   */
  private async getOrgId(orgCode: string, masterDb: any): Promise<string | null> {
    try {
      const result = await masterDb
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.code, orgCode))
        .limit(1);

      return result[0]?.id || null;
    } catch (error) {
      this.logger.error('Error getting org id:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * 判断是否为公开路由
   */
  private isPublicRoute(path: string): boolean {
    const publicRoutes = [
      '/api/tenant/my-organizations',
      '/api/tenant/organizations',
      '/api/tenant/join',
      // 账号资料、平台账号管理和登录都位于主库；它们仍由 AuthGuard 和
      // 平台角色校验保护，但不能要求用户先选择组织。
      '/api/auth',
      '/api/health',
      '/api/invites',
    ];
    return publicRoutes.some(route => path.startsWith(route));
  }

}

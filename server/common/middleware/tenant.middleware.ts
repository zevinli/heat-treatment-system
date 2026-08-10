import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException, Logger, Inject } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE_DATABASE } from '@lark-apaas/fullstack-nestjs-core';
import { TenantConnectionService } from '../../modules/tenant/tenant-connection.service';
import { organization, organizationUser } from '../../database/schema';
import { TENANT_CONTEXT, type TenantContext } from '../decorators/tenant.decorator';

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
      // 1. 从请求头获取组织编码
      const orgCode = this.extractOrgCode(req);

      if (!orgCode) {
        // 检查是否有配置了数据库的组织，如果没有则允许所有请求通过（本地开发/初始安装）
        const hasConfiguredOrgs = await this.hasConfiguredOrganizations();
        if (!hasConfiguredOrgs) {
          return next();
        }
        // 如果是公开路由（如登录、组织列表），允许继续
        if (this.isPublicRoute(req.path)) {
          return next();
        }
        // 如果是前端页面路由（非API路径），允许继续
        if (!req.path.startsWith('/api/')) {
          return next();
        }
        throw new UnauthorizedException('请先选择组织');
      }

    // 2. 主数据库连接已通过依赖注入获取

      // 3. 查询组织ID
      const orgId = await this.getOrgId(orgCode, this.masterDb);
      if (!orgId) {
        // 如果组织不存在，但访问的是公开路由则允许继续
        if (this.isPublicRoute(req.path)) {
          return next();
        }
        throw new UnauthorizedException(`Organization '${orgCode}' not found`);
      }

      // 4. 验证用户是否有权访问该组织
      const userId = req.userContext?.userId;
      if (userId) {
        const hasAccess = await this.verifyUserOrgAccess(userId, orgCode, this.masterDb);
        if (!hasAccess) {
          // 如果用户没有权限，但访问的是公开路由则允许继续
          if (this.isPublicRoute(req.path)) {
            return next();
          }
          throw new ForbiddenException('Access denied for this organization');
        }
      }

      // 5. 获取租户数据库连接（如果数据库配置不完整则跳过，使用主数据库）
      try {
        const tenantDb = await this.tenantConnectionService.getTenantDb(orgCode, this.masterDb);
        // 6. 将租户上下文附加到请求
        const tenantContext: TenantContext = {
          orgCode,
          orgId,
          db: tenantDb,
        };
        (req as any)[TENANT_CONTEXT] = tenantContext;
        this.logger.debug(`Tenant context set for: ${orgCode}, user: ${userId}`);
      } catch (dbError: any) {
        // 如果租户数据库连接失败（如配置不完整），使用主数据库
        this.logger.warn(`租户数据库连接失败，使用主数据库: ${orgCode}, error: ${dbError.message}`);
      }

      next();
    } catch (error) {
      this.logger.error('Tenant middleware error:', error instanceof Error ? error.message : String(error));
      next(error);
    }
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

    // 2. 从子域名获取（如：dalian.example.com）
    const host = req.headers.host || '';
    const subdomain = host.split('.')[0];
    if (subdomain && !['www', 'app', 'api', 'localhost', 'localhost:3000', 'localhost:5000'].some(excluded => host.startsWith(excluded))) {
      return subdomain;
    }

    // 3. 从查询参数获取（用于开发/测试）
    const queryCode = req.query.org as string;
    if (queryCode) {
      return queryCode;
    }

    return null;
  }

  /**
   * 验证用户是否有权访问该组织
   */
  private async verifyUserOrgAccess(
    userId: string,
    orgCode: string,
    masterDb: any,
  ): Promise<boolean> {
    try {
      const result = await masterDb
        .select({ id: organizationUser.id })
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

      return result.length > 0;
    } catch (error) {
      this.logger.error('Error verifying user org access:', error instanceof Error ? error.message : String(error));
      return false;
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
      '/api/organizations',
      '/api/organizations/list',
      '/api/organizations/create',
      '/api/organizations/join',
      '/api/auth/login',
      '/api/auth/callback',
      '/api/health',
      '/api/invites',
    ];
    return publicRoutes.some(route => path.startsWith(route));
  }

  /**
   * 检查是否有配置了完整数据库信息的组织
   * 如果没有任何组织有 DB 配置（dbHost, dbUser, dbPassword），
   * 说明是本地开发环境，跳过租户检查
   */
  private async hasConfiguredOrganizations(): Promise<boolean> {
    try {
      const result = await this.masterDb
        .select({ id: organization.id })
        .from(organization)
        .where(
          and(
            sql`${organization.dbHost} IS NOT NULL`,
            sql`${organization.dbUser} IS NOT NULL`,
            sql`${organization.dbPassword} IS NOT NULL`,
          ),
        )
        .limit(1);
      return result.length > 0;
    } catch {
      return false;
    }
  }
}

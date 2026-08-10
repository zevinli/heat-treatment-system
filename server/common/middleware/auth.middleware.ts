import { Inject, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { DRIZZLE_DATABASE } from '@lark-apaas/fullstack-nestjs-core';
import { appUserTable, authSessionTable } from '../../database/schema';
import { TokenService } from '../../modules/auth/token.service';
import { permissionsForRole } from '../auth/permissions';

/**
 * 本地认证中间件
 * 从请求头提取用户信息并注入到 req.userContext
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: any,
    private readonly tokens: TokenService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) return next();
    try {
      const payload = this.tokens.verify(authorization.slice(7));
      const [session] = await this.db
        .select({ tokenId: authSessionTable.tokenId, status: appUserTable.status })
        .from(authSessionTable)
        .innerJoin(appUserTable, eq(authSessionTable.userId, appUserTable.id))
        .where(and(
          eq(authSessionTable.tokenId, payload.jti),
          isNull(authSessionTable.revokedAt),
          gt(authSessionTable.expiresAt, new Date()),
        ))
        .limit(1);
      if (!session || session.status !== 'active') throw new UnauthorizedException('登录会话已失效');
      req.userContext = {
        userId: payload.sub,
        userName: payload.name,
        userRole: payload.role,
        permissions: permissionsForRole(payload.role),
        tokenId: payload.jti,
      };
      next();
    } catch (error) {
      next(error);
    }
  }
}

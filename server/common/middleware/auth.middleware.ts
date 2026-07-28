import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

/**
 * 本地认证中间件
 * 从请求头提取用户信息并注入到 req.userContext
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const userId = req.headers['x-user-id'] as string;
    const userName = req.headers['x-user-name'] as string;
    const userRole = req.headers['x-user-role'] as string;

    if (userId) {
      (req as any).userContext = {
        userId,
        userName: userName ? decodeURIComponent(userName) : '',
        role: userRole || '',
      };
    }

    next();
  }
}

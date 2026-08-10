import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@lark-apaas/fullstack-nestjs-core';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic || !request.path?.startsWith('/api/')) return true;
    if (!request.userContext?.userId) throw new UnauthorizedException('请先登录');

    const requirements = this.reflector.getAllAndOverride<string[]>('roles', [context.getHandler(), context.getClass()]) || [];
    if (requirements.length === 0) return true;
    const role = request.userContext.userRole;
    const permissions: string[] = request.userContext.permissions || [];
    if (role === 'admin' || requirements.some(item => item === role || permissions.includes(item) || permissions.includes('*'))) return true;
    throw new ForbiddenException('无权执行此操作');
  }
}

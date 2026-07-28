import { Controller, Get, Post, Body, Param, Req, Logger } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { PermissionService, PermissionCode } from './permission.service';
import type { Request } from 'express';

@Controller('api/permissions')
export class PermissionController {
  private readonly logger = new Logger(PermissionController.name);
  constructor(private readonly permissionService: PermissionService) {}

  @Get('me')
  async getMyPermissions(@Req() req: Request) {
    const userId = req.userContext?.userId;
    if (!userId) {
      return { permissions: [], roles: [] };
    }

    const [permissions, roles] = await Promise.all([
      this.permissionService.getUserPermissions(userId),
      this.permissionService.getUserRoles(userId),
    ]);

    return { permissions, roles };
  }

  @Get('roles')
  getAllRoles() {
    return this.permissionService.getAllRoles();
  }

  @Get('roles/:roleName')
  getRolePermissions(@Param('roleName') roleName: string) {
    return {
      roleName,
      permissions: this.permissionService.getRolePermissions(roleName),
    };
  }

  @Post('assign')
  async assignRole(
    @Body() data: { userId: string; roleName: string },
    @Req() req: Request,
  ) {
    const currentUserId = req.userContext?.userId;
    
    // 检查当前用户是否有权限管理权限
    const hasPermission = await this.permissionService.hasPermission(
      currentUserId!,
      'system:permission',
    );
    
    if (!hasPermission) {
      return { success: false, message: '无权分配角色' };
    }

    return this.permissionService.assignRole(data.userId, data.roleName);
  }

  @Post('check')
  async checkPermission(
    @Body() data: { permission: PermissionCode },
    @Req() req: Request,
  ) {
    const userId = req.userContext?.userId;
    if (!userId) {
      return { hasPermission: false };
    }

    const hasPermission = await this.permissionService.hasPermission(
      userId,
      data.permission,
    );

    return { hasPermission };
  }

  /**
   * 清空数据库 - 恢复初始化设置
   * 危险操作，需要管理员权限
   */
  @NeedLogin()
  @Post('reset-database')
  async resetDatabase(@Req() req: Request) {
    const userId = req.userContext?.userId;
    const userName = req.userContext?.userName || '未知用户';
    
    this.logger.log(`用户 ${userName}(${userId}) 请求清空数据库`);
    
    try {
      const result = await this.permissionService.resetDatabase(userId!);
      this.logger.log(`用户 ${userName}(${userId}) 成功清空数据库`);
      return result;
    } catch (error) {
      this.logger.error(`清空数据库失败:`, error);
      throw error;
    }
  }
}

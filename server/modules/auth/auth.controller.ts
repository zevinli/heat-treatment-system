import { Body, Controller, Get, Param, Post, Put, Req } from '@nestjs/common';
import { CanRole, Public } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() body: { username: string; password: string; deviceName?: string }) {
    return this.auth.login(body.username, body.password, body.deviceName);
  }

  @Public()
  @Post('register')
  register(@Body() body: { username: string; password: string; name: string }) {
    return this.auth.register(body);
  }

  @Post('logout')
  logout(@Req() req: Request) {
    return this.auth.logout(req.userContext!.tokenId!);
  }

  @Get('me')
  me(@Req() req: Request) {
    return this.auth.getMe(req.userContext!.userId);
  }

  @Put('me')
  updateMe(@Req() req: Request, @Body() body: {
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    department?: string;
    position?: string;
    location?: string;
  }) {
    return this.auth.updateSelf(req.userContext!.userId, body);
  }

  @Put('me/password')
  changeMyPassword(
    @Req() req: Request,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.auth.changePassword(
      req.userContext!.userId,
      req.userContext!.tokenId!,
      body.currentPassword,
      body.newPassword,
    );
  }

  @CanRole('system:permission')
  @Get('users')
  users(@Req() req: Request) {
    return this.auth.listUsers(req.userContext!.userId!);
  }

  @CanRole('system:permission')
  @Post('users')
  createUser(@Body() body: {
    username: string;
    password: string;
    name: string;
    role: string;
    department?: string;
    deviceLimit?: number;
  }, @Req() req: Request) {
    return this.auth.createUser(body, req.userContext!.userId!);
  }

  @CanRole('system:permission')
  @Put('users/:id')
  updateUser(@Param('id') id: string, @Body() body: {
    name?: string;
    role?: string;
    department?: string;
    status?: 'active' | 'inactive';
    deviceLimit?: number;
  }, @Req() req: Request) {
    return this.auth.updateUser(id, req.userContext.userId!, body);
  }

  @CanRole('system:permission')
  @Put('users/:id/password')
  resetPassword(@Param('id') id: string, @Body('password') password: string, @Req() req: Request) {
    return this.auth.resetPassword(id, password, req.userContext!.userId!);
  }
}

import { Controller, Get } from '@nestjs/common';
import { Public } from '@lark-apaas/fullstack-nestjs-core';

@Controller('api/health')
export class HealthController {
  @Public()
  @Get()
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

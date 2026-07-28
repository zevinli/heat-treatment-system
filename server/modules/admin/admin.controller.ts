import { Controller, Get, Query } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboardData(
    @Query('period') period: 'today' | 'week' | 'month' | 'year' = 'week',
  ) {
    return this.adminService.getDashboardData(period);
  }

  @Get('stats/realtime')
  async getRealtimeStats() {
    return this.adminService.getRealtimeStats();
  }

  @Get('activities')
  async getRecentActivities(@Query('limit') limit?: string) {
    return this.adminService.getRecentActivities(limit ? parseInt(limit, 10) : 10);
  }

  @Get('alerts')
  async getAlerts() {
    return this.adminService.getAlerts();
  }

  @Get('trends')
  async getTrends(
    @Query('days') days?: string,
  ) {
    return this.adminService.getTrends(days ? parseInt(days, 10) : 7);
  }
}

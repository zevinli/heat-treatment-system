import { Controller, Get, Query } from '@nestjs/common';
import { CanRole } from '@lark-apaas/fullstack-nestjs-core';
import { parsePositiveInt } from '../../common/utils/pagination';
import { AdminService } from './admin.service';

@Controller('api/admin')
@CanRole('system:settings')
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
    return this.adminService.getRecentActivities(parsePositiveInt(limit, 10, 100));
  }

  @Get('alerts')
  async getAlerts() {
    return this.adminService.getAlerts();
  }

  @Get('trends')
  async getTrends(
    @Query('days') days?: string,
  ) {
    return this.adminService.getTrends(parsePositiveInt(days, 7, 365));
  }

  @Get('backup')
  async backupDatabase() {
    const { execSync } = require('child_process');
    const fs = require('fs');
    const path = require('path');

    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `heat_treatment_${timestamp}.sql.gz`;
    const filepath = path.join(backupDir, filename);

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return { success: false, message: 'DATABASE_URL 未配置' };
    }

    try {
      execSync(`pg_dump "${dbUrl}" --clean --if-exists --no-owner | gzip > "${filepath}"`, {
        timeout: 60000,
        stdio: 'pipe',
      });
      const stats = fs.statSync(filepath);
      return {
        success: true,
        message: '备份完成',
        file: filename,
        size: stats.size,
        sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
      };
    } catch (err) {
      return { success: false, message: '备份失败: ' + err.message };
    }
  }


}

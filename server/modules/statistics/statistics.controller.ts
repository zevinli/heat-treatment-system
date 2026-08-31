import { BadRequestException, Controller, Get, Query, Post, Body } from '@nestjs/common';
import { CanRole } from '@lark-apaas/fullstack-nestjs-core';
import { parsePositiveInt } from '../../common/utils/pagination';
import { StatisticsService } from './statistics.service';

@Controller('api/statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  @CanRole('statistics:view')
  async getOverview(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return this.statisticsService.getOverviewStats({
      startDate: startDate || thirtyDaysAgo,
      endDate: endDate || today,
    });
  }

  @Get('customers')
  @CanRole('statistics:view')
  async getCustomerStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: string,
  ) {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return this.statisticsService.getCustomerStats({
      startDate: startDate || thirtyDaysAgo,
      endDate: endDate || today,
      limit: parsePositiveInt(limit, 10, 100),
    });
  }

  @Get('products')
  @CanRole('statistics:view')
  async getProductStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: string,
  ) {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return this.statisticsService.getProductStats({
      startDate: startDate || thirtyDaysAgo,
      endDate: endDate || today,
      limit: parsePositiveInt(limit, 10, 100),
    });
  }

  @Get('inventory')
  @CanRole('statistics:view')
  async getInventoryStats() {
    return this.statisticsService.getInventoryStats();
  }

  @Get('finance')
  @CanRole('statistics:view')
  async getFinanceStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const today = new Date().toISOString().split('T')[0];
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return this.statisticsService.getFinanceStats({
      startDate: startDate || oneYearAgo,
      endDate: endDate || today,
    });
  }

  @Post('generate')
  @CanRole('statistics:view')
  async generateStats(@Body() data: { date: string }) {
    const date = data.date ? new Date(data.date) : new Date();
    if (Number.isNaN(date.getTime())) throw new BadRequestException('无效的统计日期');
    return this.statisticsService.generateDailyStats(date);
  }
}

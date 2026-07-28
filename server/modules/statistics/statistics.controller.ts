import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('api/statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
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
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Get('products')
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
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Get('inventory')
  async getInventoryStats() {
    return this.statisticsService.getInventoryStats();
  }

  @Get('finance')
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
  async generateStats(@Body() data: { date: string }) {
    const date = data.date ? new Date(data.date) : new Date();
    return this.statisticsService.generateDailyStats(date);
  }
}

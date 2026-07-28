import { Controller, Get, Post, Body, Query, Req, Logger } from '@nestjs/common';
import type { InventoryChangeType } from '@shared/api.interface';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { InventoryService } from './inventory.service';
import { PAGINATION } from '../../config/constants';

@Controller('api/inventory')
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(private readonly inventoryService: InventoryService) {}

  // 获取库存汇总
  @Get('summary')
  async getInventorySummary(
    @Query('search') search?: string,
    @Query('customerCode') customerCode?: string,
    @Query('material') material?: string,
    @Query('minStock') minStock?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.inventoryService.getInventorySummary({
      search,
      customerCode,
      material,
      minStock: minStock ? parseInt(minStock, 10) : undefined,
      page: page ? parseInt(page, 10) : PAGINATION.DEFAULT_PAGE,
      pageSize: pageSize ? parseInt(pageSize, 10) : PAGINATION.DEFAULT_PAGE_SIZE,
    });
  }

  // 获取库存变动记录
  @Get('records')
  async getInventoryRecords(
    @Query('productId') productId?: string,
    @Query('changeType') changeType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.inventoryService.getInventoryRecords({
      productId,
      changeType: changeType as InventoryChangeType,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : PAGINATION.DEFAULT_PAGE,
      pageSize: pageSize ? parseInt(pageSize, 10) : PAGINATION.DEFAULT_PAGE_SIZE,
    });
  }

  // 手动调整库存（管理员直接调整，需要审批流程请参考审批API）
  @NeedLogin()
  @Post('adjust')
  async adjustStock(
    @Body()
    body: {
      productId: string;
      quantityChange: number;
      weightChange?: number;
      reason: string;
      remark?: string;
    },
    @Req() req: Request,
  ) {
    const { userId } = req.userContext;
    return this.inventoryService.adjustStockDirect({
      ...body,
      operator: userId,
      isAdmin: true,
    });
  }

  // 增加库存（入库专用）
  @NeedLogin()
  @Post('increase')
  async increaseStock(
    @Body()
    body: {
      productId: string;
      quantity: number;
      weight?: number;
      referenceNo: string;
      remark?: string;
    },
    @Req() req: Request,
  ) {
    const { userId } = req.userContext;
    return this.inventoryService.increaseStock({
      ...body,
      operator: userId,
    });
  }

  // 减少库存（出库专用）
  @NeedLogin()
  @Post('decrease')
  async decreaseStock(
    @Body()
    body: {
      productId: string;
      quantity: number;
      weight?: number;
      referenceNo: string;
      remark?: string;
    },
    @Req() req: Request,
  ) {
    const { userId } = req.userContext;
    return this.inventoryService.decreaseStock({
      ...body,
      operator: userId,
    });
  }
}

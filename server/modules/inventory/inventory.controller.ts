import { Controller, Get, Post, Put, Body, Query, Param, Req, Logger } from '@nestjs/common';
import type { InventoryChangeType } from '@shared/api.interface';
import { CanRole, NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { InventoryService } from './inventory.service';
import { PAGINATION } from '../../config/constants';
import { parsePagination } from '../../common/utils/pagination';

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
    const pagination = parsePagination(page, pageSize, {
      page: PAGINATION.DEFAULT_PAGE, pageSize: PAGINATION.DEFAULT_PAGE_SIZE, maxPageSize: PAGINATION.MAX_PAGE_SIZE,
    });
    return this.inventoryService.getInventorySummary({
      search,
      customerCode,
      material,
      minStock: minStock ? parseInt(minStock, 10) : undefined,
      ...pagination,
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
    const pagination = parsePagination(page, pageSize, {
      page: PAGINATION.DEFAULT_PAGE, pageSize: PAGINATION.DEFAULT_PAGE_SIZE, maxPageSize: PAGINATION.MAX_PAGE_SIZE,
    });
    return this.inventoryService.getInventoryRecords({
      productId,
      changeType: changeType as InventoryChangeType,
      startDate,
      endDate,
      ...pagination,
    });
  }

  // 手动调整库存（管理员直接调整，需要审批流程请参考审批API）
  @NeedLogin()
  @CanRole('inventory:adjust')
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
      isAdmin: req.userContext.userRole === 'admin',
    });
  }

  @NeedLogin()
  @CanRole('inventory:request-adjust')
  @Post('adjustment-requests')
  requestAdjustment(
    @Body() body: {
      productId: string;
      quantityChange: number;
      weightChange?: number;
      reason: 'inventory_profit' | 'inventory_loss' | 'damage' | 'quality_reject' | 'other';
      remark?: string;
    },
    @Req() req: Request,
  ) {
    return this.inventoryService.requestStockAdjust({ ...body, operator: req.userContext.userId });
  }

  @NeedLogin()
  @CanRole('inventory:approve')
  @Get('adjustment-requests')
  listAdjustmentRequests(@Query('status') status?: string) {
    return this.inventoryService.listStockAdjustRequests(status);
  }

  @NeedLogin()
  @CanRole('inventory:approve')
  @Put('adjustment-requests/:id')
  approveAdjustment(
    @Param('id') id: string,
    @Body() body: { approved: boolean; rejectReason?: string },
    @Req() req: Request,
  ) {
    return this.inventoryService.approveStockAdjust({
      requestId: id,
      approver: req.userContext.userId,
      approved: body.approved,
      rejectReason: body.rejectReason,
    });
  }

  // 增加库存（入库专用）
  @NeedLogin()
  @CanRole('inbound:create')
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
  @CanRole('outbound:create')
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

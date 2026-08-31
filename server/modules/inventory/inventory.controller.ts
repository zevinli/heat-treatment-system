import { BadRequestException, Controller, Get, Post, Put, Body, Query, Param, Req, Logger } from '@nestjs/common';
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
    let parsedMinStock: number | undefined;
    if (minStock !== undefined) {
      parsedMinStock = Number(minStock);
      if (!Number.isInteger(parsedMinStock) || parsedMinStock < 0) {
        throw new BadRequestException('minStock 必须为非负整数');
      }
    }
    const pagination = parsePagination(page, pageSize, {
      page: PAGINATION.DEFAULT_PAGE, pageSize: PAGINATION.DEFAULT_PAGE_SIZE, maxPageSize: PAGINATION.MAX_PAGE_SIZE,
    });
    return this.inventoryService.getInventorySummary({
      search,
      customerCode,
      material,
      minStock: parsedMinStock,
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
    const allowedChangeTypes = [
      'inbound', 'outbound', 'outbound_rollback', 'inbound_rollback',
      'adjustment_increase', 'adjustment_decrease', 'manual_increase', 'manual_decrease',
      'inventory_profit', 'inventory_loss', 'damage', 'quality_reject',
      'closed_balance', 'return', 'scrap', 'rework',
    ];
    if (changeType && !allowedChangeTypes.includes(changeType)) {
      throw new BadRequestException('无效的库存变动类型');
    }
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

  // 兼容旧客户端的管理员库存修正入口；正常入库必须通过 /api/inbound 创建完整单据和批次。
  @NeedLogin()
  @CanRole('inventory:adjust')
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

  // 兼容旧客户端的管理员库存修正入口；正常出库必须通过 /api/outbound 保留批次和对账链路。
  @NeedLogin()
  @CanRole('inventory:adjust')
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

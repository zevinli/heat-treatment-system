import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { CanRole, NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { OutboundService } from './outbound.service';
import { PAGINATION } from '../../config/constants';
import { parsePagination } from '../../common/utils/pagination';

@Controller('api/outbound')
export class OutboundController {
  private readonly logger = new Logger(OutboundController.name);

  constructor(private readonly outboundService: OutboundService) {}

  // 获取所有出库单
  @Get()
  @CanRole('outbound:view')
  async findAll(
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    // 验证 status 参数
    const validStatus = status && ['active', 'cancelled', 'all'].includes(status)
      ? status as 'active' | 'cancelled' | 'all'
      : 'all';
    
    const pagination = parsePagination(page, pageSize, {
      page: PAGINATION.DEFAULT_PAGE, pageSize: PAGINATION.DEFAULT_PAGE_SIZE, maxPageSize: PAGINATION.MAX_PAGE_SIZE,
    });
    return this.outboundService.findAll({
      customerId,
      status: validStatus,
      startDate,
      endDate,
      ...pagination,
    });
  }

  // 获取待对账的出库单 - 必须放在 :id 路由之前
  @Get('pending/:customerId')
  @CanRole('outbound:view')
  async getPendingReconciliation(@Param('customerId') customerId: string) {
    return this.outboundService.getPendingReconciliation(customerId);
  }

  // 获取出库单操作日志 - 必须放在 :id 路由之前
  @Get(':id/logs')
  @CanRole('outbound:view')
  async getOperationLogs(@Param('id') id: string) {
    return this.outboundService.getOperationLogs(id);
  }

  // 根据ID获取出库单
  @Get(':id')
  @CanRole('outbound:view')
  async findById(@Param('id') id: string) {
    return this.outboundService.findById(id);
  }

  // 创建出库单
  @NeedLogin()
  @CanRole('outbound:create')
  @Post()
  async create(
    @Body()
    body: {
      outboundNo: string;
      customerId: string;
      customerName: string;
      customerCode: string;
      outboundDate: string;
      creator: string;
      receiver?: string;
      transporter?: string;
      plateNumber?: string;
      driver?: string;
      totalAmount: number;
      totalQuantity: number;
      totalWeight: number;
      details: Array<{
        productId: string;
        productName: string;
        workpieceNo?: string;
        material?: string;
        process?: string;
        unit?: string;
        unitPrice?: number;
        quantity: number;
        weight: number;
        amount: number;
        batchNo?: string;
        inboundDate?: string;
        batchSelections?: Array<{
          batchId: string;
          batchNo: string;
          quantity: number;
          weight: number;
        }>;
        closeOrder?: boolean;
      }>;
    },
    @Req() req: Request,
  ) {
    // 验证出库日期格式
    const outboundDate = new Date(body.outboundDate);
    if (isNaN(outboundDate.getTime())) {
      throw new BadRequestException('无效的出库日期格式');
    }

    const { userId } = req.userContext;
    return this.outboundService.create({
      ...body,
      outboundDate,
      creator: userId,
      details: body.details.map(d => {
        const inboundDate = d.inboundDate ? new Date(d.inboundDate) : undefined;
        if (d.inboundDate && inboundDate && isNaN(inboundDate.getTime())) {
          throw new BadRequestException('无效的入库日期格式');
        }
        return {
          ...d,
          inboundDate,
        };
      }),
    });
  }

}

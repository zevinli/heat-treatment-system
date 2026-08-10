import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { InboundService } from './inbound.service';
import { PAGINATION } from '../../config/constants';

@Controller('api/inbound')
export class InboundController {
  private readonly logger = new Logger(InboundController.name);

  constructor(private readonly inboundService: InboundService) {}

  // 获取所有入库单
  @Get()
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
    
    return this.inboundService.findAll({
      customerId,
      status: validStatus,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : PAGINATION.DEFAULT_PAGE,
      pageSize: pageSize ? parseInt(pageSize, 10) : PAGINATION.DEFAULT_PAGE_SIZE,
    });
  }

  // 检查是否可以撤销 - 必须放在 :id 路由之前
  @Get(':id/can-cancel')
  async canCancel(@Param('id') id: string) {
    return this.inboundService.checkCanUndo(id);
  }

  // 获取入库单操作日志 - 必须放在 :id 路由之前
  @Get(':id/logs')
  async getOperationLogs(@Param('id') id: string) {
    return this.inboundService.getOperationLogs(id);
  }

  // 根据ID获取入库单
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.inboundService.findById(id);
  }

  // 创建入库单
  @NeedLogin()
  @Post()
  async create(
    @Body()
    body: {
      inboundNo?: string;
      customerId: string;
      customerName: string;
      customerCode: string;
      inboundDate: string;
      inboundTime?: string;
      creator?: string;
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
        productModel?: string;
        productSpec?: string;
        unit?: string;
        unitPrice?: number;
        quantity: number;
        weight: number;
        amount: number;
        inboundType?: string;
        process?: string;
        material?: string;
        techRequirement?: string;
        urgent?: boolean;
        attachments?: string[];
      }>;
    },
    @Req() req: Request,
  ) {
    // 验证入库日期格式
    const inboundDate = new Date(body.inboundDate);
    if (isNaN(inboundDate.getTime())) {
      throw new BadRequestException('无效的入库日期格式');
    }

    const { userId } = req.userContext;

    // 验证重量必填（按kg计价的产品）
    for (const detail of body.details) {
      if (detail.unit === 'kg' && (!detail.weight || detail.weight <= 0)) {
        throw new BadRequestException(`产品 ${detail.productName} 按kg计价，必须填写重量`);
      }
    }

    const newOrder = await this.inboundService.create({
      ...body,
      inboundDate,
      creator: userId,
    });

    return { success: true, message: '入库单创建成功', data: newOrder };
  }

  // 取消入库单（撤销）
  @NeedLogin()
  @Delete(':id')
  async cancel(
    @Param('id') id: string,
    @Req() req: Request,
    @Query('reason') reason?: string,
  ) {
    const { userId } = req.userContext;
    await this.inboundService.undo(id, userId, reason);
    return { success: true, message: '入库单已撤销' };
  }
}

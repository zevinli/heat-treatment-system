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
import { InboundService } from './inbound.service';
import { PAGINATION } from '../../config/constants';
import { parsePagination } from '../../common/utils/pagination';

@Controller('api/inbound')
export class InboundController {
  private readonly logger = new Logger(InboundController.name);

  constructor(private readonly inboundService: InboundService) {}

  // 获取所有入库单
  @Get()
  @CanRole('inbound:view')
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
    return this.inboundService.findAll({
      customerId,
      status: validStatus,
      startDate,
      endDate,
      ...pagination,
    });
  }

  // 获取入库单操作日志 - 必须放在 :id 路由之前
  @Get(':id/logs')
  @CanRole('inbound:view')
  async getOperationLogs(@Param('id') id: string) {
    return this.inboundService.getOperationLogs(id);
  }

  // 根据ID获取入库单
  @Get(':id')
  @CanRole('inbound:view')
  async findById(@Param('id') id: string) {
    return this.inboundService.findById(id);
  }

  // 创建入库单
  @NeedLogin()
  @CanRole('inbound:create')
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

    if (!Array.isArray(body.details) || body.details.length === 0) {
      throw new BadRequestException('入库明细不能为空');
    }
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

}

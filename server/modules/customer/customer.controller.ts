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
} from '@nestjs/common';
import { CanRole, NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { CustomerService } from './customer.service';
import { PAGINATION } from '../../config/constants';
import { parsePagination } from '../../common/utils/pagination';

@Controller('api/customers')
export class CustomerController {
  private readonly logger = new Logger(CustomerController.name);

  constructor(private readonly customerService: CustomerService) {}

  // 获取所有客户
  @Get()
  @CanRole('customer:view')
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pagination = parsePagination(page, pageSize, {
      page: PAGINATION.DEFAULT_PAGE, pageSize: PAGINATION.DEFAULT_PAGE_SIZE, maxPageSize: PAGINATION.MAX_PAGE_SIZE,
    });
    return this.customerService.findAll({
      search,
      status,
      ...pagination,
    });
  }

  // 根据ID获取客户
  @Get(':id')
  @CanRole('customer:view')
  async findById(@Param('id') id: string) {
    return this.customerService.findById(id);
  }

  // 创建客户
  @NeedLogin()
  @CanRole('customer:create')
  @Post()
  async create(
    @Body()
    body: {
      code: string;
      name: string;
      contact?: string;
      phone?: string;
      address?: string;
      transport?: string;
      paymentTerm?: string;
      deliveryDirection?: string;
      settlement?: string;
      category?: string;
      status?: string;
    },
  ) {
    return this.customerService.create(body);
  }

  // 更新客户
  @NeedLogin()
  @CanRole('customer:update')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      contact?: string;
      phone?: string;
      address?: string;
      transport?: string;
      paymentTerm?: string;
      deliveryDirection?: string;
      settlement?: string;
      category?: string;
      status?: string;
    },
  ) {
    return this.customerService.update(id, body);
  }

  // 删除客户
  @NeedLogin()
  @CanRole('customer:delete')
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request) {
    const { userId } = req.userContext;
    return this.customerService.delete(id, userId);
  }

  // 获取客户活跃度统计
  @Get(':id/activity')
  @CanRole('customer:view')
  async getActivity(@Param('id') id: string) {
    return this.customerService.getActivityStats(id);
  }

  // 检查客户是否可以停用
  @Get(':id/can-deactivate')
  @CanRole('customer:view')
  async canDeactivate(@Param('id') id: string) {
    return this.customerService.checkCanDeactivate(id);
  }
}

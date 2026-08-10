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
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReconciliationService } from './reconciliation.service';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';

@Controller('api/reconciliations')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('month') month?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.reconciliationService.findAll({
      customerId,
      status,
      month,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.reconciliationService.findById(id);
  }

  @NeedLogin()
  @Post()
  async create(
    @Body()
    body: {
      reconciliationNo: string;
      customerId: string;
      customerName: string;
      customerCode: string;
      month: string;
      outboundOrderIds: string[];
      deductionAmount?: number;
      otherAmount?: number;
      compensationAmount?: number;
    },
    @Req() req: Request,
  ) {
    const { userId } = req.userContext;
    return this.reconciliationService.create(body);
  }

  @NeedLogin()
  @Put(':id/amounts')
  async updateAmounts(
    @Param('id') id: string,
    @Body()
    body: {
      deductionAmount?: number;
      otherAmount?: number;
      compensationAmount?: number;
    },
  ) {
    return this.reconciliationService.update(id, body);
  }

  @NeedLogin()
  @Put(':id/invoice')
  async recordInvoice(
    @Param('id') id: string,
    @Body('amount') amount: number,
  ) {
    return this.reconciliationService.addInvoice(id, amount);
  }

  @NeedLogin()
  @Put(':id/receipt')
  async recordReceipt(
    @Param('id') id: string,
    @Body('amount') amount: number,
  ) {
    return this.reconciliationService.addReceipt(id, amount);
  }

  @NeedLogin()
  @Put(':id/audit')
  async audit(
    @Param('id') id: string,
    @Body('auditor') auditor: string,
    @Req() req: Request,
  ) {
    const { userId } = req.userContext;
    return this.reconciliationService.audit(id, auditor || userId);
  }

  @NeedLogin()
  @Put(':id/confirm')
  async confirm(@Param('id') id: string) {
    return this.reconciliationService.confirm(id);
  }

  @NeedLogin()
  @Put(':id/unaudit')
  async unaudit(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: Request,
  ) {
    const { userId } = req.userContext;
    if (!reason || reason.trim().length < 10) {
      throw new BadRequestException('反审核原因不能为空且至少10个字');
    }
    return this.reconciliationService.unaudit(id, userId, reason);
  }

  @NeedLogin()
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.reconciliationService.delete(id);
  }

  @NeedLogin()
  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    return this.reconciliationService.getHistory(id);
  }

  @Get('customers/:customerId/debt')
  async getCustomerDebt(@Param('customerId') customerId: string) {
    return this.reconciliationService.getCustomerDebtSummary(customerId);
  }
}

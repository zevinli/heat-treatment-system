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
import { CanRole, NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { parsePagination } from '../../common/utils/pagination';

@Controller('api/reconciliations')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Get()
  @CanRole('reconciliation:view')
  async findAll(
    @Query('search') search?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('month') month?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pagination = parsePagination(page, pageSize, { page: 1, pageSize: 20, maxPageSize: 100 });
    return this.reconciliationService.findAll({
      customerId,
      status,
      month,
      ...pagination,
    });
  }

  @Get(':id')
  @CanRole('reconciliation:view')
  async findById(@Param('id') id: string) {
    return this.reconciliationService.findById(id);
  }

  @Get(':id/check-action')
  @CanRole('reconciliation:view')
  async checkAction(
    @Param('id') id: string,
    @Query('action') action: 'delete' | 'unaudit',
  ) {
    if (!['delete', 'unaudit'].includes(action)) throw new BadRequestException('action 必须为 delete 或 unaudit');
    return this.reconciliationService.checkAction(id, action);
  }

  @Get(':id/calculation')
  @CanRole('reconciliation:view')
  async getCalculation(@Param('id') id: string) {
    return this.reconciliationService.getCalculation(id);
  }

  @NeedLogin()
  @CanRole('reconciliation:create')
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
  @CanRole('reconciliation:create')
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
  @CanRole('reconciliation:audit')
  @Put(':id/invoice')
  async recordInvoice(
    @Param('id') id: string,
    @Body('amount') amount: number,
  ) {
    return this.reconciliationService.addInvoice(id, amount);
  }

  @NeedLogin()
  @CanRole('reconciliation:audit')
  @Put(':id/receipt')
  async recordReceipt(
    @Param('id') id: string,
    @Body('amount') amount: number,
  ) {
    return this.reconciliationService.addReceipt(id, amount);
  }

  @NeedLogin()
  @CanRole('reconciliation:audit')
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
  @CanRole('reconciliation:create')
  @Put(':id/confirm')
  async confirm(@Param('id') id: string) {
    return this.reconciliationService.confirm(id);
  }

  @NeedLogin()
  @CanRole('reconciliation:unaudit')
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
  @CanRole('reconciliation:unaudit')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.reconciliationService.delete(id);
  }

  @NeedLogin()
  @CanRole('reconciliation:view')
  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    return this.reconciliationService.getHistory(id);
  }

  @Get('customers/:customerId/debt')
  @CanRole('reconciliation:view')
  async getCustomerDebt(@Param('customerId') customerId: string) {
    return this.reconciliationService.getCustomerDebtSummary(customerId);
  }
}

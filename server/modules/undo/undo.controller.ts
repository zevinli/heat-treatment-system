import { Controller, Get, Post, Put, Param, Body, Query, Req, BadRequestException } from '@nestjs/common';
import { NeedLogin, CanRole } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { UndoService } from './undo.service';
import { InboundService } from '../inbound/inbound.service';
import { OutboundService } from '../outbound/outbound.service';

@Controller('api/undo')
export class UndoController {
  constructor(
    private readonly undoService: UndoService,
    private readonly inboundService: InboundService,
    private readonly outboundService: OutboundService,
  ) {}

  /**
   * 检查出库单是否可撤销
   */
  @Get('outbound/:id/can-undo')
  @CanRole('outbound:undo')
  async canUndoOutbound(@Param('id') id: string, @Req() req: Request) {
    const context = req.userContext!;
    return this.undoService.canUndoOutbound(id, context.userId, context.userRole === 'admin');
  }

  /**
   * 撤销出库单
   */
  @NeedLogin()
  @CanRole('outbound:undo')
  @Post('outbound/:id')
  async undoOutbound(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: Request,
  ) {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException('撤销原因至少需要5个字符');
    }
    const { userId } = req.userContext;
    // P1: 统一使用OutboundService.cancel，确保批次库存正确恢复
    await this.outboundService.cancel(id, userId, reason.trim(), req.userContext?.userRole === 'admin');
    return { success: true, message: '出库单已撤销' };
  }

  /**
   * 检查入库单是否可撤销
   */
  @Get('inbound/:id/can-undo')
  @CanRole('inbound:undo')
  async canUndoInbound(@Param('id') id: string, @Req() req: Request) {
    const context = req.userContext!;
    return this.inboundService.checkCanUndo(id, context.userId, context.userRole === 'admin');
  }

  /**
   * 撤销入库单
   */
  @NeedLogin()
  @CanRole('inbound:undo')
  @Post('inbound/:id')
  async undoInbound(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: Request,
  ) {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException('撤销原因至少需要5个字符');
    }
    const { userId } = req.userContext;
    // P1: 统一使用InboundService.undo，确保客户统计正确更新
    await this.inboundService.undo(id, userId, reason.trim(), req.userContext?.userRole === 'admin');
    return { success: true, message: '入库单已撤销' };
  }

  @NeedLogin()
  @CanRole('inbound:undo')
  @Post('inbound/:id/request')
  async requestInboundUndo(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: Request,
  ) {
    const context = req.userContext!;
    const check = await this.inboundService.checkCanUndo(id, context.userId, context.userRole === 'admin');
    if (check.canUndo) throw new BadRequestException('该单据仍在直接撤销时限内，无需申请审批');
    if (!check.reason?.includes('撤销时限')) throw new BadRequestException(check.reason || '该单据无法申请撤销');
    const request = await this.undoService.requestApproval('inbound_undo', 'inbound_order', id, context.userId!, reason);
    return { success: true, message: '撤销申请已提交', requestId: request.id };
  }

  @NeedLogin()
  @CanRole('outbound:undo')
  @Post('outbound/:id/request')
  async requestOutboundUndo(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: Request,
  ) {
    const context = req.userContext!;
    const check = await this.undoService.canUndoOutbound(id, context.userId, context.userRole === 'admin');
    if (check.canUndo) throw new BadRequestException('该单据仍在直接撤销时限内，无需申请审批');
    if (!check.reason?.includes('撤销时限')) throw new BadRequestException(check.reason || '该单据无法申请撤销');
    const request = await this.undoService.requestApproval('outbound_undo', 'outbound_order', id, context.userId!, reason);
    return { success: true, message: '撤销申请已提交', requestId: request.id };
  }

  @NeedLogin()
  @CanRole('system:permission')
  @Get('approvals')
  async listApprovals(@Query('status') status?: 'pending' | 'approved' | 'rejected') {
    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
      throw new BadRequestException('无效审批状态');
    }
    return { items: await this.undoService.listApprovals(status || 'pending') };
  }

  @NeedLogin()
  @CanRole('system:permission')
  @Put('approvals/:id/decision')
  async decideApproval(
    @Param('id') id: string,
    @Body() body: { approved: boolean; rejectReason?: string },
    @Req() req: Request,
  ) {
    if (typeof body.approved !== 'boolean') throw new BadRequestException('approved 必须为布尔值');
    const request = await this.undoService.getApproval(id);
    if (request.status !== 'pending') throw new BadRequestException('审批申请已处理');
    const approver = req.userContext!.userId!;
    if (body.approved) {
      const reason = `审批撤销：${request.reason}`;
      if (request.type === 'inbound_undo') {
        const order = await this.inboundService.findById(request.entityId);
        if (order?.status !== 'cancelled') {
          await this.inboundService.undo(request.entityId, approver, reason, true, true);
        }
      } else {
        const order = await this.outboundService.findById(request.entityId);
        if (order?.status !== 'cancelled') {
          await this.outboundService.cancel(request.entityId, approver, reason, true, true);
        }
      }
    }
    await this.undoService.settleApproval(id, approver, body.approved, body.rejectReason);
    return { success: true, message: body.approved ? '已批准并完成撤销' : '已拒绝撤销申请' };
  }
}

import { Controller, Get, Post, Param, Body, Req, BadRequestException } from '@nestjs/common';
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
  async canUndoOutbound(@Param('id') id: string) {
    return this.undoService.canUndoOutbound(id);
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
    await this.outboundService.cancel(id, userId, reason.trim());
    return { success: true, message: '出库单已撤销' };
  }

  /**
   * 检查入库单是否可撤销
   */
  @Get('inbound/:id/can-undo')
  async canUndoInbound(@Param('id') id: string) {
    return this.undoService.canUndoInbound(id);
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
    await this.inboundService.undo(id, userId, reason.trim());
    return { success: true, message: '入库单已撤销' };
  }
}

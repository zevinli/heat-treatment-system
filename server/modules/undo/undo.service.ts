import { Injectable, Inject, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { eq, and, sql, desc } from 'drizzle-orm';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { outboundOrderTable, outboundDetail, productTable, productBatchTable, productBatchStockTable, undoLogTable, inventoryRecordTable, reconciliationTable, inboundOrderTable, operationLogTable, customer } from '../../database/schema';
import { checkUndoable } from '../../common/utils/undo-check.util';
import { PermissionService } from '../permission/permission.service';

/**
 * 撤销服务 - 支持出库/入库撤销
 * 冲突解决：#1(批次追溯), #2(对账锁定), #10(并发撤销)
 * 权限控制：#2(创建者权限), #3(管理员权限)
 */
@Injectable()
export class UndoService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly permissionService: PermissionService,
  ) {}

  /**
   * 检查出库单是否可撤销
   */
  async canUndoOutbound(outboundOrderId: string): Promise<{
    canUndo: boolean;
    reason?: string;
    remainingSeconds?: number;
  }> {
    const [order] = await this.db
      .select()
      .from(outboundOrderTable)
      .where(eq(outboundOrderTable.id, outboundOrderId));

    if (!order) {
      return { canUndo: false, reason: '出库单不存在' };
    }

    if (order.status === 'cancelled') {
      return { canUndo: false, reason: '该出库单已撤销' };
    }

    if (order.lockStatus === 'locked' || order.reconciliationId) {
      return { canUndo: false, reason: '该出库单已参与对账，无法撤销' };
    }

    // 使用统一工具函数检查撤销时限
    const timeCheck = checkUndoable(order.createdAt, false);
    if (!timeCheck.canUndo) {
      return { canUndo: false, reason: timeCheck.reason };
    }

    return {
      canUndo: true,
      remainingSeconds: Math.floor((timeCheck.timeRemaining || 0) / 1000),
    };
  }

  /**
   * 检查入库单是否可撤销
   * 冲突解决：#1(批次追溯)
   */
  async canUndoInbound(inboundOrderId: string, operatorId?: string): Promise<{
    canUndo: boolean;
    reason?: string;
    usedBatches?: { batchNo: string; usedQty: number }[];
  }> {
    // 如果提供了 operatorId，检查基础权限
    if (operatorId) {
      const hasPermission = await this.permissionService.hasPermission(operatorId, 'inbound:undo');
      if (!hasPermission) {
        return { canUndo: false, reason: '无权撤销入库单' };
      }
    }
    const batches = await this.db
      .select()
      .from(productBatchTable)
      .where(eq(productBatchTable.inboundOrderId, inboundOrderId));

    const usedBatches: { batchNo: string; usedQty: number }[] = [];

    for (const batch of batches) {
      const details = await this.db
        .select()
        .from(outboundDetail)
        .where(eq(outboundDetail.batchNo, batch.batchNo));

      const usedQty = details.reduce((sum, d) => sum + d.quantity, 0);
      if (usedQty > 0) {
        usedBatches.push({ batchNo: batch.batchNo, usedQty });
      }
    }

    if (usedBatches.length > 0) {
      return {
        canUndo: false,
        reason: '部分批次已出库，无法撤销',
        usedBatches,
      };
    }

    return { canUndo: true };
  }

}

import { Injectable, Inject, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import {
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { TENANT_DATABASE } from '../../common/tenant-database.provider';
import { outboundOrderTable, outboundDetail, productTable, productBatchTable, productBatchStockTable, undoLogTable, inventoryRecordTable, reconciliationTable, inboundOrderTable, operationLogTable, customer, approvalRequestTable } from '../../database/schema';
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
    @Inject(TENANT_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly permissionService: PermissionService,
  ) {}

  /**
   * 检查出库单是否可撤销
   */
  async canUndoOutbound(outboundOrderId: string, operatorId?: string, allowAny = false): Promise<{
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
    if (operatorId && !allowAny && order.creator !== operatorId) {
      return { canUndo: false, reason: '普通操作员只能撤销自己创建的出库单' };
    }

    if (order.lockStatus === 'locked' || order.reconciliationId) {
      return { canUndo: false, reason: '该出库单已参与对账，无法撤销' };
    }

    // 使用统一工具函数检查撤销时限
    const [approvedRequest] = await this.db.select({ id: approvalRequestTable.id })
      .from(approvalRequestTable)
      .where(and(
        eq(approvalRequestTable.entityId, outboundOrderId),
        eq(approvalRequestTable.type, 'outbound_undo'),
        eq(approvalRequestTable.status, 'approved'),
      )).limit(1);
    const timeCheck = checkUndoable(order.createdAt, Boolean(approvedRequest));
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

  async requestApproval(
    type: 'inbound_undo' | 'outbound_undo',
    entityType: 'inbound_order' | 'outbound_order',
    entityId: string,
    requester: string,
    reason: string,
  ) {
    const normalizedReason = reason?.trim();
    if (!normalizedReason || normalizedReason.length < 5) {
      throw new BadRequestException('撤销原因至少需要5个字符');
    }
    const [existing] = await this.db.select({ id: approvalRequestTable.id })
      .from(approvalRequestTable)
      .where(and(
        eq(approvalRequestTable.type, type),
        eq(approvalRequestTable.entityId, entityId),
        eq(approvalRequestTable.status, 'pending'),
      )).limit(1);
    if (existing) throw new BadRequestException('该单据已有待处理的撤销申请');
    try {
      const [request] = await this.db.insert(approvalRequestTable).values({
        type,
        entityType,
        entityId,
        requester,
        reason: normalizedReason,
        status: 'pending',
      }).returning();
      return request;
    } catch (error: any) {
      if (error?.code === '23505') throw new ConflictException('该单据已有待处理的撤销申请');
      throw error;
    }
  }

  async listApprovals(status: 'pending' | 'approved' | 'rejected' = 'pending') {
    return this.db.select().from(approvalRequestTable)
      .where(and(
        inArray(approvalRequestTable.type, ['inbound_undo', 'outbound_undo']),
        eq(approvalRequestTable.status, status),
      ))
      .orderBy(desc(approvalRequestTable.requestedAt));
  }

  async getApproval(id: string) {
    const [request] = await this.db.select().from(approvalRequestTable)
      .where(and(
        eq(approvalRequestTable.id, id),
        inArray(approvalRequestTable.type, ['inbound_undo', 'outbound_undo']),
      )).limit(1);
    if (!request) throw new NotFoundException('撤销审批申请不存在');
    return request;
  }

  async settleApproval(id: string, approver: string, approved: boolean, rejectReason?: string) {
    if (!approved && (!rejectReason?.trim() || rejectReason.trim().length < 2)) {
      throw new BadRequestException('拒绝时请输入至少2个字符的原因');
    }
    const [updated] = await this.db.update(approvalRequestTable).set({
      status: approved ? 'approved' : 'rejected',
      approver,
      ...(approved ? { approvedAt: new Date(), rejectedAt: null, rejectReason: null } : {
        rejectedAt: new Date(),
        rejectReason: rejectReason!.trim(),
      }),
      updatedAt: new Date(),
    }).where(and(
      eq(approvalRequestTable.id, id),
      eq(approvalRequestTable.status, 'pending'),
    )).returning();
    if (!updated) throw new ConflictException('审批申请已被其他人处理');
    return updated;
  }

}

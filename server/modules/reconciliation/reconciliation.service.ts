import { Injectable, Inject, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and, desc, sql, inArray, ne } from 'drizzle-orm';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import {
  reconciliation as reconciliationTable,
  reconciliationDetail,
  reconciliationDetailVersion,
  outboundOrder as outboundOrderTable,
  outboundDetail as outboundDetailTable,
  product as productTable,
  approvalRequest as approvalRequestTable,
  operationLog as operationLogTable,
} from '../../database/schema';
import { centsToYuan, yuanToCents } from '../../common/utils/currency';

// 对账单状态类型
export type ReconciliationStatus = 'draft' | 'confirmed' | 'audited' | 'invoiced' | 'partial_paid' | 'paid' | 'cancelled' | 'voided';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // 状态流转规则定义
  private readonly statusTransitions: Record<ReconciliationStatus, ReconciliationStatus[]> = {
    draft: ['confirmed', 'cancelled'],
    confirmed: ['audited', 'draft'],
    audited: ['invoiced', 'confirmed'], // P2: 反审核后回到confirmed，可重新审核
    invoiced: ['partial_paid', 'paid'],
    partial_paid: ['paid', 'invoiced'],
    paid: [],
    cancelled: [],
    voided: [],
  };

  // 验证状态流转是否合法
  private validateStatusTransition(from: ReconciliationStatus, to: ReconciliationStatus): void {
    const allowedTransitions = this.statusTransitions[from] || [];
    if (!allowedTransitions.includes(to)) {
      throw new BadRequestException(`非法的状态流转: ${from} -> ${to}, 允许的目标状态: [${allowedTransitions.join(', ')}]`);
    }
  }

  // 获取所有对账单
  async findAll(params: {
    customerId?: string;
    status?: string;
    month?: string;
    page?: number;
    pageSize?: number;
    includeVoided?: boolean;
  }) {
    const { customerId, status, month, page = 1, pageSize = 10, includeVoided = false } = params;

    const conditions = [];

    // 默认排除已作废的对账单
    if (!includeVoided) {
      conditions.push(ne(reconciliationTable.status, 'voided'));
    }

    if (customerId) {
      conditions.push(eq(reconciliationTable.customerId, customerId));
    }
    if (status && status !== 'all') {
      conditions.push(eq(reconciliationTable.status, status));
    }
    if (month && month !== 'all') {
      conditions.push(eq(reconciliationTable.month, month));
    }

    const offset = (page - 1) * pageSize;
    const query = conditions.length > 0
      ? this.db.select().from(reconciliationTable).where(and(...conditions))
      : this.db.select().from(reconciliationTable);

    const results = await query
      .orderBy(desc(reconciliationTable.createdAt))
      .limit(pageSize)
      .offset(offset);

    return results;
  }

  // 根据ID获取对账单
  async findById(id: string) {
    const [reconciliation] = await this.db
      .select()
      .from(reconciliationTable)
      .where(eq(reconciliationTable.id, id));

    if (!reconciliation) {
      return null;
    }

    // 获取当前生效的明细（isActive = true）
    const details = await this.db
      .select()
      .from(reconciliationDetail)
      .where(
        and(
          eq(reconciliationDetail.reconciliationId, id),
          eq(reconciliationDetail.isActive, true)
        )
      );

    return {
      ...reconciliation,
      details,
    };
  }

  // 创建对账单
  async create(data: {
    customerId: string;
    customerName: string;
    customerCode: string;
    month: string;
    outboundOrderIds: string[];
    deductionAmount?: number;
    otherAmount?: number;
    compensationAmount?: number;
  }) {
    const {
      customerId,
      customerName,
      customerCode,
      month,
      outboundOrderIds,
      deductionAmount = 0,
      otherAmount = 0,
      compensationAmount = 0,
    } = data;

    // 检查出库单
    if (!outboundOrderIds || outboundOrderIds.length === 0) {
      throw new BadRequestException('请至少选择一个出库单');
    }

    const outboundOrders = await this.db
      .select()
      .from(outboundOrderTable)
      .where(and(
        inArray(outboundOrderTable.id, outboundOrderIds),
        eq(outboundOrderTable.status, 'pending_reconciliation')
      ));

    if (outboundOrders.length !== outboundOrderIds.length) {
      throw new BadRequestException('部分出库单状态不正确或不存在');
    }

    // 计算总金额
    let totalAmount = 0;
    for (const order of outboundOrders) {
      totalAmount += order.totalAmount;
    }

    const finalAmount = totalAmount - deductionAmount + otherAmount - compensationAmount;

    // 生成对账单号：RZ + 年月日 + 4位序号
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const reconciliationNo = `RZ${dateStr}${Math.floor(Math.random() * 9000 + 1000)}`;

    // 创建对账单
    const [reconciliation] = await this.db
      .insert(reconciliationTable)
      .values({
        reconciliationNo,
        customerId,
        customerName,
        customerCode,
        month,
        totalAmount,
        totalAmountCents: yuanToCents(totalAmount),
        deductionAmount,
        deductionAmountCents: yuanToCents(deductionAmount),
        otherAmount,
        otherAmountCents: yuanToCents(otherAmount),
        compensationAmount,
        compensationAmountCents: yuanToCents(compensationAmount),
        finalAmount,
        finalAmountCents: yuanToCents(finalAmount),
        invoiceAmount: 0,
        invoiceAmountCents: 0,
        uninvoiceAmount: finalAmount,
        receiptAmount: 0,
        receiptAmountCents: 0,
        unreceivedAmount: finalAmount,
        status: 'confirmed',
      })
      .returning();

    // 创建明细并锁定出库单
    for (const order of outboundOrders) {
      // 获取出库单明细
      const details = await this.db
        .select()
        .from(outboundDetailTable)
        .where(eq(outboundDetailTable.outboundId, order.id));

      // 创建对账明细
      for (const detail of details) {
        await this.db.insert(reconciliationDetail).values({
          reconciliationId: reconciliation.id,
          outboundNo: order.outboundNo,
          outboundDate: order.outboundDate,
          productName: detail.productName,
          workpieceNo: detail.workpieceNo,
          material: detail.material,
          process: detail.process,
          quantity: detail.quantity,
          weight: detail.weight,
          unitPrice: detail.unitPrice,
          amount: detail.amount,
          unit: detail.unit,
        });
      }

      // 锁定出库单并更新状态
      await this.db
        .update(outboundOrderTable)
        .set({
          reconciliationId: reconciliation.id,
          lockStatus: 'locked',
          lockedAt: new Date(),
          status: 'reconciled',
        })
        .where(eq(outboundOrderTable.id, order.id));
    }

    this.logger.log(`对账单创建: ${reconciliation.reconciliationNo}`);
    return this.findById(reconciliation.id);
  }

  // 更新对账单
  async update(id: string, data: Partial<{
    deductionAmount: number;
    otherAmount: number;
    compensationAmount: number;
  }>) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('对账单不存在');
    }

    // 只有draft和confirmed状态可以修改
    if (!['draft', 'confirmed'].includes(existing.status)) {
      throw new BadRequestException('当前状态不允许修改');
    }

    const updateData: any = {};

    if (data.deductionAmount !== undefined) {
      updateData.deductionAmount = data.deductionAmount;
      updateData.deductionAmountCents = yuanToCents(data.deductionAmount);
    }
    if (data.otherAmount !== undefined) {
      updateData.otherAmount = data.otherAmount;
      updateData.otherAmountCents = yuanToCents(data.otherAmount);
    }
    if (data.compensationAmount !== undefined) {
      updateData.compensationAmount = data.compensationAmount;
      updateData.compensationAmountCents = yuanToCents(data.compensationAmount);
    }

    // 重新计算最终金额
    const totalAmount = existing.totalAmount;
    const deductionAmount = data.deductionAmount ?? existing.deductionAmount;
    const otherAmount = data.otherAmount ?? existing.otherAmount;
    const compensationAmount = data.compensationAmount ?? existing.compensationAmount;
    const finalAmount = totalAmount - deductionAmount + otherAmount - compensationAmount;

    updateData.finalAmount = finalAmount;
    updateData.finalAmountCents = yuanToCents(finalAmount);
    updateData.uninvoiceAmount = finalAmount - existing.invoiceAmount;
    updateData.unreceivedAmount = finalAmount - existing.receiptAmount;

    const [updated] = await this.db
      .update(reconciliationTable)
      .set(updateData)
      .where(eq(reconciliationTable.id, id))
      .returning();

    this.logger.log(`对账单更新: ${existing.reconciliationNo}`);
    return this.findById(updated.id);
  }

  // 审核对账单
  async audit(id: string, auditor: string) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('对账单不存在');
    }

    // 校验状态流转：只有confirmed状态可以审核到audited
    this.validateStatusTransition(existing.status as ReconciliationStatus, 'audited');

    if (existing.status !== 'confirmed') {
      throw new BadRequestException('只有已确认的对账单可以审核');
    }

    // 检查出库单变更（如果是重新审核）
    const outboundChanges = await this.checkOutboundChanges(id);

    // 获取当前最大版本号
    const maxVersion = await this.getMaxVersion(id);
    const newVersion = maxVersion + 1;

    // 如果有失效的明细（即之前反审核过），重新生成新版本明细
    const inactiveDetails = await this.db
      .select()
      .from(reconciliationDetail)
      .where(
        and(
          eq(reconciliationDetail.reconciliationId, id),
          eq(reconciliationDetail.isActive, false)
        )
      );

    if (inactiveDetails.length > 0) {
      // 获取当前关联的出库单（排除已撤销的单据）
      const outboundOrders = await this.db
        .select()
        .from(outboundOrderTable)
        .where(
          and(
            eq(outboundOrderTable.reconciliationId, id),
            eq(outboundOrderTable.status, 'pending_reconciliation')
          )
        );

      // 重新生成明细（新版本）- 只包含未撤销的出库单
      for (const order of outboundOrders) {
        const details = await this.db
          .select()
          .from(outboundDetailTable)
          .where(eq(outboundDetailTable.outboundId, order.id));

        for (const detail of details) {
          await this.db.insert(reconciliationDetail).values({
            reconciliationId: id,
            outboundNo: order.outboundNo,
            outboundDate: order.outboundDate,
            productName: detail.productName,
            workpieceNo: detail.workpieceNo,
            material: detail.material,
            process: detail.process,
            quantity: detail.quantity,
            weight: detail.weight,
            unitPrice: detail.unitPrice,
            amount: detail.amount,
            unit: detail.unit,
            version: newVersion,
            isActive: true,
          });
        }
      }

      // 重新计算对账单总金额（排除已撤销的出库单后）
      const newTotalAmount = outboundOrders.reduce(
        (sum, order) => sum + (order.totalAmount || 0),
        0
      );
      const newTotalAmountCents = Math.round(newTotalAmount * 100);

      // 更新对账单金额
      await this.db
        .update(reconciliationTable)
        .set({
          totalAmount: newTotalAmount,
          totalAmountCents: newTotalAmountCents,
          finalAmount: newTotalAmount - (existing.deductionAmount || 0) + (existing.otherAmount || 0) - (existing.compensationAmount || 0),
          finalAmountCents: Math.round((newTotalAmount - (existing.deductionAmount || 0) + (existing.otherAmount || 0) - (existing.compensationAmount || 0)) * 100),
          uninvoiceAmount: newTotalAmount - (existing.deductionAmount || 0) + (existing.otherAmount || 0) - (existing.compensationAmount || 0) - (existing.invoiceAmount || 0),
          unreceivedAmount: newTotalAmount - (existing.deductionAmount || 0) + (existing.otherAmount || 0) - (existing.compensationAmount || 0) - (existing.receiptAmount || 0),
          version: newVersion,
        })
        .where(eq(reconciliationTable.id, id));
    }

    const [updated] = await this.db
      .update(reconciliationTable)
      .set({
        status: 'audited',
        auditor,
        auditedAt: new Date(),
      })
      .where(eq(reconciliationTable.id, id))
      .returning();

    this.logger.log(`对账单审核: ${existing.reconciliationNo}, 审核人: ${auditor}`);

    const result = await this.findById(updated.id);
    return {
      ...result,
      outboundChanges, // 返回出库单变更信息
    };
  }

  // 检查出库单变更
  private async checkOutboundChanges(reconciliationId: string): Promise<{
    hasChanges: boolean;
    changes: Array<{
      outboundNo: string;
      type: 'modified' | 'cancelled' | 'shipped';
      oldAmount?: number;
      newAmount?: number;
    }>;
  }> {
    const reconciliation = await this.db
      .select({ outboundSnapshot: reconciliationTable.outboundSnapshot })
      .from(reconciliationTable)
      .where(eq(reconciliationTable.id, reconciliationId))
      .then(rows => rows[0]);

    if (!reconciliation?.outboundSnapshot) {
      return { hasChanges: false, changes: [] };
    }

    const snapshot = reconciliation.outboundSnapshot as {
      snapshotAt: string;
      outboundOrders: Array<{
        id: string;
        outboundNo: string;
        totalAmount: number;
        totalQuantity: number;
        status: string;
      }>;
    };

    const changes: Array<{
      outboundNo: string;
      type: 'modified' | 'cancelled' | 'shipped';
      oldAmount?: number;
      newAmount?: number;
    }> = [];

    for (const snapOrder of snapshot.outboundOrders) {
      const currentOrder = await this.db
        .select({
          totalAmount: outboundOrderTable.totalAmount,
          status: outboundOrderTable.status,
        })
        .from(outboundOrderTable)
        .where(eq(outboundOrderTable.id, snapOrder.id))
        .then(rows => rows[0]);

      if (!currentOrder) {
        changes.push({
          outboundNo: snapOrder.outboundNo,
          type: 'cancelled',
          oldAmount: snapOrder.totalAmount,
        });
      } else if (currentOrder.status === 'cancelled') {
        changes.push({
          outboundNo: snapOrder.outboundNo,
          type: 'cancelled',
          oldAmount: snapOrder.totalAmount,
        });
      } else if (currentOrder.totalAmount !== snapOrder.totalAmount) {
        changes.push({
          outboundNo: snapOrder.outboundNo,
          type: 'modified',
          oldAmount: snapOrder.totalAmount,
          newAmount: currentOrder.totalAmount,
        });
      } else if (currentOrder.status === 'shipped') {
        changes.push({
          outboundNo: snapOrder.outboundNo,
          type: 'shipped',
        });
      }
    }

    return {
      hasChanges: changes.length > 0,
      changes,
    };
  }

  // 添加开票记录
  async addInvoice(id: string, amount: number) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('对账单不存在');
    }

    const amountCents = yuanToCents(amount);
    const newInvoiceAmountCents = existing.invoiceAmountCents + amountCents;

    if (newInvoiceAmountCents > existing.finalAmountCents) {
      throw new BadRequestException('开票金额不能超过对账金额');
    }

    // 更新开票记录数组
    const invoiceRecords = (existing.invoiceRecords as Array<{ amount: number; date: string }>) || [];
    invoiceRecords.push({
      amount,
      date: new Date().toISOString(),
    });

    const [updated] = await this.db
      .update(reconciliationTable)
      .set({
        invoiceAmountCents: newInvoiceAmountCents,
        invoiceAmount: centsToYuan(newInvoiceAmountCents),
        uninvoiceAmount: centsToYuan(existing.finalAmountCents - newInvoiceAmountCents),
        invoiceRecords,
        status: newInvoiceAmountCents >= existing.finalAmountCents ? 'invoiced' : existing.status,
      })
      .where(eq(reconciliationTable.id, id))
      .returning();

    this.logger.log(`对账单开票: ${existing.reconciliationNo}, 金额: ${amount}`);
    return this.findById(updated.id);
  }

  // 添加回款记录
  async addReceipt(id: string, amount: number) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('对账单不存在');
    }

    const amountCents = yuanToCents(amount);
    const newReceiptAmountCents = existing.receiptAmountCents + amountCents;

    if (newReceiptAmountCents > existing.finalAmountCents) {
      throw new BadRequestException('回款金额不能超过对账金额');
    }

    // 更新回款记录数组
    const receiptRecords = (existing.receiptRecords as Array<{ amount: number; date: string }>) || [];
    receiptRecords.push({
      amount,
      date: new Date().toISOString(),
    });

    const isFullyPaid = newReceiptAmountCents >= existing.finalAmountCents;
    const isPartialPaid = newReceiptAmountCents > 0 && newReceiptAmountCents < existing.finalAmountCents;

    const [updated] = await this.db
      .update(reconciliationTable)
      .set({
        receiptAmountCents: newReceiptAmountCents,
        receiptAmount: centsToYuan(newReceiptAmountCents),
        unreceivedAmount: centsToYuan(existing.finalAmountCents - newReceiptAmountCents),
        receiptRecords,
        status: isFullyPaid ? 'paid' : isPartialPaid ? 'partial_paid' : existing.status,
      })
      .where(eq(reconciliationTable.id, id))
      .returning();

    this.logger.log(`对账单回款: ${existing.reconciliationNo}, 金额: ${amount}`);
    return this.findById(updated.id);
  }

  // 申请取消对账单
  async requestCancel(id: string, requester: string, reason: string) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('对账单不存在');
    }

    // 只有audited及以上状态需要申请
    if (!['audited', 'invoiced', 'partial_paid'].includes(existing.status)) {
      // draft和confirmed状态可以直接取消
      await this.executeCancel(id);
      return { success: true, message: '对账单已直接取消' };
    }

    // 创建审批申请
    const [request] = await this.db
      .insert(approvalRequestTable)
      .values({
        type: 'reconciliation_cancel',
        entityType: 'reconciliation',
        entityId: id,
        requester,
        reason,
        status: 'pending',
      })
      .returning();

    this.logger.log(`对账单取消申请: ${existing.reconciliationNo}, 申请人: ${requester}`);
    return {
      success: true,
      message: '取消申请已提交，等待审批',
      requestId: request.id,
    };
  }

  // 审批取消申请
  async approveCancel(requestId: string, approver: string, approved: boolean, rejectReason?: string) {
    const [request] = await this.db
      .select()
      .from(approvalRequestTable)
      .where(eq(approvalRequestTable.id, requestId));

    if (!request) {
      throw new NotFoundException('审批申请不存在');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('审批申请已处理');
    }

    if (approved) {
      // 执行取消
      await this.executeCancel(request.entityId);

      // 更新审批状态
      await this.db
        .update(approvalRequestTable)
        .set({
          status: 'approved',
          approver,
          approvedAt: new Date(),
        })
        .where(eq(approvalRequestTable.id, requestId));

      this.logger.log(`对账单取消申请已批准: ${request.entityId}`);
    } else {
      // 拒绝审批
      await this.db
        .update(approvalRequestTable)
        .set({
          status: 'rejected',
          approver,
          rejectedAt: new Date(),
          rejectReason: rejectReason || '审批拒绝',
        })
        .where(eq(approvalRequestTable.id, requestId));

      this.logger.log(`对账单取消申请已拒绝: ${request.entityId}, 原因: ${rejectReason}`);
    }
  }

  // 执行取消对账单 - 内部方法
  private async executeCancel(id: string): Promise<void> {
    const [existing] = await this.db
      .select()
      .from(reconciliationTable)
      .where(eq(reconciliationTable.id, id));

    if (!existing) {
      throw new NotFoundException('对账单不存在');
    }

    // 解除出库单锁定并恢复状态为待对账
    await this.db
      .update(outboundOrderTable)
      .set({
        reconciliationId: null,
        lockStatus: 'unlocked',
        lockedAt: null,
        status: 'pending_reconciliation',
      })
      .where(eq(outboundOrderTable.reconciliationId, id));

    // 删除对账明细
    await this.db
      .delete(reconciliationDetail)
      .where(eq(reconciliationDetail.reconciliationId, id));

    // 更新对账单状态为取消
    await this.db
      .update(reconciliationTable)
      .set({
        status: 'cancelled',
        isLocked: false,
      })
      .where(eq(reconciliationTable.id, id));

    this.logger.log(`对账单已取消: ${existing.reconciliationNo}`);
  }

  // 反审核 - 撤销对账单审核状态
  async unaudit(id: string, operator: string, reason?: string) {
    const [existing] = await this.db
      .select()
      .from(reconciliationTable)
      .where(eq(reconciliationTable.id, id));

    if (!existing) {
      throw new NotFoundException('对账单不存在');
    }

    // 校验状态流转：只有audited状态可以反审核到confirmed（P2修改）
    this.validateStatusTransition(existing.status as ReconciliationStatus, 'confirmed');

    // 只有audited状态可以反审核
    if (existing.status !== 'audited') {
      throw new BadRequestException(`当前状态[${existing.status}]不允许反审核，仅audited状态可反审核`);
    }

    if (existing.invoiceAmountCents > 0) {
      throw new BadRequestException('已有开票记录，无法反审核');
    }

    // 查询当前明细并保存到版本表（用于历史追溯）
    const currentDetails = await this.db
      .select()
      .from(reconciliationDetail)
      .where(eq(reconciliationDetail.reconciliationId, id));

    // 查询关联的出库单信息，用于快照记录
    const outboundOrders = await this.db
      .select({
        id: outboundOrderTable.id,
        outboundNo: outboundOrderTable.outboundNo,
        totalAmount: outboundOrderTable.totalAmount,
        totalQuantity: outboundOrderTable.totalQuantity,
        status: outboundOrderTable.status,
      })
      .from(outboundOrderTable)
      .where(eq(outboundOrderTable.reconciliationId, id));

    // 构建出库单快照
    const outboundSnapshot = {
      snapshotAt: new Date().toISOString(),
      outboundOrders: outboundOrders.map(o => ({
        id: o.id,
        outboundNo: o.outboundNo,
        totalAmount: o.totalAmount,
        totalQuantity: o.totalQuantity,
        status: o.status,
      })),
    };

    if (currentDetails.length > 0) {
      // 软删除：将当前明细标记为失效，并记录原因
      await this.db
        .update(reconciliationDetail)
        .set({
          isActive: false,
          updateReason: reason || '反审核操作',
          updatedBy: operator,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(reconciliationDetail.reconciliationId, id),
            eq(reconciliationDetail.isActive, true)
          )
        );
    }

    // 解除出库单锁定并恢复状态为待对账
    await this.db
      .update(outboundOrderTable)
      .set({
        reconciliationId: null,
        lockStatus: 'unlocked',
        lockedAt: null,
        status: 'pending_reconciliation',
      })
      .where(eq(outboundOrderTable.reconciliationId, id));

    // 更新对账单状态为confirmed（P2修改：反审核后回到已确认状态，可重新审核）
    const [updated] = await this.db
      .update(reconciliationTable)
      .set({
        status: 'confirmed',
        isLocked: false,
        auditor: null,
        auditedAt: null,
        version: (existing.version || 1) + 1,
        outboundSnapshot: outboundSnapshot,
      })
      .where(eq(reconciliationTable.id, id))
      .returning();

    // 记录操作日志
    await this.db.insert(operationLogTable).values({
      entityType: 'reconciliation',
      entityId: id,
      operation: 'unaudit',
      operator,
      beforeState: JSON.stringify({
        status: 'audited',
        version: existing.version,
        detailsCount: currentDetails.length,
      }),
      afterState: JSON.stringify({
        status: 'voided',
        version: (existing.version || 1) + 1,
        reason: reason || '反审核操作',
        outboundSnapshot,
      }),
      source: 'web',
    });

    this.logger.log(`对账单反审核: ${existing.reconciliationNo}, 操作人: ${operator}, 原因: ${reason}`);
    return this.findById(updated.id);
  }

  // 获取对账单历史版本
  async getHistory(id: string) {
    const reconciliation = await this.findById(id);
    if (!reconciliation) {
      throw new NotFoundException('对账单不存在');
    }

    // 查询所有版本的明细（包括失效的）
    const allDetails = await this.db
      .select()
      .from(reconciliationDetail)
      .where(eq(reconciliationDetail.reconciliationId, id))
      .orderBy(reconciliationDetail.version, reconciliationDetail.createdAt);

    // 按版本分组
    const versionMap = new Map<number, typeof allDetails>();
    for (const detail of allDetails) {
      const version = detail.version;
      if (!versionMap.has(version)) {
        versionMap.set(version, []);
      }
      versionMap.get(version)!.push(detail);
    }

    // 查询操作日志获取版本变更历史
    const logs = await this.db
      .select()
      .from(operationLogTable)
      .where(
        and(
          eq(operationLogTable.entityType, 'reconciliation'),
          eq(operationLogTable.entityId, id),
          eq(operationLogTable.operation, 'unaudit')
        )
      )
      .orderBy(operationLogTable.createdAt);

    // 构建版本历史
    const versions: Array<{
      version: number;
      isActive: boolean;
      details: typeof allDetails;
      updateReason?: string;
      updatedBy?: string;
      updatedAt?: Date;
    }> = [];

    for (const [version, details] of versionMap) {
      const activeDetail = details.find(d => d.isActive);
      const firstDetail = details[0];
      versions.push({
        version,
        isActive: !!activeDetail,
        details,
        updateReason: firstDetail?.updateReason || undefined,
        updatedBy: firstDetail?.updatedBy || undefined,
        updatedAt: firstDetail?.updatedAt || undefined,
      });
    }

    return {
      reconciliation,
      versions: versions.sort((a, b) => b.version - a.version),
      operationLogs: logs,
    };
  }

  // 获取当前最大版本号
  private async getMaxVersion(reconciliationId: string): Promise<number> {
    const result = await this.db
      .select({ maxVersion: sql<number>`MAX(${reconciliationDetail.version})` })
      .from(reconciliationDetail)
      .where(eq(reconciliationDetail.reconciliationId, reconciliationId));

    return result[0]?.maxVersion || 0;
  }

  /**
   * 删除对账单 - 带校验
   * 修复：只有draft、confirmed和voided状态可以删除
   */
  async delete(id: string) {
    const [existing] = await this.db
      .select()
      .from(reconciliationTable)
      .where(eq(reconciliationTable.id, id));

    if (!existing) {
      throw new NotFoundException('对账单不存在');
    }

    // 只有draft、confirmed和voided状态可以删除
    if (!['draft', 'confirmed', 'voided'].includes(existing.status)) {
      throw new BadRequestException(`当前状态[${existing.status}]不允许删除，仅草稿、已确认和已作废状态可删除`);
    }

    // 检查是否有开票或回款记录
    if (existing.invoiceAmountCents > 0) {
      throw new BadRequestException('对账单已有开票记录，无法删除');
    }

    if (existing.receiptAmountCents > 0) {
      throw new BadRequestException('对账单已有回款记录，无法删除');
    }

    // 解除出库单锁定并恢复状态为待对账
    await this.db
      .update(outboundOrderTable)
      .set({
        reconciliationId: null,
        lockStatus: 'unlocked',
        lockedAt: null,
        status: 'pending_reconciliation',
      })
      .where(eq(outboundOrderTable.reconciliationId, id));

    // 删除对账明细
    await this.db
      .delete(reconciliationDetail)
      .where(eq(reconciliationDetail.reconciliationId, id));

    // 删除对账单
    await this.db
      .delete(reconciliationTable)
      .where(eq(reconciliationTable.id, id));

    this.logger.log(`对账单已删除: ${existing.reconciliationNo}`);
    return { success: true };
  }

  // 获取客户欠款统计
  async getCustomerDebtSummary(customerId: string) {
    // 修复：只统计audited及以上状态且未完全回款的账单
    const reconciliations = await this.db
      .select({
        finalAmountCents: reconciliationTable.finalAmountCents,
        invoiceAmountCents: reconciliationTable.invoiceAmountCents,
        receiptAmountCents: reconciliationTable.receiptAmountCents,
        status: reconciliationTable.status,
      })
      .from(reconciliationTable)
      .where(and(
        eq(reconciliationTable.customerId, customerId),
        eq(reconciliationTable.status, 'audited'),
      ));

    const summary = reconciliations.reduce((acc, r) => {
      acc.totalAmount += r.finalAmountCents;
      acc.invoicedAmount += r.invoiceAmountCents;
      acc.receivedAmount += r.receiptAmountCents;
      return acc;
    }, { totalAmount: 0, invoicedAmount: 0, receivedAmount: 0 });

    return {
      totalDebt: centsToYuan(summary.totalAmount),
      invoicedDebt: centsToYuan(summary.invoicedAmount),
      unInvoicedDebt: centsToYuan(summary.totalAmount - summary.invoicedAmount),
      receivedAmount: centsToYuan(summary.receivedAmount),
      unReceivedAmount: centsToYuan(summary.totalAmount - summary.receivedAmount),
    };
  }
}

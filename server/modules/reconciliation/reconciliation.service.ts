import { Injectable, Inject, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { FeishuOutboxService } from '../feishu/feishu-outbox.service';
import { eq, and, desc, sql, inArray, ne, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { TENANT_DATABASE } from '../../common/tenant-database.provider';
import {
  reconciliation as reconciliationTable,
  reconciliationDetail,
  reconciliationDetailVersion,
  outboundOrder as outboundOrderTable,
  outboundDetail as outboundDetailTable,
  product as productTable,
  approvalRequest as approvalRequestTable,
  operationLog as operationLogTable,
  customer as customerTable,
} from '../../database/schema';
import { centsToYuan, yuanToCents } from '../../common/utils/currency';

// 对账单状态类型
export type ReconciliationStatus = 'draft' | 'confirmed' | 'audited' | 'invoiced' | 'partial_paid' | 'paid' | 'cancelled' | 'voided';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    @Inject(TENANT_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly feishuOutbox: FeishuOutboxService,
  ) {}

  // 状态流转规则定义
  private readonly statusTransitions: Record<ReconciliationStatus, ReconciliationStatus[]> = {
    draft: ['confirmed', 'cancelled'],
    confirmed: ['audited', 'draft'],
    audited: ['invoiced', 'draft', 'cancelled'],
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

  private paymentStatus(record: {
    status?: string | null;
    finalAmountCents?: number | null;
    receiptAmountCents?: number | null;
  }): string {
    if (record.status === 'cancelled' || record.status === 'voided') return '已取消';
    const finalAmount = Number(record.finalAmountCents || 0);
    const received = Number(record.receiptAmountCents || 0);
    if (finalAmount <= 0 || received >= finalAmount || record.status === 'paid') return '已结清';
    if (received > 0 || record.status === 'partial_paid') return '部分回款';
    return '未回款';
  }

  private async enqueueFeishu(db: any, record: any): Promise<void> {
    await this.feishuOutbox.enqueue(db, 'reconciliation', record.id, {
      reconciliationNo: record.reconciliationNo,
      date: record.month,
      customerName: record.customerName,
      outboundAmount: Number(record.totalAmount || 0),
      invoicedAmount: Number(record.invoiceAmount || 0),
      receivedAmount: Number(record.receiptAmount || 0),
      paymentStatus: this.paymentStatus(record),
    });
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
    const countQuery = conditions.length > 0
      ? this.db.select({ count: sql<number>`count(*)::int` }).from(reconciliationTable).where(and(...conditions))
      : this.db.select({ count: sql<number>`count(*)::int` }).from(reconciliationTable);
    const [items, [count]] = await Promise.all([
      query.orderBy(desc(reconciliationTable.createdAt)).limit(pageSize).offset(offset),
      countQuery,
    ]);
    const total = Number(count?.count || 0);
    return { items, total, page, pageSize, hasMore: offset + items.length < total };
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

  /** 返回服务端权威的操作前置条件，避免前端缓存状态过期后误导用户。 */
  async checkAction(id: string, action: 'delete' | 'unaudit') {
    const [record] = await this.db.select().from(reconciliationTable)
      .where(eq(reconciliationTable.id, id)).limit(1);
    if (!record) throw new NotFoundException('对账单不存在');
    const invoiceCount = Array.isArray(record.invoiceRecords) ? record.invoiceRecords.length : (record.invoiceAmountCents > 0 ? 1 : 0);
    const receiptCount = Array.isArray(record.receiptRecords) ? record.receiptRecords.length : (record.receiptAmountCents > 0 ? 1 : 0);
    if (action === 'delete') {
      if (!['draft', 'confirmed', 'voided'].includes(record.status)) {
        return { allowed: false, reason: `当前状态[${record.status}]不允许删除，仅草稿、已确认和已作废状态可删除`, invoiceCount, receiptCount };
      }
    } else if (action === 'unaudit') {
      if (record.status !== 'audited') {
        return { allowed: false, reason: `当前状态[${record.status}]不允许反审核，仅已审核状态可反审核`, invoiceCount, receiptCount };
      }
    } else {
      throw new BadRequestException('不支持的操作类型');
    }
    if (record.invoiceAmountCents > 0 || record.receiptAmountCents > 0) {
      return { allowed: false, reason: '已有开票或回款记录，不能执行该操作', invoiceCount, receiptCount };
    }
    return { allowed: true, invoiceCount, receiptCount };
  }

  async getCalculation(id: string) {
    const [record] = await this.db.select().from(reconciliationTable)
      .where(eq(reconciliationTable.id, id)).limit(1);
    if (!record) throw new NotFoundException('对账单不存在');
    return {
      baseAmount: centsToYuan(record.totalAmountCents),
      deductionAmount: centsToYuan(record.deductionAmountCents),
      otherAmount: centsToYuan(record.otherAmountCents),
      compensationAmount: centsToYuan(record.compensationAmountCents),
      finalAmount: centsToYuan(record.finalAmountCents),
      invoiceAmount: centsToYuan(record.invoiceAmountCents),
      uninvoiceAmount: centsToYuan(Math.max(0, record.finalAmountCents - record.invoiceAmountCents)),
      receiptAmount: centsToYuan(record.receiptAmountCents),
      unreceivedAmount: centsToYuan(Math.max(0, record.finalAmountCents - record.receiptAmountCents)),
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
    const customerId = data.customerId;
    const month = data.month;
    const outboundOrderIds = [...new Set(data.outboundOrderIds || [])];
    const deductionAmount = Number(data.deductionAmount || 0);
    const otherAmount = Number(data.otherAmount || 0);
    const compensationAmount = Number(data.compensationAmount || 0);

    // 检查出库单
    if (outboundOrderIds.length === 0) {
      throw new BadRequestException('请至少选择一个出库单');
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new BadRequestException('对账月份格式必须为 YYYY-MM');
    }
    if ([deductionAmount, otherAmount, compensationAmount].some(value => !Number.isFinite(value) || value < 0)) {
      throw new BadRequestException('扣减、其他及补偿金额必须为非负数');
    }
    const [customerRecord] = await this.db.select({
      id: customerTable.id,
      name: customerTable.name,
      code: customerTable.code,
      deletedAt: customerTable.deletedAt,
    }).from(customerTable).where(eq(customerTable.id, customerId));
    if (!customerRecord || customerRecord.deletedAt) throw new BadRequestException('客户不存在或已停用');

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
    if (outboundOrders.some(order => order.customerId !== customerId)) {
      throw new BadRequestException('所选出库单必须属于同一客户');
    }
    if (outboundOrders.some(order => order.outboundDate.toISOString().slice(0, 7) !== month)) {
      throw new BadRequestException('所选出库单必须属于指定对账月份');
    }

    // 计算总金额
    let totalAmount = 0;
    for (const order of outboundOrders) {
      totalAmount += order.totalAmount;
    }

    const finalAmount = totalAmount - deductionAmount + otherAmount + compensationAmount;
    if (finalAmount < 0) throw new BadRequestException('最终对账金额不能为负数');

    // 生成对账单号：RZ + 年月日 + 4位序号
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const reconciliationNo = `RZ${dateStr}${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;

    const reconciliation = await this.db.transaction(async (tx) => {
      const [created] = await tx.insert(reconciliationTable).values({
        reconciliationNo,
        customerId,
        customerName: customerRecord.name,
        customerCode: customerRecord.code,
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
      }).returning();

      for (const order of outboundOrders) {
        const details = await tx.select().from(outboundDetailTable)
          .where(eq(outboundDetailTable.outboundId, order.id));
        if (details.length === 0) throw new BadRequestException(`出库单 ${order.outboundNo} 没有明细`);
        for (const detail of details) {
          await tx.insert(reconciliationDetail).values({
          reconciliationId: created.id,
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
        const [locked] = await tx.update(outboundOrderTable).set({
          reconciliationId: created.id,
          lockStatus: 'locked',
          lockedAt: new Date(),
          status: 'reconciled',
        }).where(and(
          eq(outboundOrderTable.id, order.id),
          eq(outboundOrderTable.status, 'pending_reconciliation'),
          eq(outboundOrderTable.lockStatus, 'unlocked'),
          isNull(outboundOrderTable.reconciliationId),
        )).returning({ id: outboundOrderTable.id });
        if (!locked) throw new BadRequestException(`出库单 ${order.outboundNo} 已被其他对账单占用`);
      }
      await this.enqueueFeishu(tx, created);
      return created;
    });

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
    for (const [label, value] of [
      ['扣减金额', data.deductionAmount],
      ['其他金额', data.otherAmount],
      ['补偿金额', data.compensationAmount],
    ] as const) {
      if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
        throw new BadRequestException(`${label}必须为非负数`);
      }
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
    const finalAmount = totalAmount - deductionAmount + otherAmount + compensationAmount;
    if (finalAmount < 0) throw new BadRequestException('最终对账金额不能为负数');

    updateData.finalAmount = finalAmount;
    updateData.finalAmountCents = yuanToCents(finalAmount);
    updateData.uninvoiceAmount = Math.max(0, finalAmount - existing.invoiceAmount);
    updateData.unreceivedAmount = Math.max(0, finalAmount - existing.receiptAmount);
    updateData.version = existing.version + 1;

    const updated = await this.db.transaction(async (tx) => {
      const [record] = await tx
        .update(reconciliationTable)
        .set(updateData)
        .where(and(
          eq(reconciliationTable.id, id),
          eq(reconciliationTable.version, existing.version),
        ))
        .returning();
      if (!record) throw new BadRequestException('对账单已被其他操作修改，请刷新后重试');
      await this.enqueueFeishu(tx, record);
      return record;
    });

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

    const updated = await this.db.transaction(async (tx) => {
      // 对账单行锁保证“重建明细→重算金额→重新锁单→审核”不能被并发确认/删除打断。
      const [current] = await tx.select().from(reconciliationTable)
        .where(eq(reconciliationTable.id, id)).for('update');
      if (!current) throw new NotFoundException('对账单不存在');
      if (current.status !== 'confirmed') throw new BadRequestException('对账单状态已变化，请刷新后重试');

      const [{ maxVersion }] = await tx
        .select({ maxVersion: sql<number>`COALESCE(MAX(${reconciliationDetail.version}), 0)::int` })
        .from(reconciliationDetail)
        .where(eq(reconciliationDetail.reconciliationId, id));
      const newVersion = Number(maxVersion || 0) + 1;
      const [inactiveDetail] = await tx.select({ id: reconciliationDetail.id })
        .from(reconciliationDetail)
        .where(and(
          eq(reconciliationDetail.reconciliationId, id),
          eq(reconciliationDetail.isActive, false),
        )).limit(1);

      let amountUpdates: Record<string, unknown> = {};
      if (inactiveDetail) {
        const outboundOrders = await tx.select().from(outboundOrderTable).where(and(
          eq(outboundOrderTable.reconciliationId, id),
          eq(outboundOrderTable.status, 'pending_reconciliation'),
        ));
        if (outboundOrders.length === 0) throw new BadRequestException('该对账单没有可重新审核的出库单');

        for (const order of outboundOrders) {
          const details = await tx.select().from(outboundDetailTable)
            .where(eq(outboundDetailTable.outboundId, order.id));
          if (details.length === 0) throw new BadRequestException(`出库单 ${order.outboundNo} 没有明细`);
          await tx.insert(reconciliationDetail).values(details.map(detail => ({
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
          })));
        }

        const newTotalAmountCents = outboundOrders.reduce(
          (sum, order) => sum + yuanToCents(Number(order.totalAmount || 0)),
          0,
        );
        const finalAmountCents = newTotalAmountCents
          - Number(current.deductionAmountCents || 0)
          + Number(current.otherAmountCents || 0)
          + Number(current.compensationAmountCents || 0);
        if (finalAmountCents < 0) throw new BadRequestException('最终对账金额不能为负数');
        amountUpdates = {
          totalAmount: centsToYuan(newTotalAmountCents),
          totalAmountCents: newTotalAmountCents,
          finalAmount: centsToYuan(finalAmountCents),
          finalAmountCents,
          uninvoiceAmount: centsToYuan(Math.max(0, finalAmountCents - Number(current.invoiceAmountCents || 0))),
          unreceivedAmount: centsToYuan(Math.max(0, finalAmountCents - Number(current.receiptAmountCents || 0))),
          version: newVersion,
        };

        const relocked = await tx.update(outboundOrderTable).set({
          status: 'reconciled',
          lockStatus: 'locked',
          lockedAt: new Date(),
        }).where(and(
          eq(outboundOrderTable.reconciliationId, id),
          eq(outboundOrderTable.status, 'pending_reconciliation'),
          eq(outboundOrderTable.lockStatus, 'unlocked'),
        )).returning({ id: outboundOrderTable.id });
        if (relocked.length !== outboundOrders.length) throw new BadRequestException('部分出库单状态已变化，请刷新后重试');
      }

      const [record] = await tx
        .update(reconciliationTable)
        .set({
          ...amountUpdates,
          status: 'audited',
          isLocked: true,
          auditor,
          auditedAt: new Date(),
        })
        .where(and(
          eq(reconciliationTable.id, id),
          eq(reconciliationTable.status, 'confirmed'),
        ))
        .returning();
      if (!record) throw new BadRequestException('对账单状态已变化，请刷新后重试');
      await this.enqueueFeishu(tx, record);
      return record;
    });

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
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('开票金额必须大于0');
    if (!['audited', 'invoiced', 'partial_paid', 'paid'].includes(existing.status)) {
      throw new BadRequestException('对账单审核后才可登记开票');
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

    const updated = await this.db.transaction(async (tx) => {
      const [record] = await tx
        .update(reconciliationTable)
        .set({
          invoiceAmountCents: newInvoiceAmountCents,
          invoiceAmount: centsToYuan(newInvoiceAmountCents),
          uninvoiceAmount: centsToYuan(existing.finalAmountCents - newInvoiceAmountCents),
          invoiceRecords,
          status: existing.status === 'audited' && newInvoiceAmountCents >= existing.finalAmountCents
            ? 'invoiced'
            : existing.status,
        })
        .where(and(
          eq(reconciliationTable.id, id),
          eq(reconciliationTable.invoiceAmountCents, existing.invoiceAmountCents),
        ))
        .returning();
      if (!record) throw new BadRequestException('开票金额已被其他操作更新，请刷新后重试');
      await this.enqueueFeishu(tx, record);
      return record;
    });

    this.logger.log(`对账单开票: ${existing.reconciliationNo}, 金额: ${amount}`);
    return this.findById(updated.id);
  }

  // 添加回款记录
  async addReceipt(id: string, amount: number) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('对账单不存在');
    }

    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('回款金额必须大于0');
    if (!['invoiced', 'partial_paid'].includes(existing.status)) {
      throw new BadRequestException('对账单完成开票后才可登记回款');
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

    const updated = await this.db.transaction(async (tx) => {
      const [record] = await tx
        .update(reconciliationTable)
        .set({
          receiptAmountCents: newReceiptAmountCents,
          receiptAmount: centsToYuan(newReceiptAmountCents),
          unreceivedAmount: centsToYuan(existing.finalAmountCents - newReceiptAmountCents),
          receiptRecords,
          status: isFullyPaid ? 'paid' : isPartialPaid ? 'partial_paid' : existing.status,
        })
        .where(and(
          eq(reconciliationTable.id, id),
          eq(reconciliationTable.receiptAmountCents, existing.receiptAmountCents),
        ))
        .returning();
      if (!record) throw new BadRequestException('回款金额已被其他操作更新，请刷新后重试');
      await this.enqueueFeishu(tx, record);
      return record;
    });

    this.logger.log(`对账单回款: ${existing.reconciliationNo}, 金额: ${amount}`);
    return this.findById(updated.id);
  }

  // 申请取消对账单
  async requestCancel(id: string, requester: string, reason: string) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('对账单不存在');
    }

    if (existing.status === 'cancelled' || existing.status === 'voided') {
      throw new BadRequestException('对账单已取消或作废');
    }
    if (existing.invoiceAmountCents > 0 || existing.receiptAmountCents > 0) {
      throw new BadRequestException('已有开票或回款记录，须先完成财务冲销后才能取消');
    }
    if (['draft', 'confirmed'].includes(existing.status)) {
      await this.executeCancel(id);
      return { success: true, message: '对账单已直接取消' };
    }
    if (existing.status !== 'audited') {
      throw new BadRequestException(`当前状态[${existing.status}]不允许取消`);
    }
    if (!reason?.trim()) throw new BadRequestException('请输入取消原因');
    const [pendingRequest] = await this.db.select({ id: approvalRequestTable.id })
      .from(approvalRequestTable)
      .where(and(
        eq(approvalRequestTable.entityType, 'reconciliation'),
        eq(approvalRequestTable.entityId, id),
        eq(approvalRequestTable.status, 'pending'),
      ))
      .limit(1);
    if (pendingRequest) throw new BadRequestException('该对账单已有待处理的取消申请');

    // 创建审批申请
    const [request] = await this.db
      .insert(approvalRequestTable)
      .values({
        type: 'reconciliation_cancel',
        entityType: 'reconciliation',
        entityId: id,
        requester,
        reason: reason.trim(),
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
      const [handled] = await this.db
        .update(approvalRequestTable)
        .set({
          status: 'approved',
          approver,
          approvedAt: new Date(),
        })
        .where(and(
          eq(approvalRequestTable.id, requestId),
          eq(approvalRequestTable.status, 'pending'),
        ))
        .returning({ id: approvalRequestTable.id });
      if (!handled) throw new BadRequestException('审批申请已被其他人员处理');

      this.logger.log(`对账单取消申请已批准: ${request.entityId}`);
    } else {
      // 拒绝审批
      const [handled] = await this.db
        .update(approvalRequestTable)
        .set({
          status: 'rejected',
          approver,
          rejectedAt: new Date(),
          rejectReason: rejectReason || '审批拒绝',
        })
        .where(and(
          eq(approvalRequestTable.id, requestId),
          eq(approvalRequestTable.status, 'pending'),
        ))
        .returning({ id: approvalRequestTable.id });
      if (!handled) throw new BadRequestException('审批申请已被其他人员处理');

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
    // 审批状态落库前进程异常时，重试批准操作应能安全收尾。
    if (existing.status === 'cancelled') return;
    if (!['draft', 'confirmed', 'audited'].includes(existing.status)) {
      throw new BadRequestException(`当前状态[${existing.status}]不允许取消`);
    }
    if (existing.invoiceAmountCents > 0 || existing.receiptAmountCents > 0) {
      throw new BadRequestException('已有开票或回款记录，须先完成财务冲销后才能取消');
    }

    await this.db.transaction(async (tx) => {
      // 解除出库单锁定并恢复状态为待对账
      await tx
        .update(outboundOrderTable)
        .set({
          reconciliationId: null,
          lockStatus: 'unlocked',
          lockedAt: null,
          status: 'pending_reconciliation',
        })
        .where(eq(outboundOrderTable.reconciliationId, id));

      await tx.delete(reconciliationDetail)
        .where(eq(reconciliationDetail.reconciliationId, id));

      const [cancelled] = await tx
        .update(reconciliationTable)
        .set({ status: 'cancelled', isLocked: false })
        .where(and(
          eq(reconciliationTable.id, id),
          eq(reconciliationTable.status, existing.status),
          eq(reconciliationTable.invoiceAmountCents, 0),
          eq(reconciliationTable.receiptAmountCents, 0),
        ))
        .returning();
      if (!cancelled) throw new BadRequestException('对账单状态已变化，请刷新后重试');
      await this.enqueueFeishu(tx, cancelled);
    });

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

    // 规格要求：反审核后回到草稿，允许修订后再次确认、审核。
    this.validateStatusTransition(existing.status as ReconciliationStatus, 'draft');

    // 只有audited状态可以反审核
    if (existing.status !== 'audited') {
      throw new BadRequestException(`当前状态[${existing.status}]不允许反审核，仅audited状态可反审核`);
    }

    if (existing.invoiceAmountCents > 0) {
      throw new BadRequestException('已有开票记录，无法反审核');
    }

    const updated = await this.db.transaction(async (tx) => {
      const currentDetails = await tx.select().from(reconciliationDetail)
        .where(eq(reconciliationDetail.reconciliationId, id));
      const outboundOrders = await tx
        .select({
          id: outboundOrderTable.id,
          outboundNo: outboundOrderTable.outboundNo,
          totalAmount: outboundOrderTable.totalAmount,
          totalQuantity: outboundOrderTable.totalQuantity,
          status: outboundOrderTable.status,
        })
        .from(outboundOrderTable)
        .where(eq(outboundOrderTable.reconciliationId, id));
      const outboundSnapshot = {
        snapshotAt: new Date().toISOString(),
        outboundOrders: outboundOrders.map(order => ({
          id: order.id,
          outboundNo: order.outboundNo,
          totalAmount: order.totalAmount,
          totalQuantity: order.totalQuantity,
          status: order.status,
        })),
      };

      if (currentDetails.length > 0) {
        await tx.update(reconciliationDetail).set({
          isActive: false,
          updateReason: reason || '反审核操作',
          updatedBy: operator,
          updatedAt: new Date(),
        }).where(and(
          eq(reconciliationDetail.reconciliationId, id),
          eq(reconciliationDetail.isActive, true),
        ));
      }

      await tx.update(outboundOrderTable).set({
        lockStatus: 'unlocked',
        lockedAt: null,
        status: 'pending_reconciliation',
      }).where(eq(outboundOrderTable.reconciliationId, id));

      const [record] = await tx.update(reconciliationTable).set({
        status: 'draft',
        isLocked: false,
        auditor: null,
        auditedAt: null,
        version: (existing.version || 1) + 1,
        outboundSnapshot,
      }).where(and(
        eq(reconciliationTable.id, id),
        eq(reconciliationTable.status, 'audited'),
        eq(reconciliationTable.invoiceAmountCents, 0),
      )).returning();
      if (!record) throw new BadRequestException('对账单状态已变化，请刷新后重试');

      await tx.insert(operationLogTable).values({
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
          status: 'draft',
          version: (existing.version || 1) + 1,
          reason: reason || '反审核操作',
          outboundSnapshot,
        }),
        source: 'web',
      });
      await this.enqueueFeishu(tx, record);
      return record;
    });

    this.logger.log(`对账单反审核: ${existing.reconciliationNo}, 操作人: ${operator}, 原因: ${reason}`);
    return this.findById(updated.id);
  }

  async confirm(id: string) {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundException('对账单不存在');
    this.validateStatusTransition(existing.status as ReconciliationStatus, 'confirmed');
    await this.db.transaction(async (tx) => {
      const [updated] = await tx.update(reconciliationTable).set({
        status: 'confirmed',
      }).where(and(
        eq(reconciliationTable.id, id),
        eq(reconciliationTable.status, 'draft'),
      )).returning();
      if (!updated) throw new BadRequestException('对账单状态已变化，请刷新后重试');
      await this.enqueueFeishu(tx, updated);
    });
    return this.findById(id);
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

    await this.db.transaction(async (tx) => {
      await tx.update(outboundOrderTable).set({
        reconciliationId: null,
        lockStatus: 'unlocked',
        lockedAt: null,
        status: 'pending_reconciliation',
      }).where(eq(outboundOrderTable.reconciliationId, id));
      await tx.delete(reconciliationDetail)
        .where(eq(reconciliationDetail.reconciliationId, id));
      const [deleted] = await tx.delete(reconciliationTable).where(and(
        eq(reconciliationTable.id, id),
        eq(reconciliationTable.status, existing.status),
        eq(reconciliationTable.invoiceAmountCents, 0),
        eq(reconciliationTable.receiptAmountCents, 0),
      )).returning({ id: reconciliationTable.id });
      if (!deleted) throw new BadRequestException('对账单状态已变化，请刷新后重试');
      await this.feishuOutbox.enqueue(tx, 'reconciliation', existing.id, {
        reconciliationNo: existing.reconciliationNo,
        date: existing.month,
        customerName: existing.customerName,
        outboundAmount: 0,
        invoicedAmount: 0,
        receivedAmount: 0,
        paymentStatus: '已删除',
        deleted: true,
      });
    });

    this.logger.log(`对账单已删除: ${existing.reconciliationNo}`);
    return { success: true };
  }

  // 获取客户欠款统计
  async getCustomerDebtSummary(customerId: string) {
    // 统计审核后的全部有效状态；已结清单会自然贡献 0 未收金额。
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
        inArray(reconciliationTable.status, ['audited', 'invoiced', 'partial_paid', 'paid']),
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

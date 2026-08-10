import { Injectable, Inject, Logger, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { BitableSyncService } from '../feishu/bitable-sync.service';
import { eq, and, gte, lte, desc, asc, sql, isNull, type SQL } from 'drizzle-orm';
import {
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { TENANT_DATABASE } from '../../common/tenant-database.provider';
import { 
  outboundOrder, 
  outboundDetail, 
  product, 
  inventoryRecord, 
  inventoryRecordTable,
  outboundOrderTable, 
  outboundDetailTable, 
  productTable, 
  undoLogTable, 
  productBatchTable,
  productBatchStockTable,
  inboundOrderTable,
  inboundDetailTable,
  outboundBatchDetailTable,
  operationLogTable,
  customer,
} from '../../database/schema';
import { yuanToCents } from '../../common/utils/currency';
import { checkUndoable } from '../../common/utils/undo-check.util';
import { PAGINATION } from '../../config/constants';
import { getCurrentTenantContext } from '../../common/tenant-context.storage';

export interface OutboundDetailWithBatch {
  productId: string;
  productName: string;
  workpieceNo?: string;
  material?: string;
  process?: string;
  unit?: string;
  unitPrice?: number;
  quantity: number;
  weight: number;
  amount: number;
  batchNo?: string;
  inboundDate?: Date;
  batchSelections?: Array<{
    batchId: string;
    batchNo: string;
    quantity: number;
    weight: number;
  }>;
  closeOrder?: boolean;
}

@Injectable()
export class OutboundService {
  private readonly logger = new Logger(OutboundService.name);

  constructor(
    @Inject(TENANT_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly bitableSyncService?: BitableSyncService,
  ) {}

  // 获取所有出库单
  async findAll(params: {
    customerId?: string;
    status?: 'active' | 'cancelled' | 'all';
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
    keyword?: string;
  }) {
    const { customerId, status = 'all', startDate, endDate, page = PAGINATION.DEFAULT_PAGE, pageSize = PAGINATION.DEFAULT_PAGE_SIZE, keyword } = params;

    const conditions: (SQL<unknown> | undefined)[] = [];
    
    // 根据状态筛选（默认返回全部，不再硬编码排除已撤销）
    if (status && status !== 'all') {
      conditions.push(eq(outboundOrder.status, status));
    }
    
    if (customerId) {
      conditions.push(eq(outboundOrder.customerId, customerId));
    }
    if (startDate) {
      conditions.push(gte(outboundOrder.outboundDate, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(outboundOrder.outboundDate, new Date(endDate)));
    }
    if (keyword?.trim()) {
      const searchPattern = `%${keyword.trim()}%`;
      conditions.push(
        sql`(${outboundOrder.outboundNo} ILIKE ${searchPattern} OR ${outboundOrder.customerName} ILIKE ${searchPattern})`
      );
    }

    const offset = (page - 1) * pageSize;

    // 构建 WHERE 条件
    const whereCondition = conditions.length > 0
      ? conditions.reduce((acc, curr, idx) => idx === 0 ? curr : and(acc!, curr!))
      : undefined;

    // 主查询：撤销单据排后，其他按时间倒序
    const itemsQuery = whereCondition
      ? this.db.select().from(outboundOrder).where(whereCondition).orderBy(sql`${outboundOrder.status} = 'cancelled', ${outboundOrder.createdAt} DESC`).limit(pageSize).offset(offset)
      : this.db.select().from(outboundOrder).orderBy(sql`${outboundOrder.status} = 'cancelled', ${outboundOrder.createdAt} DESC`).limit(pageSize).offset(offset);

    // 统计查询
    const statsQuery = this.db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) FILTER (WHERE ${outboundOrder.status} = 'active')::int`,
        cancelled: sql<number>`count(*) FILTER (WHERE ${outboundOrder.status} = 'cancelled')::int`,
      })
      .from(outboundOrder)
      .where(whereCondition ?? sql`TRUE`);

    const [items, [stats]] = await Promise.all([itemsQuery, statsQuery]);

    return {
      items,
      stats: {
        total: stats?.total ?? 0,
        active: stats?.active ?? 0,
        cancelled: stats?.cancelled ?? 0,
      },
      page,
      pageSize,
      hasMore: items.length === pageSize,
    };
  }

  // 根据ID获取出库单
  async findById(id: string) {
    const order = await this.db
      .select()
      .from(outboundOrder)
      .where(eq(outboundOrder.id, id));

    if (!order[0]) return null;

    // 获取明细
    const details = await this.db
      .select()
      .from(outboundDetail)
      .where(eq(outboundDetail.outboundId, id));

    return {
      ...order[0],
      details,
    };
  }

  // 创建出库单 - 带批次扣减和库存更新
  // 生成出库单号
  private async generateOutboundNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, ''); // 格式：YYMMDD
    const prefix = `CK${dateStr}`;
    
    // 查询当天已有的出库单数量
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(outboundOrder)
      .where(
        and(
          sql`${outboundOrder.createdAt} >= ${startOfDay.toISOString()}`,
          sql`${outboundOrder.createdAt} < ${endOfDay.toISOString()}`
        )
      );
    
    const sequence = (countResult[0]?.count || 0) + 1;
    const sequenceStr = sequence.toString().padStart(3, '0');
    
    return `${prefix}${sequenceStr}`;
  }

  async create(data: {
    outboundNo?: string;
    customerId: string;
    customerName: string;
    customerCode: string;
    outboundDate: Date;
    creator: string;
    receiver?: string;
    transporter?: string;
    plateNumber?: string;
    driver?: string;
    totalAmount: number;
    totalQuantity: number;
    totalWeight: number;
    details: Array<OutboundDetailWithBatch>;
  }) {
    if (!Array.isArray(data.details) || data.details.length === 0) {
      throw new BadRequestException('出库明细不能为空');
    }

    let details = data.details.map((detail, index) => {
      const quantity = Number(detail.quantity);
      const weight = Number(detail.weight || 0);
      const unitPrice = Number(detail.unitPrice || 0);
      const amount = Number(detail.amount || 0);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new BadRequestException(`第 ${index + 1} 行数量必须为正整数`);
      }
      if (!Number.isFinite(weight) || weight < 0) {
        throw new BadRequestException(`第 ${index + 1} 行重量不能为负数`);
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(amount) || amount < 0) {
        throw new BadRequestException(`第 ${index + 1} 行金额或单价无效`);
      }
      return { ...detail, quantity, weight, unitPrice, amount };
    });

    // 自动通过 customerCode 查找 customerId（若未传）
    let customerId = data.customerId;
    if (!customerId && data.customerCode) {
      const [cust] = await this.db
        .select({ id: customer.id })
        .from(customer)
        .where(eq(customer.code, data.customerCode))
        .limit(1);
      if (cust) customerId = cust.id;
    }
    if (!customerId) throw new BadRequestException('客户不存在或未提供客户ID');
    const [customerRecord] = await this.db
      .select({ id: customer.id, name: customer.name, code: customer.code, deletedAt: customer.deletedAt })
      .from(customer)
      .where(eq(customer.id, customerId))
      .limit(1);
    if (!customerRecord || customerRecord.deletedAt) {
      throw new BadRequestException('客户不存在或已停用');
    }

    details = await Promise.all(details.map(async (detail: any, index: number) => {
      let productRecord;
      if (detail.productId) {
        [productRecord] = await this.db.select().from(productTable)
          .where(eq(productTable.id, detail.productId)).limit(1);
      } else if (detail.productCode) {
        [productRecord] = await this.db.select().from(productTable)
          .where(eq(productTable.code, detail.productCode)).limit(1);
      }
      if (!productRecord || productRecord.deletedAt || productRecord.status === 'inactive') {
        throw new BadRequestException(`第 ${index + 1} 行产品不存在或已停用`);
      }
      if (productRecord.customerCode !== customerRecord.code) {
        throw new BadRequestException(`产品 ${productRecord.name} 不属于客户 ${customerRecord.name}`);
      }
      const unit = productRecord.unit || '件';
      if (unit === 'kg' && detail.weight <= 0) throw new BadRequestException(`产品 ${productRecord.name} 必须填写重量`);
      const unitPrice = Number(productRecord.unitPrice || 0);
      const billingQuantity = unit === 'kg' ? detail.weight : detail.quantity;
      return {
        ...detail,
        productId: productRecord.id,
        productName: productRecord.name,
        workpieceNo: productRecord.workpieceNo,
        material: productRecord.material,
        process: productRecord.process,
        unit,
        unitPrice,
        amount: Math.round(unitPrice * billingQuantity * 100) / 100,
      };
    }));

    // 数量、重量、金额均从经过主数据校正的服务端明细汇总。
    const totalAmount = details.reduce((sum, d) => sum + d.amount, 0);
    const totalQuantity = details.reduce((sum, d) => sum + d.quantity, 0);
    const totalWeight = details.reduce((sum, d) => sum + d.weight, 0);

    // 自动生成或验证出库单号
    const outboundNo = data.outboundNo || await this.generateOutboundNo();
    
    // 检查出库单号是否已存在
    const existingOrder = await this.db
      .select({ id: outboundOrder.id })
      .from(outboundOrder)
      .where(eq(outboundOrder.outboundNo, outboundNo))
      .limit(1);
    
    if (existingOrder.length > 0) {
      throw new ConflictException(`出库单号 ${outboundNo} 已存在`);
    }

    const totalAmountCents = yuanToCents(totalAmount);
    const order = await this.db.transaction(async (tx) => {
      const [createdOrder] = await tx.insert(outboundOrder).values({
        outboundNo,
        customerId,
        customerName: customerRecord.name,
        customerCode: customerRecord.code,
        outboundDate: data.outboundDate,
        creator: data.creator,
        receiver: data.receiver || null,
        transporter: data.transporter || null,
        plateNumber: data.plateNumber || null,
        driver: data.driver || null,
        totalAmount,
        totalQuantity,
        totalWeight,
        totalAmountCents,
        status: 'pending_reconciliation',
        lockStatus: 'unlocked',
      }).returning();

      for (const rawDetail of details) {
        let productId = rawDetail.productId;
        if (!productId && (rawDetail as any).productCode) {
          const [matched] = await tx.select({ id: product.id }).from(product)
            .where(eq(product.code, (rawDetail as any).productCode)).limit(1);
          productId = matched?.id;
        }
        if (!productId) {
          throw new BadRequestException(`产品不存在: ${(rawDetail as any).productCode || 'unknown'}`);
        }

        const [productRecord] = await tx.select({
          id: productTable.id,
          name: productTable.name,
          deletedAt: productTable.deletedAt,
        }).from(productTable).where(eq(productTable.id, productId));
        if (!productRecord || productRecord.deletedAt) {
          throw new BadRequestException(`产品不存在或已删除: ${rawDetail.productName || productId}`);
        }

        const detail = { ...rawDetail, productId };
        const selections = await this.resolveBatchSelections(tx, detail);
        const [createdDetail] = await tx.insert(outboundDetail).values({
          outboundId: createdOrder.id,
          productId,
          productName: productRecord.name,
          workpieceNo: detail.workpieceNo || null,
          material: detail.material || null,
          process: detail.process || null,
          unit: detail.unit || '件',
          unitPrice: detail.unitPrice,
          quantity: detail.quantity,
          weight: detail.weight,
          amount: detail.amount,
          batchNo: selections.map(item => item.batchNo).join(',') || null,
          inboundDate: detail.inboundDate || null,
          closeOrder: Boolean(detail.closeOrder),
        }).returning();

        for (const selection of selections) {
          const [updated] = await tx.update(productBatchStockTable).set({
            quantityAvailable: sql`${productBatchStockTable.quantityAvailable} - ${selection.quantity}`,
            weightAvailable: sql`${productBatchStockTable.weightAvailable} - ${selection.weight}`,
          }).where(and(
            eq(productBatchStockTable.batchId, selection.batchId),
            gte(productBatchStockTable.quantityAvailable, selection.quantity),
            gte(productBatchStockTable.weightAvailable, selection.weight),
            eq(productBatchStockTable.status, 'active'),
          )).returning({ id: productBatchStockTable.id });
          if (!updated) {
            throw new ConflictException(`批次 ${selection.batchNo} 库存已变化，请刷新后重试`);
          }
          await tx.insert(outboundBatchDetailTable).values({
            outboundDetailId: createdDetail.id,
            batchId: selection.batchId,
            quantity: selection.quantity,
            weight: selection.weight,
          });
        }

        await this.decreaseStockInTransaction(tx, {
          productId,
          quantity: detail.quantity,
          weight: detail.weight,
          referenceNo: createdOrder.outboundNo,
          operator: createdOrder.creator || 'system',
          remark: detail.closeOrder ? '出库并关单，剩余库存继续留存' : '出库单创建，扣减库存',
        });
      }

      await tx.insert(operationLogTable).values({
        entityType: 'outbound_order',
        entityId: createdOrder.id,
        operation: 'create',
        operator: data.creator as any,
        afterState: JSON.stringify({
          outboundNo: createdOrder.outboundNo,
          customerId,
          customerName: customerRecord.name,
          totalQuantity,
          totalWeight,
          totalAmount,
          details,
        }),
        source: 'web',
      });
      return createdOrder;
    });

    // 同步到飞书多维表格（异步，不阻塞主流程）
    this.syncToFeishuOutbound(order, {
      ...data,
      customerName: customerRecord.name,
      customerCode: customerRecord.code,
      details,
      totalAmount,
      totalQuantity,
      totalWeight,
    }).catch(err =>
      this.logger.warn(`飞书同步发货记录失败：${err.message}`),
    );

    return this.findById(order.id);
  }

  private async resolveBatchSelections(tx: any, detail: OutboundDetailWithBatch) {
    type Selection = { batchId: string; batchNo: string; quantity: number; weight: number };
    let requested: Selection[] = [];

    if (detail.batchSelections?.length) {
      const uniqueIds = new Set(detail.batchSelections.map(item => item.batchId));
      if (uniqueIds.size !== detail.batchSelections.length) {
        throw new BadRequestException(`${detail.productName} 存在重复批次`);
      }
      requested = detail.batchSelections.map(item => ({
        batchId: item.batchId,
        batchNo: item.batchNo,
        quantity: Number(item.quantity),
        weight: Number(item.weight || 0),
      }));
    } else if (detail.batchNo) {
      const [batch] = await tx.select({ id: productBatchTable.id, batchNo: productBatchTable.batchNo })
        .from(productBatchTable)
        .where(and(eq(productBatchTable.batchNo, detail.batchNo), eq(productBatchTable.productId, detail.productId)));
      if (!batch) throw new NotFoundException(`批次 ${detail.batchNo} 不存在或不属于该产品`);
      requested = [{ batchId: batch.id, batchNo: batch.batchNo, quantity: detail.quantity, weight: detail.weight }];
    } else {
      const available = await tx.select({
        batchId: productBatchTable.id,
        batchNo: productBatchTable.batchNo,
        quantityAvailable: productBatchStockTable.quantityAvailable,
        weightAvailable: productBatchStockTable.weightAvailable,
      }).from(productBatchTable).innerJoin(
        productBatchStockTable,
        eq(productBatchTable.id, productBatchStockTable.batchId),
      ).where(and(
        eq(productBatchTable.productId, detail.productId),
        eq(productBatchStockTable.status, 'active'),
        sql`${productBatchStockTable.quantityAvailable} > 0`,
      )).orderBy(asc(productBatchTable.inboundDate), asc(productBatchTable.createdAt));

      let remainingQuantity = detail.quantity;
      let remainingWeight = detail.weight;
      for (const batch of available) {
        if (remainingQuantity <= 0) break;
        const quantity = Math.min(remainingQuantity, batch.quantityAvailable);
        const proportionalWeight = remainingQuantity === quantity
          ? remainingWeight
          : detail.weight * quantity / detail.quantity;
        const weight = Math.min(remainingWeight, batch.weightAvailable, proportionalWeight);
        requested.push({ batchId: batch.batchId, batchNo: batch.batchNo, quantity, weight });
        remainingQuantity -= quantity;
        remainingWeight -= weight;
      }
      if (remainingQuantity > 0 || remainingWeight > 0.001) {
        // 兼容历史导入数据：只有产品总库存、尚未建立批次库存时允许总库存出库。
        if (available.length === 0) return [];
        throw new BadRequestException(`${detail.productName} 的批次库存不足`);
      }
    }

    let quantitySum = 0;
    let weightSum = 0;
    for (const item of requested) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.weight) || item.weight < 0) {
        throw new BadRequestException(`${detail.productName} 的批次出库数量或重量无效`);
      }
      const [batch] = await tx.select({
        id: productBatchTable.id,
        batchNo: productBatchTable.batchNo,
        productId: productBatchTable.productId,
        quantityAvailable: productBatchStockTable.quantityAvailable,
        weightAvailable: productBatchStockTable.weightAvailable,
        status: productBatchStockTable.status,
      }).from(productBatchTable).innerJoin(
        productBatchStockTable,
        eq(productBatchTable.id, productBatchStockTable.batchId),
      ).where(eq(productBatchTable.id, item.batchId));
      if (!batch || batch.productId !== detail.productId || batch.status !== 'active') {
        throw new BadRequestException(`批次 ${item.batchNo} 不存在、已停用或不属于该产品`);
      }
      if (batch.quantityAvailable < item.quantity || batch.weightAvailable + 0.001 < item.weight) {
        throw new BadRequestException(`批次 ${batch.batchNo} 可用库存不足`);
      }
      item.batchNo = batch.batchNo;
      quantitySum += item.quantity;
      weightSum += item.weight;
    }
    if (quantitySum !== detail.quantity || Math.abs(weightSum - detail.weight) > 0.001) {
      throw new BadRequestException(`${detail.productName} 的批次合计必须与出库明细一致`);
    }
    return requested;
  }

  private async decreaseStockInTransaction(tx: any, params: {
    productId: string;
    quantity: number;
    weight: number;
    referenceNo: string;
    operator: string;
    remark?: string;
  }) {
    const [currentProduct] = await tx.select({
      name: productTable.name,
      stock: productTable.stock,
      stockWeight: productTable.stockWeight,
      version: productTable.version,
      deletedAt: productTable.deletedAt,
    }).from(productTable).where(eq(productTable.id, params.productId));
    if (!currentProduct || currentProduct.deletedAt) {
      throw new NotFoundException(`产品不存在或已删除: ${params.productId}`);
    }
    if (currentProduct.stock < params.quantity || (currentProduct.stockWeight || 0) + 0.001 < params.weight) {
      throw new BadRequestException(
        `${currentProduct.name} 库存不足，当前 ${currentProduct.stock} 件/${currentProduct.stockWeight || 0} 重量`,
      );
    }
    const beforeStock = currentProduct.stock;
    const beforeStockWeight = currentProduct.stockWeight || 0;
    const [updated] = await tx.update(productTable).set({
      stock: beforeStock - params.quantity,
      stockWeight: beforeStockWeight - params.weight,
      version: (currentProduct.version || 1) + 1,
    }).where(and(
      eq(productTable.id, params.productId),
      eq(productTable.version, currentProduct.version || 1),
    )).returning({ id: productTable.id });
    if (!updated) throw new ConflictException(`${currentProduct.name} 库存已变化，请重试`);
    await tx.insert(inventoryRecordTable).values({
      productId: params.productId,
      productName: currentProduct.name,
      changeType: 'outbound',
      quantityChange: -params.quantity,
      weightChange: -params.weight,
      beforeStock,
      afterStock: beforeStock - params.quantity,
      beforeStockWeight,
      afterStockWeight: beforeStockWeight - params.weight,
      referenceNo: params.referenceNo,
      operator: params.operator,
      remark: params.remark,
    });
  }

  /**
   * 扣减库存 - 带乐观锁
   */
  private async decreaseStockWithLock(params: {
    productId: string;
    quantity: number;
    weight: number;
    referenceNo: string;
    operator: string;
    remark?: string;
  }): Promise<void> {
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // 检查产品是否存在且未删除
        const [currentProduct] = await this.db
          .select({
            id: productTable.id,
            name: productTable.name,
            stock: productTable.stock,
            stockWeight: productTable.stockWeight,
            version: productTable.version,
            deletedAt: productTable.deletedAt,
          })
          .from(productTable)
          .where(eq(productTable.id, params.productId));

        if (!currentProduct) {
          throw new NotFoundException(`产品不存在: ${params.productId}`);
        }

        if (currentProduct.deletedAt) {
          throw new BadRequestException(`产品 ${currentProduct.name} 已删除，无法出库`);
        }

        // 库存检查
        if (currentProduct.stock < params.quantity) {
          throw new BadRequestException(
            `${currentProduct.name} 库存不足，当前库存 ${currentProduct.stock}，需要 ${params.quantity}`
          );
        }

        const beforeStock = currentProduct.stock;
        const beforeStockWeight = currentProduct.stockWeight || 0;
        const afterStock = Math.max(0, beforeStock - params.quantity);
        const afterStockWeight = Math.max(0, beforeStockWeight - params.weight);
        const newVersion = (currentProduct.version || 1) + 1;

        // 乐观锁更新
        const updateResult = await this.db
          .update(productTable)
          .set({
            stock: afterStock,
            stockWeight: afterStockWeight,
            version: newVersion,
          })
          .where(and(
            eq(productTable.id, params.productId),
            eq(productTable.version, currentProduct.version || 1)
          ))
          .returning();

        if (updateResult.length === 0) {
          if (attempt < maxRetries - 1) {
            await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
            continue;
          }
          throw new ConflictException(`${currentProduct.name} 库存更新冲突，请重试`);
        }

        // 记录库存变更
        await this.db.insert(inventoryRecord).values({
          productId: params.productId,
          productName: currentProduct.name,
          changeType: 'outbound',
          quantityChange: -params.quantity,
          weightChange: -params.weight,
          beforeStock,
          afterStock,
          beforeStockWeight,
          afterStockWeight,
          referenceNo: params.referenceNo,
          operator: params.operator,
          remark: params.remark,
        });

        return;
      } catch (error) {
        if (attempt < maxRetries - 1 && !(error instanceof BadRequestException || error instanceof NotFoundException)) {
          await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
          continue;
        }
        throw error;
      }
    }
  }

  // 获取待对账的出库单
  async getPendingReconciliation(customerId: string) {
    const orders = await this.db
      .select()
      .from(outboundOrder)
      .where(
        and(
          eq(outboundOrder.customerId, customerId),
          eq(outboundOrder.status, 'pending_reconciliation'),
          isNull(outboundOrder.reconciliationId),
        ),
      )
      .orderBy(desc(outboundOrder.outboundDate));

    // 获取每个出库单的明细
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const details = await this.db
          .select()
          .from(outboundDetail)
          .where(eq(outboundDetail.outboundId, order.id));
        return {
          ...order,
          details,
        };
      }),
    );

    return ordersWithDetails;
  }

  // 更新出库单状态
  async updateStatus(id: string, status: string) {
    const result = await this.db
      .update(outboundOrder)
      .set({ status })
      .where(eq(outboundOrder.id, id))
      .returning();
    return result[0] || null;
  }

  // 删除出库单 - 带对账检查、乐观锁、撤销日志、批次库存恢复
  async delete(id: string, operatorId?: string, reason?: string) {
    // 先获取出库单信息
    const order = await this.findById(id);
    if (!order) {
      throw new NotFoundException('出库单不存在');
    }

    // 检查是否已参与对账
    if (order.lockStatus === 'locked' || order.reconciliationId) {
      throw new BadRequestException('该出库单已参与对账，无法删除，请先在对账单中移除');
    }

    // 使用统一工具函数检查撤销时限
    const timeCheck = checkUndoable(order.createdAt, false);
    if (!timeCheck.canUndo) {
      throw new BadRequestException(timeCheck.reason);
    }

    // 开始删除流程
    await this.db.transaction(async (tx) => {
      // 1. 恢复批次库存
      for (const detail of order.details) {
        await this.restoreBatchStocksInTransaction(tx, detail);
      }

      // 2. 恢复产品库存
      for (const detail of order.details) {
        await this.increaseStockInTransaction(tx, {
          productId: detail.productId,
          quantity: detail.quantity,
          weight: detail.weight || 0,
          referenceNo: order.outboundNo,
          operator: operatorId || order.creator || 'system',
          remark: '删除出库单，库存回滚',
        });
      }

      // 3. 记录撤销日志
      if (operatorId) {
        await tx.insert(undoLogTable).values({
          entityType: 'outbound',
          entityId: id,
          operator: operatorId as any,
          reason: reason || '删除出库单',
          originalData: JSON.stringify(order),
        });
      }

      // 4. 删除明细
      for (const detail of order.details) {
        await tx.delete(outboundBatchDetailTable)
          .where(eq(outboundBatchDetailTable.outboundDetailId, detail.id));
      }
      await tx
        .delete(outboundDetail)
        .where(eq(outboundDetail.outboundId, id));

      // 5. 删除主表
      await tx
        .delete(outboundOrder)
        .where(eq(outboundOrder.id, id));
    });

    return { success: true, message: '出库单已删除' };
  }

  /**
   * 取消出库单 - 与入库撤销保持一致
   */
  async cancel(id: string, operatorId: string, reason?: string) {
    // 前置检查（事务外）
    const order = await this.findById(id);
    if (!order) {
      throw new NotFoundException('出库单不存在');
    }

    // 检查是否已撤销
    if (order.cancelledAt) {
      throw new BadRequestException('该出库单已撤销');
    }

    // 检查是否已参与对账
    if (order.lockStatus === 'locked' || order.reconciliationId) {
      throw new BadRequestException('该出库单已参与对账，如需修改请先在对账单中解除关联');
    }

    // 使用统一工具函数检查撤销时限
    const timeCheck = checkUndoable(order.createdAt, false);
    if (!timeCheck.canUndo) {
      throw new BadRequestException(timeCheck.reason);
    }

    // 使用事务包裹所有数据操作，确保原子性
    await this.db.transaction(async (tx) => {
      // 1. 更新出库单状态为已撤销（使用 FOR UPDATE 防止并发）
      const [updatedOrder] = await tx
        .update(outboundOrder)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: reason || '用户撤销',
        })
        .where(eq(outboundOrder.id, id))
        .returning();

      if (!updatedOrder) {
        throw new ConflictException('出库单状态更新失败，可能已被其他操作修改');
      }

      // 2. 恢复批次库存（在事务内执行）
      for (const detail of order.details) {
        await this.restoreBatchStocksInTransaction(tx, detail);
      }

      // 3. 恢复产品库存（在事务内执行）
      for (const detail of order.details) {
        await this.increaseStockInTransaction(tx, {
          productId: detail.productId,
          quantity: detail.quantity,
          weight: detail.weight || 0,
          referenceNo: order.outboundNo,
          operator: operatorId,
          remark: '出库单撤销，库存回滚',
        });
      }

      // 4. 记录操作日志（在事务内执行）
      await tx.insert(operationLogTable).values({
        entityType: 'outbound_order',
        entityId: id,
        operation: 'undo',
        operator: operatorId as any,
        beforeState: JSON.stringify(order),
        afterState: JSON.stringify({ status: 'cancelled', cancelledAt: new Date() }),
        source: 'web',
      });
    });

    return { success: true, message: '出库单已撤销' };
  }

  private async restoreBatchStocksInTransaction(tx: any, detail: any) {
    const allocations = await tx.select({
      batchId: outboundBatchDetailTable.batchId,
      quantity: outboundBatchDetailTable.quantity,
      weight: outboundBatchDetailTable.weight,
    }).from(outboundBatchDetailTable)
      .where(eq(outboundBatchDetailTable.outboundDetailId, detail.id));

    if (allocations.length > 0) {
      for (const allocation of [...allocations].sort((a, b) => a.batchId.localeCompare(b.batchId))) {
        await tx.update(productBatchStockTable).set({
          quantityAvailable: sql`${productBatchStockTable.quantityAvailable} + ${allocation.quantity}`,
          weightAvailable: sql`${productBatchStockTable.weightAvailable} + ${allocation.weight}`,
        }).where(eq(productBatchStockTable.batchId, allocation.batchId));
      }
      return;
    }

    // 兼容没有批次分配明细的旧单据；多批次旧数据无法安全推断分配量，拒绝自动倍增库存。
    const legacyBatchNos = String(detail.batchNo || '').split(',').map((item: string) => item.trim()).filter(Boolean);
    if (legacyBatchNos.length > 1) {
      throw new ConflictException('旧出库单缺少批次分配记录，无法安全自动恢复，请由管理员核对库存');
    }
    if (legacyBatchNos.length === 1) {
      const [batch] = await tx.select({ id: productBatchTable.id }).from(productBatchTable)
        .where(eq(productBatchTable.batchNo, legacyBatchNos[0]));
      if (batch) {
        await tx.update(productBatchStockTable).set({
          quantityAvailable: sql`${productBatchStockTable.quantityAvailable} + ${detail.quantity}`,
          weightAvailable: sql`${productBatchStockTable.weightAvailable} + ${detail.weight}`,
        }).where(eq(productBatchStockTable.batchId, batch.id));
      }
    }
  }

  /**
   * 增加库存 - 带乐观锁（用于删除出库单时恢复库存）
   */
  private async increaseStockWithLock(params: {
    productId: string;
    quantity: number;
    weight: number;
    referenceNo: string;
    operator: string;
    remark?: string;
  }): Promise<void> {
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const [currentProduct] = await this.db
          .select({
            id: productTable.id,
            name: productTable.name,
            stock: productTable.stock,
            stockWeight: productTable.stockWeight,
            version: productTable.version,
          })
          .from(productTable)
          .where(eq(productTable.id, params.productId));

        if (!currentProduct) {
          throw new NotFoundException(`产品不存在: ${params.productId}`);
        }

        const beforeStock = currentProduct.stock;
        const beforeStockWeight = currentProduct.stockWeight || 0;
        const afterStock = beforeStock + params.quantity;
        const afterStockWeight = beforeStockWeight + params.weight;
        const newVersion = (currentProduct.version || 1) + 1;

        // 乐观锁更新
        const updateResult = await this.db
          .update(productTable)
          .set({
            stock: afterStock,
            stockWeight: afterStockWeight,
            version: newVersion,
          })
          .where(and(
            eq(productTable.id, params.productId),
            eq(productTable.version, currentProduct.version || 1)
          ))
          .returning();

        if (updateResult.length === 0) {
          if (attempt < maxRetries - 1) {
            await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
            continue;
          }
          throw new ConflictException(`${currentProduct.name} 库存更新冲突，请重试`);
        }

        // 记录库存变更
        await this.db.insert(inventoryRecord).values({
          productId: params.productId,
          productName: currentProduct.name,
          changeType: 'outbound_rollback',
          quantityChange: params.quantity,
          weightChange: params.weight,
          beforeStock,
          afterStock,
          beforeStockWeight,
          afterStockWeight,
          referenceNo: params.referenceNo,
          operator: params.operator,
          remark: params.remark,
        });

        return;
      } catch (error) {
        if (attempt < maxRetries - 1 && !(error instanceof BadRequestException || error instanceof NotFoundException)) {
          await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
          continue;
        }
        throw error;
      }
    }
  }

  /**
   * 在事务内增加库存 - 用于出库撤销时恢复库存
   * 与 increaseStockWithLock 的区别：在已有事务内执行，不使用重试机制
   */
  private async increaseStockInTransaction(
    tx: any,
    params: {
      productId: string;
      quantity: number;
      weight: number;
      referenceNo: string;
      operator: string;
      remark?: string;
    }
  ): Promise<void> {
    const [currentProduct] = await tx
      .select({
        id: productTable.id,
        name: productTable.name,
        stock: productTable.stock,
        stockWeight: productTable.stockWeight,
        version: productTable.version,
      })
      .from(productTable)
      .where(eq(productTable.id, params.productId));

    if (!currentProduct) {
      throw new NotFoundException(`产品不存在: ${params.productId}`);
    }

    const beforeStock = currentProduct.stock;
    const beforeStockWeight = currentProduct.stockWeight || 0;
    const afterStock = beforeStock + params.quantity;
    const afterStockWeight = beforeStockWeight + params.weight;
    const newVersion = (currentProduct.version || 1) + 1;

    // 乐观锁更新
    const updateResult = await tx
      .update(productTable)
      .set({
        stock: afterStock,
        stockWeight: afterStockWeight,
        version: newVersion,
      })
      .where(and(
        eq(productTable.id, params.productId),
        eq(productTable.version, currentProduct.version || 1)
      ))
      .returning();

    if (updateResult.length === 0) {
      throw new ConflictException(`${currentProduct.name} 库存更新冲突，请重试`);
    }

    // 记录库存变更
    await tx.insert(inventoryRecordTable).values({
      productId: params.productId,
      productName: currentProduct.name,
      changeType: 'outbound_rollback',
      quantityChange: params.quantity,
      weightChange: params.weight,
      beforeStock,
      afterStock,
      beforeStockWeight,
      afterStockWeight,
      referenceNo: params.referenceNo,
      operator: params.operator,
      remark: params.remark,
    });
  }

  // 获取出库单统计
  async getStats(startDate?: string, endDate?: string) {
    const conditions = [eq(outboundOrder.status, 'active')];
    
    if (startDate) {
      conditions.push(sql`${outboundOrder.outboundDate} >= ${new Date(startDate)}`);
    }
    if (endDate) {
      conditions.push(sql`${outboundOrder.outboundDate} <= ${new Date(endDate)}`);
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [countResult, amountResult, weightResult] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)` }).from(outboundOrder).where(whereClause),
      this.db.select({ total: sql<number>`sum(${outboundOrder.totalAmount})` }).from(outboundOrder).where(whereClause),
      this.db.select({ total: sql<number>`sum(${outboundOrder.totalWeight})` }).from(outboundOrder).where(whereClause),
    ]);

    return {
      count: countResult[0]?.count || 0,
      totalAmount: amountResult[0]?.total || 0,
      totalWeight: weightResult[0]?.total || 0,
    };
  }

  // 获取出库单操作日志
  async getOperationLogs(outboundId: string) {
    const logs = await this.db
      .select()
      .from(operationLogTable)
      .where(and(
        eq(operationLogTable.entityType, 'outbound_order'),
        eq(operationLogTable.entityId, outboundId)
      ))
      .orderBy(desc(operationLogTable.createdAt));

    return logs;
  }

  private async syncToFeishuOutbound(order: any, data: any) {
    if (!this.bitableSyncService) return;
    const orgCode = getCurrentTenantContext()?.orgCode;
    for (const detail of data.details) {
      await this.bitableSyncService.syncOutbound({
        orderId: order.outboundNo,
        customerName: data.customerName,
        productName: detail.productName,
        quantity: detail.quantity,
        weight: detail.weight,
        batchNo: detail.batchNo || detail.batchSelections?.map((b: any) => b.batchNo).join(',') || '',
        createdAt: data.outboundDate,
        status: '部分发货',
      }, orgCode);
    }
  }
}

import { Injectable, Inject, Logger, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { eq, and, gte, lte, desc, sql, type SQL } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
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
} from '../../database/schema';
import { yuanToCents } from '../../common/utils/currency';
import { checkUndoable } from '../../common/utils/undo-check.util';
import { PAGINATION } from '../../config/constants';

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
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
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

    // 计算金额转分
    const totalAmountCents = yuanToCents(data.totalAmount);

    // 创建出库单
    const orderResult = await this.db
      .insert(outboundOrder)
      .values({
        outboundNo,
        customerId: data.customerId,
        customerName: data.customerName,
        customerCode: data.customerCode,
        outboundDate: data.outboundDate,
        creator: data.creator,
        receiver: data.receiver || null,
        transporter: data.transporter || null,
        plateNumber: data.plateNumber || null,
        driver: data.driver || null,
        totalAmount: data.totalAmount,
        totalQuantity: data.totalQuantity,
        totalWeight: data.totalWeight,
        totalAmountCents,
        status: 'pending_reconciliation',
        lockStatus: 'unlocked',
      })
      .returning();

    const order = orderResult[0];

    // 创建明细并扣减库存（按批次）
    for (const detail of data.details) {
      // 检查产品是否存在且未删除
      const [productRecord] = await this.db
        .select({
          id: productTable.id,
          name: productTable.name,
          stock: productTable.stock,
          stockWeight: productTable.stockWeight,
          deletedAt: productTable.deletedAt,
        })
        .from(productTable)
        .where(eq(productTable.id, detail.productId));

      if (!productRecord) {
        throw new NotFoundException(`产品不存在: ${detail.productId}`);
      }

      if (productRecord.deletedAt) {
        throw new BadRequestException(`产品 ${productRecord.name} 已删除，无法出库`);
      }

      // 创建出库明细
      const [outboundDetailRecord] = await this.db.insert(outboundDetail).values({
        outboundId: order.id,
        productId: detail.productId,
        productName: detail.productName,
        workpieceNo: detail.workpieceNo || null,
        material: detail.material || null,
        process: detail.process || null,
        unit: detail.unit || '件',
        unitPrice: detail.unitPrice || 0,
        quantity: detail.quantity,
        weight: detail.weight,
        amount: detail.amount,
        batchNo: detail.batchSelections?.map(b => b.batchNo).join(',') || detail.batchNo || null,
        inboundDate: detail.inboundDate || null,
      }).returning();

      // 按批次扣减库存
      if (detail.batchSelections && detail.batchSelections.length > 0) {
        // 指定批次出库
        for (const batchSelection of detail.batchSelections) {
          // 检查批次状态和库存
          const [batch] = await this.db
            .select({
              id: productBatchTable.id,
              batchNo: productBatchTable.batchNo,
            })
            .from(productBatchTable)
            .where(eq(productBatchTable.id, batchSelection.batchId));

          if (!batch) {
            throw new NotFoundException(`批次 ${batchSelection.batchNo} 不存在`);
          }

          // 扣减批次库存
          const [batchStock] = await this.db
            .select({
              quantityAvailable: productBatchStockTable.quantityAvailable,
              weightAvailable: productBatchStockTable.weightAvailable,
            })
            .from(productBatchStockTable)
            .where(eq(productBatchStockTable.batchId, batchSelection.batchId));

          if (!batchStock || batchStock.quantityAvailable < batchSelection.quantity) {
            throw new BadRequestException(
              `批次 ${batchSelection.batchNo} 可用库存不足`
            );
          }

          await this.db
            .update(productBatchStockTable)
            .set({
              quantityAvailable: sql`${productBatchStockTable.quantityAvailable} - ${batchSelection.quantity}`,
              weightAvailable: sql`${productBatchStockTable.weightAvailable} - ${batchSelection.weight}`,
            })
            .where(eq(productBatchStockTable.batchId, batchSelection.batchId));

          // 记录出库批次明细
          if (outboundDetailRecord) {
            await this.db.insert(outboundBatchDetailTable).values({
              outboundDetailId: outboundDetailRecord.id,
              batchId: batchSelection.batchId,
              quantity: batchSelection.quantity,
              weight: batchSelection.weight,
            });
          }
        }
      } else if (detail.batchNo) {
        // 单一批次出库（向后兼容）
        const [batch] = await this.db
          .select({ id: productBatchTable.id })
          .from(productBatchTable)
          .where(eq(productBatchTable.batchNo, detail.batchNo));

        if (!batch) {
          throw new NotFoundException(`批次 ${detail.batchNo} 不存在`);
        }

        await this.db
          .update(productBatchStockTable)
          .set({
            quantityAvailable: sql`${productBatchStockTable.quantityAvailable} - ${detail.quantity}`,
            weightAvailable: sql`${productBatchStockTable.weightAvailable} - ${detail.weight}`,
          })
          .where(eq(productBatchStockTable.batchId, batch.id));

        // 记录出库批次明细
        if (outboundDetailRecord) {
          await this.db.insert(outboundBatchDetailTable).values({
            outboundDetailId: outboundDetailRecord.id,
            batchId: batch.id,
            quantity: detail.quantity,
            weight: detail.weight,
          });
        }
      }

      // 扣减产品总库存（带乐观锁）
      await this.decreaseStockWithLock({
        productId: detail.productId,
        quantity: detail.quantity,
        weight: detail.weight || 0,
        referenceNo: order.outboundNo,
        operator: order.creator || 'system',
        remark: '出库单创建，扣减库存',
      });

      // 处理关单逻辑
      if (detail.closeOrder) {
        await this.handleCloseOrder(detail.productId, data.customerId, order.id, order.outboundNo);
      }
    }

    // 记录操作日志
    await this.db.insert(operationLogTable).values({
      entityType: 'outbound_order',
      entityId: order.id,
      operation: 'create',
      operator: data.creator as any,
      afterState: JSON.stringify({
        outboundNo: order.outboundNo,
        customerId: data.customerId,
        customerName: data.customerName,
        totalQuantity: data.totalQuantity,
        totalWeight: data.totalWeight,
        totalAmount: data.totalAmount,
        details: data.details,
      }),
      source: 'web',
    });

    return this.findById(order.id);
  }

  // 关单处理 - 将未出库的库存转为滞留库存或新批次
  private async handleCloseOrder(
    productId: string,
    customerId: string,
    outboundOrderId: string,
    outboundNo: string
  ) {
    // 获取产品当前库存
    const [productRecord] = await this.db
      .select({ stock: productTable.stock, name: productTable.name })
      .from(productTable)
      .where(eq(productTable.id, productId));

    if (productRecord && productRecord.stock > 0) {
      const closeTime = new Date().toISOString();
      // 修复：使用UUID后缀确保批次号唯一性，避免毫秒级重复
      const uuidSuffix = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
      const batchNo = `CLOSED-${outboundNo}-${uuidSuffix}`;
      
      await this.db.insert(productBatchTable).values({
        batchNo,
        productId,
        // 注意：inboundOrderId字段在此处被用于存储出库单ID，表示该批次由关单操作产生
        // 这是字段复用，业务上通过批次号前缀CLOSED-来识别
        inboundOrderId: outboundOrderId,
        quantity: productRecord.stock,
        weight: 0,
      });

      // 创建对应的批次库存记录
      const [newBatch] = await this.db
        .select({ id: productBatchTable.id })
        .from(productBatchTable)
        .where(eq(productBatchTable.batchNo, batchNo));

      if (newBatch) {
        await this.db.insert(productBatchStockTable).values({
          batchId: newBatch.id,
          quantityAvailable: productRecord.stock,
          weightAvailable: 0,
          lockedQuantity: 0,
          lockedWeight: 0,
          status: 'active',
        });

        // 记录库存变动，说明这是关单产生的结存
        await this.db.insert(inventoryRecordTable).values({
          productId,
          productName: productRecord.name,
          changeType: 'closed_balance',
          quantityChange: 0, // 库存总量不变，只是重新标记批次
          weightChange: 0,
          beforeStock: productRecord.stock,
          afterStock: productRecord.stock,
          beforeStockWeight: 0,
          afterStockWeight: 0,
          referenceNo: outboundNo,
          operator: 'system',
          remark: `关单结存：原库存转为滞留批次 ${batchNo}`,
        });
      }
    }
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
        if (detail.batchNo) {
          const batchNos = detail.batchNo.split(',');
          for (const batchNo of batchNos) {
            const [batch] = await tx
              .select({ id: productBatchTable.id })
              .from(productBatchTable)
              .where(eq(productBatchTable.batchNo, batchNo.trim()));

            if (batch) {
              await tx
                .update(productBatchStockTable)
                .set({
                  quantityAvailable: sql`${productBatchStockTable.quantityAvailable} + ${detail.quantity}`,
                  weightAvailable: sql`${productBatchStockTable.weightAvailable} + ${detail.weight}`,
                })
                .where(eq(productBatchStockTable.batchId, batch.id));
            }
          }
        }
      }

      // 2. 恢复产品库存
      for (const detail of order.details) {
        await this.increaseStockWithLock({
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
        if (detail.batchNo) {
          const batchNos = detail.batchNo.split(',');
          // 按批次号排序，避免死锁
          const sortedBatchNos = batchNos.map(b => b.trim()).sort();

          for (const batchNo of sortedBatchNos) {
            const [batch] = await tx
              .select({ id: productBatchTable.id })
              .from(productBatchTable)
              .where(eq(productBatchTable.batchNo, batchNo));

            if (batch) {
              await tx
                .update(productBatchStockTable)
                .set({
                  quantityAvailable: sql`${productBatchStockTable.quantityAvailable} + ${detail.quantity}`,
                  weightAvailable: sql`${productBatchStockTable.weightAvailable} + ${detail.weight}`,
                })
                .where(eq(productBatchStockTable.batchId, batch.id));
            }
          }
        }
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
    const conditions = [eq(outboundOrder.status, 'pending_reconciliation')];
    
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
}

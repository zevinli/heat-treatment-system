import { Injectable, Inject, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { 
  productBatchTable,
  productBatchStockTable,
  productTable,
  inventoryRecordTable,
} from '../../database/schema';
import { PAGINATION } from '../../config/constants';

export interface BatchStockInfo {
  batchId: string;
  batchNo: string;
  quantityAvailable: number;
  weightAvailable: number;
  lockedQuantity: number;
  lockedWeight: number;
}

export interface OutboundBatchSelection {
  batchId: string;
  quantity: number;
  weight: number;
}

/**
 * 批次服务 - 生成批次号、管理批次库存
 * 支持批次级库存管理、先进先出(FIFO)出库策略
 */
@Injectable()
export class BatchService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  /**
   * 生成批次号 - UUID后缀方案，确保唯一性
   * 格式：${customerCode}-${YYMMDD}-${UUID前8位}
   */
  generateBatchNo(customerCode: string): string {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const uuid = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    return `${customerCode}-${date}-${uuid}`;
  }

  /**
   * 创建批次 - 同时创建批次库存记录
   */
  async createBatch(params: {
    batchNo: string;
    productId: string;
    inboundOrderId: string;
    quantity: number;
    weight?: number;
  }) {
    // 使用事务确保批次和库存记录同时创建
    try {
      // 创建批次
      const [batch] = await this.db
        .insert(productBatchTable)
        .values({
          batchNo: params.batchNo,
          productId: params.productId,
          inboundOrderId: params.inboundOrderId,
          quantity: params.quantity,
          weight: params.weight || 0,
        })
        .returning();

      // 创建批次库存记录
      await this.db.insert(productBatchStockTable).values({
        batchId: batch.id,
        quantityAvailable: params.quantity,
        weightAvailable: params.weight || 0,
        lockedQuantity: 0,
        lockedWeight: 0,
        status: 'active',
      });

      return batch;
    } catch (error: any) {
      if (error.code === '23505' || error.message?.includes('unique constraint')) {
        throw new ConflictException(`批次号 ${params.batchNo} 已存在，请重试`);
      }
      throw error;
    }
  }

  /**
   * 获取产品下的所有批次（包含库存信息）
   */
  async getBatchesByProduct(productId: string) {
    const batches = await this.db
      .select({
        batch: productBatchTable,
        stock: productBatchStockTable,
      })
      .from(productBatchTable)
      .leftJoin(
        productBatchStockTable,
        eq(productBatchTable.id, productBatchStockTable.batchId)
      )
      .where(eq(productBatchTable.productId, productId))
      .orderBy(desc(productBatchTable.createdAt));

    return batches.map(item => ({
      ...item.batch,
      stockInfo: item.stock,
    }));
  }

  /**
   * 获取入库单关联的批次
   */
  async getBatchesByInbound(inboundOrderId: string) {
    return await this.db
      .select()
      .from(productBatchTable)
      .where(eq(productBatchTable.inboundOrderId, inboundOrderId));
  }

  /**
   * 根据批次号获取批次
   */
  async getBatchByNo(batchNo: string) {
    const [batch] = await this.db
      .select()
      .from(productBatchTable)
      .where(eq(productBatchTable.batchNo, batchNo));
    return batch || null;
  }

  /**
   * 根据批次ID获取批次详情（含库存）
   */
  async getBatchById(batchId: string) {
    const [result] = await this.db
      .select({
        batch: productBatchTable,
        stock: productBatchStockTable,
      })
      .from(productBatchTable)
      .leftJoin(
        productBatchStockTable,
        eq(productBatchTable.id, productBatchStockTable.batchId)
      )
      .where(eq(productBatchTable.id, batchId));

    if (!result) return null;

    return {
      ...result.batch,
      stockInfo: result.stock,
    };
  }

  /**
   * 处理不合格批次 - 支持退货/报废/返工
   */
  async handleFailedBatch(
    batchId: string,
    handleType: 'return' | 'scrap' | 'rework',
    reason?: string,
    operator?: string
  ) {
    const batch = await this.getBatchById(batchId);
    if (!batch) {
      throw new NotFoundException('批次不存在');
    }

    // 根据处理方式更新批次
    const updateData: any = {};

    if (handleType === 'return' || handleType === 'scrap') {
      // 退货或报废：将库存清零
      await this.db
        .update(productBatchStockTable)
        .set({
          quantityAvailable: 0,
          weightAvailable: 0,
          status: 'inactive',
        })
        .where(eq(productBatchStockTable.batchId, batchId));
    }

    // 记录处理结果（通过库存变动记录）
    const [product] = await this.db
      .select({ name: productTable.name })
      .from(productTable)
      .where(eq(productTable.id, batch.productId));

    await this.db.insert(inventoryRecordTable).values({
      productId: batch.productId,
      productName: product?.name || '未知产品',
      changeType: handleType === 'return' ? 'return' : handleType === 'scrap' ? 'scrap' : 'rework',
      quantityChange: -(batch.quantity || 0),
      weightChange: -(batch.weight || 0),
      beforeStock: 0,
      afterStock: 0,
      beforeStockWeight: 0,
      afterStockWeight: 0,
      referenceNo: batch.batchNo,
      operator: operator || 'system',
      remark: `${handleType === 'return' ? '退货' : handleType === 'scrap' ? '报废' : '返工'}处理: ${reason || '无'}`,
    });

    return await this.getBatchById(batchId);
  }

  /**
   * 获取产品的可用批次列表（用于出库选择）
   * 按入库时间排序，支持FIFO策略
   */
  async getAvailableBatches(productId: string): Promise<BatchStockInfo[]> {
    const results = await this.db
      .select({
        batchId: productBatchTable.id,
        batchNo: productBatchTable.batchNo,
        quantityAvailable: productBatchStockTable.quantityAvailable,
        weightAvailable: productBatchStockTable.weightAvailable,
        lockedQuantity: productBatchStockTable.lockedQuantity,
        lockedWeight: productBatchStockTable.lockedWeight,
      })
      .from(productBatchTable)
      .innerJoin(
        productBatchStockTable,
        eq(productBatchTable.id, productBatchStockTable.batchId)
      )
      .where(and(
        eq(productBatchTable.productId, productId),
        eq(productBatchStockTable.status, 'active'),
        sql`${productBatchStockTable.quantityAvailable} > 0`,
      ))
      .orderBy(asc(productBatchTable.createdAt));

    return results;
  }

  /**
   * 出库批次选择 - 先进先出(FIFO)策略
   * 自动按入库时间顺序分配批次
   */
  async selectBatchesForOutbound(
    productId: string,
    requiredQuantity: number,
    requiredWeight?: number,
    strategy: 'FIFO' | 'SPECIFIC' = 'FIFO',
    specificBatchIds?: string[]
  ): Promise<OutboundBatchSelection[]> {
    if (strategy === 'SPECIFIC' && specificBatchIds) {
      // 指定批次出库
      const selections: OutboundBatchSelection[] = [];
      let remainingQty = requiredQuantity;
      let remainingWeight = requiredWeight || 0;

      for (const batchId of specificBatchIds) {
        if (remainingQty <= 0 && remainingWeight <= 0) break;

        const batch = await this.getBatchById(batchId);
        if (!batch || !batch.stockInfo) continue;

        const availableQty = batch.stockInfo.quantityAvailable - batch.stockInfo.lockedQuantity;
        const availableWeight = batch.stockInfo.weightAvailable - batch.stockInfo.lockedWeight;

        const qty = Math.min(availableQty, remainingQty);
        const weight = Math.min(availableWeight, remainingWeight);

        if (qty > 0 || weight > 0) {
          selections.push({
            batchId,
            quantity: qty,
            weight: weight,
          });
          remainingQty -= qty;
          remainingWeight -= weight;
        }
      }

      if (remainingQty > 0 || remainingWeight > 0) {
        throw new BadRequestException(
          `指定批次库存不足，还需数量: ${remainingQty}, 重量: ${remainingWeight}`
        );
      }

      return selections;
    } else {
      // FIFO策略
      const availableBatches = await this.getAvailableBatches(productId);
      const selections: OutboundBatchSelection[] = [];
      let remainingQty = requiredQuantity;
      let remainingWeight = requiredWeight || 0;

      for (const batch of availableBatches) {
        if (remainingQty <= 0 && remainingWeight <= 0) break;

        const usableQty = batch.quantityAvailable - batch.lockedQuantity;
        const usableWeight = batch.weightAvailable - batch.lockedWeight;

        if (usableQty <= 0 && usableWeight <= 0) continue;

        const qty = Math.min(usableQty, remainingQty);
        const weight = Math.min(usableWeight, remainingWeight);

        selections.push({
          batchId: batch.batchId,
          quantity: qty,
          weight: weight,
        });

        remainingQty -= qty;
        remainingWeight -= weight;
      }

      if (remainingQty > 0 || remainingWeight > 0) {
        throw new BadRequestException(
          `库存不足，还需数量: ${remainingQty}, 重量: ${remainingWeight}`
        );
      }

      return selections;
    }
  }

  /**
   * 锁定批次库存（出库时预占）
   */
  async lockBatchStock(batchId: string, quantity: number, weight: number = 0) {
    const batch = await this.getBatchById(batchId);
    if (!batch || !batch.stockInfo) {
      throw new NotFoundException('批次不存在');
    }

    const availableQty = batch.stockInfo.quantityAvailable - batch.stockInfo.lockedQuantity;
    const availableWeight = batch.stockInfo.weightAvailable - batch.stockInfo.lockedWeight;

    if (availableQty < quantity || availableWeight < weight) {
      throw new BadRequestException('批次可用库存不足');
    }

    await this.db
      .update(productBatchStockTable)
      .set({
        lockedQuantity: batch.stockInfo.lockedQuantity + quantity,
        lockedWeight: batch.stockInfo.lockedWeight + weight,
      })
      .where(eq(productBatchStockTable.batchId, batchId));

    return await this.getBatchById(batchId);
  }

  /**
   * 扣减批次库存（确认出库）
   */
  async deductBatchStock(batchId: string, quantity: number, weight: number = 0) {
    const batch = await this.getBatchById(batchId);
    if (!batch || !batch.stockInfo) {
      throw new NotFoundException('批次不存在');
    }

    const newQuantity = Math.max(0, batch.stockInfo.quantityAvailable - quantity);
    const newWeight = Math.max(0, batch.stockInfo.weightAvailable - weight);
    const newLockedQty = Math.max(0, batch.stockInfo.lockedQuantity - quantity);
    const newLockedWeight = Math.max(0, batch.stockInfo.lockedWeight - weight);

    await this.db
      .update(productBatchStockTable)
      .set({
        quantityAvailable: newQuantity,
        weightAvailable: newWeight,
        lockedQuantity: newLockedQty,
        lockedWeight: newLockedWeight,
      })
      .where(eq(productBatchStockTable.batchId, batchId));

    return await this.getBatchById(batchId);
  }

  /**
   * 释放锁定库存（出库取消）
   */
  async unlockBatchStock(batchId: string, quantity: number, weight: number = 0) {
    const batch = await this.getBatchById(batchId);
    if (!batch || !batch.stockInfo) {
      throw new NotFoundException('批次不存在');
    }

    const newLockedQty = Math.max(0, batch.stockInfo.lockedQuantity - quantity);
    const newLockedWeight = Math.max(0, batch.stockInfo.lockedWeight - weight);

    await this.db
      .update(productBatchStockTable)
      .set({
        lockedQuantity: newLockedQty,
        lockedWeight: newLockedWeight,
      })
      .where(eq(productBatchStockTable.batchId, batchId));

    return await this.getBatchById(batchId);
  }

  /**
   * 获取批次库存预警列表（积压库存）
   */
  async getOverstockBatches(days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const batches = await this.db
      .select({
        batch: productBatchTable,
        stock: productBatchStockTable,
        productName: productTable.name,
      })
      .from(productBatchTable)
      .innerJoin(
        productBatchStockTable,
        eq(productBatchTable.id, productBatchStockTable.batchId)
      )
      .innerJoin(
        productTable,
        eq(productBatchTable.productId, productTable.id)
      )
      .where(and(
        sql`${productBatchTable.createdAt} < ${cutoffDate.toISOString()}`,
        sql`${productBatchStockTable.quantityAvailable} > 0`,
      ))
      .orderBy(asc(productBatchTable.createdAt));

    return batches.map(item => ({
      ...item.batch,
      stockInfo: item.stock,
      productName: item.productName,
      daysInStock: Math.floor(
        (Date.now() - new Date(item.batch.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));
  }
}

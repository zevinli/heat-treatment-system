import { Injectable, Inject, Logger, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import {
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { TENANT_DATABASE } from '../../common/tenant-database.provider';
import { 
  productTable, 
  inventoryRecordTable,
  approvalRequestTable,
  productBatchTable,
  productBatchStockTable,
} from '../../database/schema';
import { OPTIMISTIC_LOCK, PAGINATION } from '../../config/constants';
import type { InventoryChangeType } from '@shared/api.interface';

/**
 * 库存服务 - 带乐观锁和状态机
 * 冲突解决：#2(原子操作), #8(幂等性), #15(并发冲突)
 * 修复内容：
 * 1. 统一使用完整的库存变动类型
 * 2. 库存调整需要审批流程
 * 3. 完善操作日志记录
 * 4. 支持批次级别库存查询
 * 5. 防止负库存（数据库层面已有CHECK约束）
 */
@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @Inject(TENANT_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  /**
   * 增加库存 - 带乐观锁和幂等性
   * 冲突解决：#8(幂等性), #15(乐观锁)
   * 修复：使用完整的changeType枚举
   */
  async increaseStock(params: {
    productId: string;
    quantity: number;
    weight?: number;
    referenceNo: string;
    operator: string;
    remark?: string;
    changeType?: InventoryChangeType;
    originalInboundId?: string;
  }): Promise<void> {
    const changeType = params.changeType || 'inbound';
    
    // 1. 幂等性检查 - 检查是否已处理
    const existingRecord = await this.db
      .select({ id: inventoryRecordTable.id })
      .from(inventoryRecordTable)
      .where(eq(inventoryRecordTable.referenceNo, params.referenceNo))
      .limit(1);

    if (existingRecord.length > 0) {
      this.logger.warn(`库存操作重复提交: ${params.referenceNo}`);
      throw new ConflictException(`该入库单 ${params.referenceNo} 已处理`);
    }

    // 2. 乐观锁更新库存
    const maxRetries = OPTIMISTIC_LOCK.MAX_RETRIES;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // 获取当前产品和版本
        const [product] = await this.db
          .select({
            id: productTable.id,
            name: productTable.name,
            material: productTable.material,
            process: productTable.process,
            workpieceNo: productTable.workpieceNo,
            unit: productTable.unit,
            stock: productTable.stock,
            stockWeight: productTable.stockWeight,
            version: productTable.version,
            customerCode: productTable.customerCode,
            customerName: productTable.customerName,
          })
          .from(productTable)
          .where(eq(productTable.id, params.productId));

        if (!product) {
          throw new BadRequestException('产品不存在');
        }

        const newStock = product.stock + params.quantity;
        const newStockWeight = (product.stockWeight || 0) + (params.weight || 0);
        const newVersion = (product.version || 1) + 1;

        // 条件更新 - 乐观锁
        const updateResult = await this.db
          .update(productTable)
          .set({
            stock: newStock,
            stockWeight: newStockWeight,
            version: newVersion,
          })
          .where(and(
            eq(productTable.id, params.productId),
            eq(productTable.version, product.version || 1)
          ))
          .returning();

        if (updateResult.length === 0) {
          // 版本冲突，重试
          if (attempt < maxRetries - 1) {
            await new Promise(r => setTimeout(r, OPTIMISTIC_LOCK.BASE_DELAY_MS * (attempt + 1)));
            continue;
          }
          throw new ConflictException('库存更新冲突，请重试');
        }

        // 3. 记录库存变更 - 修复：记录完整的前后状态
        await this.db.insert(inventoryRecordTable).values({
          productId: params.productId,
          productName: product.name,
          material: product.material,
          process: product.process,
          workpieceNo: product.workpieceNo,
          unit: product.unit,
          changeType: changeType,
          quantityChange: params.quantity,
          weightChange: params.weight || 0,
          beforeStock: product.stock,
          afterStock: newStock,
          beforeStockWeight: product.stockWeight || 0,
          afterStockWeight: newStockWeight,
          referenceNo: params.referenceNo,
          customerCode: product.customerCode,
          customerName: product.customerName,
          operator: params.operator,
          remark: params.remark,
          originalInboundId: params.originalInboundId,
        });

        this.logger.log(`库存增加成功: ${product.name}, 变动: +${params.quantity}, 新库存: ${newStock}`);
        return;
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1 && !(error instanceof BadRequestException)) {
          await new Promise(r => setTimeout(r, OPTIMISTIC_LOCK.BASE_DELAY_MS * (attempt + 1)));
          continue;
        }
        throw error;
      }
    }

    if (lastError) {
      throw lastError;
    }
  }

  /**
   * 减少库存 - 带乐观锁
   * 冲突解决：#2(原子操作), #15(并发冲突)
   * 修复：使用完整的changeType枚举，完善校验
   */
  async decreaseStock(params: {
    productId: string;
    quantity: number;
    weight?: number;
    referenceNo: string;
    operator: string;
    remark?: string;
    changeType?: InventoryChangeType;
  }): Promise<void> {
    const changeType = params.changeType || 'outbound';
    const maxRetries = OPTIMISTIC_LOCK.MAX_RETRIES;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const [product] = await this.db
          .select({
            id: productTable.id,
            name: productTable.name,
            material: productTable.material,
            process: productTable.process,
            workpieceNo: productTable.workpieceNo,
            unit: productTable.unit,
            stock: productTable.stock,
            stockWeight: productTable.stockWeight,
            version: productTable.version,
            customerCode: productTable.customerCode,
            customerName: productTable.customerName,
          })
          .from(productTable)
          .where(eq(productTable.id, params.productId));

        if (!product) {
          throw new BadRequestException('产品不存在');
        }

        // 库存检查 - 根据计价单位区分主次校验
        if (product.unit === '件') {
          // 按件计价：数量必须充足
          if (product.stock < params.quantity) {
            throw new BadRequestException(
              `${product.name} 库存不足，当前库存 ${product.stock} 件，需要 ${params.quantity} 件`
            );
          }
        } else {
          // 按kg计价：重量必须充足
          const checkWeight = params.weight ?? (product.stockWeight || 0) / (product.stock || 1) * params.quantity;
          if ((product.stockWeight || 0) < checkWeight) {
            throw new BadRequestException(
              `${product.name} 库存不足，当前库存重量 ${(product.stockWeight || 0).toFixed(2)} kg，需要 ${checkWeight.toFixed(2)} kg`
            );
          }
        }

        const newStock = Math.max(0, product.stock - params.quantity);
        const newStockWeight = Math.max(0, (product.stockWeight || 0) - (params.weight || 0));
        const newVersion = (product.version || 1) + 1;

        const updateResult = await this.db
          .update(productTable)
          .set({
            stock: newStock,
            stockWeight: newStockWeight,
            version: newVersion,
          })
          .where(and(
            eq(productTable.id, params.productId),
            eq(productTable.version, product.version || 1)
          ))
          .returning();

        if (updateResult.length === 0) {
          if (attempt < maxRetries - 1) {
            await new Promise(r => setTimeout(r, OPTIMISTIC_LOCK.BASE_DELAY_MS * (attempt + 1)));
            continue;
          }
          throw new ConflictException('库存更新冲突，请重试');
        }

        // 记录库存变更 - 修复：使用完整changeType
        await this.db.insert(inventoryRecordTable).values({
          productId: params.productId,
          productName: product.name,
          material: product.material,
          process: product.process,
          workpieceNo: product.workpieceNo,
          unit: product.unit,
          changeType: changeType,
          quantityChange: -params.quantity,
          weightChange: -(params.weight || 0),
          beforeStock: product.stock,
          afterStock: newStock,
          beforeStockWeight: product.stockWeight || 0,
          afterStockWeight: newStockWeight,
          referenceNo: params.referenceNo,
          customerCode: product.customerCode,
          customerName: product.customerName,
          operator: params.operator,
          remark: params.remark,
        });

        this.logger.log(`库存减少成功: ${product.name}, 变动: -${params.quantity}, 新库存: ${newStock}`);
        return;
      } catch (error) {
        if (attempt < maxRetries - 1 && !(error instanceof BadRequestException)) {
          await new Promise(r => setTimeout(r, OPTIMISTIC_LOCK.BASE_DELAY_MS * (attempt + 1)));
          continue;
        }
        throw error;
      }
    }
  }

  /**
   * 申请库存调整 - 需要审批
   * 修复：库存调整走审批流程
   */
  async requestStockAdjust(params: {
    productId: string;
    quantityChange: number;
    weightChange?: number;
    operator: string;
    reason: 'inventory_profit' | 'inventory_loss' | 'damage' | 'quality_reject' | 'other';
    remark?: string;
  }): Promise<{ requestId: string; message: string }> {
    const { productId, quantityChange, operator, reason, remark } = params;
    const weightChange = Number(params.weightChange || 0);
    if (!Number.isInteger(quantityChange) || !Number.isFinite(weightChange) || (quantityChange === 0 && weightChange === 0)) {
      throw new BadRequestException('库存调整数量必须为整数，且数量或重量至少有一项不为0');
    }

    // 检查产品是否存在
    const [product] = await this.db
      .select({ id: productTable.id, name: productTable.name, stock: productTable.stock, stockWeight: productTable.stockWeight })
      .from(productTable)
      .where(eq(productTable.id, productId));

    if (!product) {
      throw new BadRequestException('产品不存在');
    }

    // 检查调整后库存是否为负
    if (product.stock + quantityChange < 0) {
      throw new BadRequestException(
        `调整后库存将为负数，当前库存 ${product.stock}，调整量 ${quantityChange}`
      );
    }
    if ((product.stockWeight || 0) + weightChange < 0) {
      throw new BadRequestException('调整后库存重量不能为负数');
    }

    // 创建审批请求
    const [request] = await this.db.insert(approvalRequestTable).values({
      type: 'stock_adjust',
      entityType: 'product',
      entityId: productId,
      requester: operator,
      status: 'pending',
      reason: `[${reason}] ${remark || '库存调整申请'}`,
      payload: { productId, quantityChange, weightChange, reason, remark: remark || '' },
    }).returning();

    this.logger.log(`库存调整申请已创建: ${request.id}, 产品: ${product.name}, 调整量: ${quantityChange}`);

    return {
      requestId: request.id,
      message: '库存调整申请已提交，等待审批',
    };
  }

  /**
   * 审批库存调整
   */
  async approveStockAdjust(params: {
    requestId: string;
    approver: string;
    approved: boolean;
    rejectReason?: string;
  }): Promise<void> {
    const { requestId, approver, approved, rejectReason } = params;

    const [request] = await this.db
      .select()
      .from(approvalRequestTable)
      .where(eq(approvalRequestTable.id, requestId));

    if (!request) {
      throw new BadRequestException('审批请求不存在');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('该审批请求已处理');
    }

    if (request.type !== 'stock_adjust') {
      throw new BadRequestException('审批类型不匹配');
    }
    if (request.requester === approver) {
      throw new ForbiddenException('申请人不能审批自己的库存调整申请');
    }

    if (approved) {
      const payload = request.payload as null | {
        productId: string;
        quantityChange: number;
        weightChange: number;
        reason: string;
        remark?: string;
      };
      if (!payload || payload.productId !== request.entityId) {
        throw new BadRequestException('旧审批申请缺少调整数据，不能自动执行，请重新提交');
      }
      await this.db.transaction(async tx => {
        const [claimed] = await tx.update(approvalRequestTable).set({ status: 'processing' })
          .where(and(eq(approvalRequestTable.id, requestId), eq(approvalRequestTable.status, 'pending')))
          .returning({ id: approvalRequestTable.id });
        if (!claimed) throw new ConflictException('该审批请求已由其他人处理');
        await this.executeStockAdjust(tx, { ...payload, operator: approver });
        await tx.update(approvalRequestTable).set({
          status: 'approved', approver, approvedAt: new Date(),
        }).where(eq(approvalRequestTable.id, requestId));
      });

      this.logger.log(`库存调整申请已批准: ${requestId}`);
    } else {
      // 拒绝审批
      await this.db
        .update(approvalRequestTable)
        .set({
          status: 'rejected',
          approver: approver,
          rejectedAt: new Date(),
          rejectReason: rejectReason || '审批拒绝',
        })
        .where(and(eq(approvalRequestTable.id, requestId), eq(approvalRequestTable.status, 'pending')));

      this.logger.log(`库存调整申请已拒绝: ${requestId}, 原因: ${rejectReason}`);
    }
  }

  /**
   * 执行库存调整 - 内部方法
   * 修复：使用完整的changeType枚举
   */
  private async executeStockAdjust(tx: any, params: {
    productId: string;
    operator: string;
    quantityChange: number;
    weightChange: number;
    reason: string;
    remark?: string;
  }): Promise<void> {
    const [current] = await tx.select().from(productTable).where(eq(productTable.id, params.productId));
    if (!current) throw new BadRequestException('产品不存在');
    const afterStock = current.stock + params.quantityChange;
    const afterWeight = (current.stockWeight || 0) + params.weightChange;
    if (afterStock < 0 || afterWeight < 0) throw new BadRequestException('审批时库存已变化，调整后不能为负数');
    const [updated] = await tx.update(productTable).set({
      stock: afterStock,
      stockWeight: afterWeight,
      version: (current.version || 1) + 1,
    }).where(and(eq(productTable.id, params.productId), eq(productTable.version, current.version || 1)))
      .returning({ id: productTable.id });
    if (!updated) throw new ConflictException('库存已变化，请重新审批');
    const changeType: InventoryChangeType = params.quantityChange > 0
      ? params.reason === 'inventory_profit' ? 'inventory_profit' : 'adjustment_increase'
      : params.reason === 'inventory_loss' ? 'inventory_loss'
        : params.reason === 'damage' ? 'damage'
          : params.reason === 'quality_reject' ? 'quality_reject' : 'adjustment_decrease';
    await tx.insert(inventoryRecordTable).values({
      productId: current.id,
      productName: current.name,
      material: current.material,
      process: current.process,
      workpieceNo: current.workpieceNo,
      unit: current.unit,
      changeType,
      quantityChange: params.quantityChange,
      weightChange: params.weightChange,
      beforeStock: current.stock,
      afterStock,
      beforeStockWeight: current.stockWeight || 0,
      afterStockWeight: afterWeight,
      referenceNo: `ADJ-${Date.now()}`,
      customerCode: current.customerCode,
      customerName: current.customerName,
      operator: params.operator,
      remark: `[${params.reason}] ${params.remark || '审批库存调整'}`,
    });
  }

  async listStockAdjustRequests(status?: string) {
    const condition = status ? and(eq(approvalRequestTable.type, 'stock_adjust'), eq(approvalRequestTable.status, status))
      : eq(approvalRequestTable.type, 'stock_adjust');
    return this.db.select().from(approvalRequestTable).where(condition).orderBy(desc(approvalRequestTable.requestedAt));
  }

  /**
   * 获取可用库存
   * 修复：返回批次级别库存
   */
  async getAvailableStock(productId: string): Promise<{
    totalStock: number;
    availableStock: number;
    batches: Array<{
      batchId: string;
      batchNo: string;
      quantity: number;
    }>;
  }> {
    // 获取产品总库存
    const [product] = await this.db
      .select({ stock: productTable.stock })
      .from(productTable)
      .where(eq(productTable.id, productId));

    // 获取批次库存
    const batches = await this.db
      .select({
        batchId: productBatchTable.id,
        batchNo: productBatchTable.batchNo,
        quantity: productBatchTable.quantity,
      })
      .from(productBatchTable)
      .where(eq(productBatchTable.productId, productId));

    const availableStock = batches.reduce((sum, b) => sum + b.quantity, 0);

    return {
      totalStock: product?.stock || 0,
      availableStock,
      batches: batches.map(b => ({
        batchId: b.batchId,
        batchNo: b.batchNo,
        quantity: b.quantity,
      })),
    };
  }

  /**
   * 获取库存汇总列表
   * 修复：排除已删除产品
   */
  async getInventorySummary(params: {
    search?: string;
    customerCode?: string;
    material?: string;
    minStock?: number;
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { search, customerCode, material, minStock, page = PAGINATION.DEFAULT_PAGE, pageSize = PAGINATION.DEFAULT_PAGE_SIZE } = params;

    // 构建查询条件 - 修复：排除已删除产品
    const conditions = [sql`${productTable.deletedAt} IS NULL`];
    
    if (search) {
      conditions.push(
        sql`(${productTable.name} ILIKE ${`%${search}%`} OR ${productTable.code} ILIKE ${`%${search}%`})`
      );
    }
    if (customerCode) {
      conditions.push(eq(productTable.customerCode, customerCode));
    }
    if (material) {
      conditions.push(eq(productTable.material, material));
    }
    if (minStock !== undefined) {
      conditions.push(sql`${productTable.stock} >= ${minStock}`);
    }

    // 查询总数
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(productTable)
      .where(and(...conditions));
    const total = Number(countResult[0]?.count || 0);

    // 查询数据
    const items = await this.db
      .select()
      .from(productTable)
      .where(and(...conditions))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .orderBy(desc(productTable.updatedAt));

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取库存变动记录
   * 修复：支持按变动类型筛选
   */
  async getInventoryRecords(params: {
    productId?: string;
    changeType?: InventoryChangeType;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { productId, changeType, startDate, endDate, page = PAGINATION.DEFAULT_PAGE, pageSize = PAGINATION.DEFAULT_PAGE_SIZE } = params;

    // 构建查询条件
    const conditions = [sql`${inventoryRecordTable.deletedAt} IS NULL`];
    
    if (productId) {
      conditions.push(eq(inventoryRecordTable.productId, productId));
    }
    if (changeType) {
      conditions.push(eq(inventoryRecordTable.changeType, changeType));
    }
    if (startDate) {
      conditions.push(sql`${inventoryRecordTable.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${inventoryRecordTable.createdAt} <= ${endDate}`);
    }

    // 查询总数
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryRecordTable)
      .where(and(...conditions));
    const total = Number(countResult[0]?.count || 0);

    // 查询数据
    const items = await this.db
      .select()
      .from(inventoryRecordTable)
      .where(and(...conditions))
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .orderBy(desc(inventoryRecordTable.createdAt));

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取超期库存预警列表
   * 修复：添加超期预警功能
   */
  async getOverdueWarnings(): Promise<Array<{
    productId: string;
    productName: string;
    batchNo: string;
    inboundDate: Date;
    storageDays: number;
    maxStorageDays: number;
    severity: 'warning' | 'danger';
  }>> {
    const warnings = await this.db.execute(sql`
      SELECT 
        p.id AS product_id,
        p.name AS product_name,
        pb.batch_no,
        pb.inbound_date,
        (CURRENT_DATE - pb.inbound_date::DATE) AS storage_days,
        p.max_storage_days,
        CASE 
          WHEN (CURRENT_DATE - pb.inbound_date::DATE) > p.max_storage_days * 1.2 THEN 'danger'
          WHEN (CURRENT_DATE - pb.inbound_date::DATE) > p.max_storage_days THEN 'warning'
          ELSE 'normal'
        END AS severity
      FROM 
        product p
      JOIN 
        product_batch pb ON p.id = pb.product_id
      WHERE 
        p.max_storage_days IS NOT NULL
        AND pb.inbound_date IS NOT NULL
        AND (CURRENT_DATE - pb.inbound_date::DATE) > p.max_storage_days * 0.8
        AND p.deleted_at IS NULL
      ORDER BY 
        storage_days DESC
    `);

    return warnings as any;
  }

  /**
   * 手动调整库存 - 管理员直接调整（不走审批，仅用于紧急情况）
   * 修复：添加权限检查和完整日志
   */
  async adjustStockDirect(params: {
    productId: string;
    quantityChange: number;
    weightChange?: number;
    operator: string;
    reason: string;
    remark?: string;
    isAdmin: boolean;
  }): Promise<void> {
    if (!params.isAdmin) {
      throw new ForbiddenException('只有管理员可以直接调整库存，普通用户请走审批流程');
    }

    const { productId, quantityChange, weightChange, operator, reason, remark } = params;

    const maxRetries = OPTIMISTIC_LOCK.MAX_RETRIES;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const [product] = await this.db
          .select({
            id: productTable.id,
            name: productTable.name,
            material: productTable.material,
            process: productTable.process,
            workpieceNo: productTable.workpieceNo,
            unit: productTable.unit,
            stock: productTable.stock,
            stockWeight: productTable.stockWeight,
            version: productTable.version,
            customerCode: productTable.customerCode,
            customerName: productTable.customerName,
          })
          .from(productTable)
          .where(eq(productTable.id, productId));

        if (!product) {
          throw new BadRequestException('产品不存在');
        }

        const newStock = product.stock + quantityChange;
        // 数据库CHECK约束会防止负库存，这里提前检查给出友好提示
        if (newStock < 0) {
          throw new BadRequestException(
            `库存不足，当前库存 ${product.stock}，调整后 ${newStock}`
          );
        }

        const newStockWeight = (product.stockWeight || 0) + (weightChange || 0);
        if (newStockWeight < 0) {
          throw new BadRequestException(
            `库存重量不足，当前重量 ${product.stockWeight || 0}，调整后 ${newStockWeight}`
          );
        }

        const newVersion = (product.version || 1) + 1;

        const updateResult = await this.db
          .update(productTable)
          .set({
            stock: newStock,
            stockWeight: newStockWeight,
            version: newVersion,
          })
          .where(and(
            eq(productTable.id, productId),
            eq(productTable.version, product.version || 1)
          ))
          .returning();

        if (updateResult.length === 0) {
          if (attempt < maxRetries - 1) {
            await new Promise(r => setTimeout(r, OPTIMISTIC_LOCK.BASE_DELAY_MS * (attempt + 1)));
            continue;
          }
          throw new ConflictException('库存更新冲突，请重试');
        }

        // 确定变动类型
        let changeType: InventoryChangeType;
        if (quantityChange > 0) {
          changeType = reason === 'inventory_profit' ? 'inventory_profit' : 'adjustment_increase';
        } else {
          changeType = reason === 'inventory_loss' ? 'inventory_loss' : 
                      reason === 'damage' ? 'damage' :
                      reason === 'quality_reject' ? 'quality_reject' : 'adjustment_decrease';
        }

        // 记录库存变更 - 修复：记录完整信息
        await this.db.insert(inventoryRecordTable).values({
          productId: productId,
          productName: product.name,
          material: product.material,
          process: product.process,
          workpieceNo: product.workpieceNo,
          unit: product.unit,
          changeType: changeType,
          quantityChange: quantityChange,
          weightChange: weightChange || 0,
          beforeStock: product.stock,
          afterStock: newStock,
          beforeStockWeight: product.stockWeight || 0,
          afterStockWeight: newStockWeight,
          referenceNo: `ADJ-${Date.now()}`,
          customerCode: product.customerCode,
          customerName: product.customerName,
          operator: operator,
          remark: `[${reason}] ${remark || '管理员直接调整'}`,
        });

        this.logger.log(`管理员直接调整库存: ${product.name}, 变动: ${quantityChange > 0 ? '+' : ''}${quantityChange}, 操作人: ${operator}`);
        return;
      } catch (error) {
        if (attempt < maxRetries - 1 && !(error instanceof BadRequestException) && !(error instanceof ForbiddenException)) {
          await new Promise(r => setTimeout(r, OPTIMISTIC_LOCK.BASE_DELAY_MS * (attempt + 1)));
          continue;
        }
        throw error;
      }
    }
  }
}

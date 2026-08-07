import { Injectable, Inject, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { BitableSyncService } from '../feishu/bitable-sync.service';
import { eq, and, desc, sql, type SQL } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import {
  inboundOrder,
  inboundDetail,
  product,
  inventoryRecord,
  inboundOrderTable,
  inboundDetailTable,
  productTable,
  inventoryRecordTable,
  productBatchTable,
  productBatchStockTable,
  undoLogTable,
  customer,
  operationLogTable,
} from '../../database/schema';
import { yuanToCents } from '../../common/utils/currency';
import { checkUndoable } from '../../common/utils/undo-check.util';
import { PAGINATION } from '../../config/constants';

@Injectable()
export class InboundService {
  private readonly logger = new Logger(InboundService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly bitableSyncService?: BitableSyncService,
  ) {}

  // 获取所有入库单
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
    
    // 根据状态筛选（默认返回全部）
    if (status && status !== 'all') {
      conditions.push(eq(inboundOrder.status, status));
    }

    if (customerId) {
      conditions.push(eq(inboundOrder.customerId, customerId));
    }
    if (startDate) {
      conditions.push(sql`${inboundOrder.inboundDate} >= ${new Date(startDate)}`);
    }
    if (endDate) {
      conditions.push(sql`${inboundOrder.inboundDate} <= ${new Date(endDate)}`);
    }
    if (keyword?.trim()) {
      const searchPattern = `%${keyword.trim()}%`;
      conditions.push(
        sql`(${inboundOrder.inboundNo} ILIKE ${searchPattern} OR ${inboundOrder.customerName} ILIKE ${searchPattern})`
      );
    }

    const offset = (page - 1) * pageSize;

    // 构建 WHERE 条件
    const whereCondition = conditions.length > 0
      ? conditions.reduce((acc, curr, idx) => idx === 0 ? curr : and(acc!, curr!))
      : undefined;

    // 主查询：撤销单据排后，其他按时间倒序
    const itemsQuery = whereCondition
      ? this.db.select().from(inboundOrder).where(whereCondition).orderBy(sql`${inboundOrder.status} = 'cancelled', ${inboundOrder.createdAt} DESC`).limit(pageSize).offset(offset)
      : this.db.select().from(inboundOrder).orderBy(sql`${inboundOrder.status} = 'cancelled', ${inboundOrder.createdAt} DESC`).limit(pageSize).offset(offset);

    // 统计查询
    const statsQuery = this.db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) FILTER (WHERE ${inboundOrder.status} = 'active')::int`,
        cancelled: sql<number>`count(*) FILTER (WHERE ${inboundOrder.status} = 'cancelled')::int`,
      })
      .from(inboundOrder)
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

  // 根据ID获取入库单
  async findById(id: string) {
    const order = await this.db
      .select()
      .from(inboundOrder)
      .where(eq(inboundOrder.id, id));

    if (!order[0]) return null;

    // 获取明细
    const details = await this.db
      .select()
      .from(inboundDetail)
      .where(eq(inboundDetail.inboundId, id));

    return {
      ...order[0],
      details,
    };
  }

  // 生成入库单号：RK + 年月日 + 3位序号
  private async generateInboundNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, ''); // 格式：YYMMDD
    const prefix = `RK${dateStr}`;
    
    // 查询当天已有的入库单数量
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inboundOrder)
      .where(
        and(
          sql`${inboundOrder.createdAt} >= ${startOfDay.toISOString()}`,
          sql`${inboundOrder.createdAt} < ${endOfDay.toISOString()}`
        )
      );
    
    const sequence = (countResult[0]?.count || 0) + 1;
    const sequenceStr = sequence.toString().padStart(3, '0');
    
    return `${prefix}${sequenceStr}`;
  }

  // 创建入库单 - 带批次创建和库存更新
  async create(data: {
    inboundNo?: string;
    customerId: string;
    customerName: string;
    customerCode: string;
    inboundDate: Date;
    inboundTime?: string;
    creator: string;
    receiver?: string;
    transporter?: string;
    plateNumber?: string;
    driver?: string;
    totalAmount: number;
    totalQuantity: number;
    totalWeight: number;
    details: Array<{
      productId: string;
      productName: string;
      productModel?: string;
      productSpec?: string;
      unit?: string;
      unitPrice?: number;
      quantity: number;
      weight: number;
      amount: number;
      inboundType?: string;
      process?: string;
      material?: string;
      techRequirement?: string;
      urgent?: boolean;
      batchNo?: string;
    }>;
  }) {
    // 计算金额转分
    const totalAmountCents = yuanToCents(data.totalAmount);

    // 自动生成或验证入库单号
    const inboundNo = data.inboundNo || await this.generateInboundNo();
    
    if (data.inboundNo) {
      // 如果前端传了单号，检查是否已存在
      const existingOrder = await this.db
        .select({ id: inboundOrder.id })
        .from(inboundOrder)
        .where(eq(inboundOrder.inboundNo, data.inboundNo))
        .limit(1);
      
      if (existingOrder.length > 0) {
        throw new ConflictException(`入库单号 ${data.inboundNo} 已存在`);
      }
    }

    // 创建入库单
    const orderResult = await this.db
      .insert(inboundOrder)
      .values({
        inboundNo,
        customerId: data.customerId,
        customerName: data.customerName,
        customerCode: data.customerCode,
        inboundDate: data.inboundDate,
        inboundTime: data.inboundTime || null,
        creator: data.creator,
        receiver: data.receiver || null,
        transporter: data.transporter || null,
        plateNumber: data.plateNumber || null,
        driver: data.driver || null,
        totalAmount: data.totalAmount,
        totalQuantity: data.totalQuantity,
        totalWeight: data.totalWeight,
        totalAmountCents,
        status: 'active',
      })
      .returning();

    const order = orderResult[0];

    // 创建明细、批次并更新库存
    for (const detail of data.details) {
      // 创建明细
      const [detailRecord] = await this.db.insert(inboundDetail).values({
        inboundId: order.id,
        productId: detail.productId,
        productName: detail.productName,
        productModel: detail.productModel || null,
        productSpec: detail.productSpec || null,
        unit: detail.unit || '件',
        unitPrice: detail.unitPrice || 0,
        quantity: detail.quantity,
        weight: detail.weight,
        amount: detail.amount,
        inboundType: detail.inboundType || null,
        process: detail.process || null,
        material: detail.material || null,
        techRequirement: detail.techRequirement || null,
        urgent: detail.urgent || false,
      }).returning();

      // 生成或使用传入的批次号
      const batchNo = detail.batchNo || this.generateBatchNo(data.customerCode);

      // 创建批次
      await this.db.insert(productBatchTable).values({
        batchNo,
        productId: detail.productId,
        inboundOrderId: order.id,
        quantity: detail.quantity,
        weight: detail.weight,
      });

      // 更新产品库存
      await this.increaseStock({
        productId: detail.productId,
        quantity: detail.quantity,
        weight: detail.weight,
        referenceNo: order.inboundNo,
        operator: data.creator,
        remark: `入库单创建：${order.inboundNo}`,
      });

      // 更新产品累计入库数量（带乐观锁）
      const [currentProduct] = await this.db
        .select({ version: productTable.version })
        .from(productTable)
        .where(eq(productTable.id, detail.productId));
      
      await this.db
        .update(productTable)
        .set({
          inboundQuantity: sql`${productTable.inboundQuantity} + ${detail.quantity}`,
          inboundWeight: sql`${productTable.inboundWeight} + ${detail.weight}`,
          inboundDate: data.inboundDate,
          version: sql`${productTable.version} + 1`,
        })
        .where(and(
          eq(productTable.id, detail.productId),
          eq(productTable.version, currentProduct?.[0]?.version || 0)
        ));
    }

    // 更新客户入库统计
    await this.updateCustomerInboundStats(data.customerId, data.inboundDate);

    // 同步到飞书多维表格（异步，不阻塞主流程）
    this.syncToFeishuInbound(order, data).catch(err =>
      this.logger.warn(`飞书同步来货登记失败：${err.message}`),
    );

    // 记录操作日志
    await this.db.insert(operationLogTable).values({
      entityType: 'inbound_order',
      entityId: order.id,
      operation: 'create',
      operator: data.creator as any,
      afterState: JSON.stringify({
        inboundNo: order.inboundNo,
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

  // 生成批次号 - 使用UUID确保唯一性
  private generateBatchNo(customerCode: string): string {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const uuid = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    return `${customerCode}-${date}-${uuid}`;
  }

  // 更新客户入库统计 - 修复：使用原子更新避免竞态条件
  private async updateCustomerInboundStats(customerId: string, inboundDate: Date) {
    // 更新总入库次数和最后入库日期
    await this.db
      .update(customer)
      .set({
        inboundCount: sql`${customer.inboundCount} + 1`,
        lastInboundDate: inboundDate,
      })
      .where(eq(customer.id, customerId));

    // 修复：原子更新月入库次数，使用子查询避免竞态条件
    const startOfMonth = new Date(inboundDate.getFullYear(), inboundDate.getMonth(), 1);
    await this.db.execute(sql`
      UPDATE customer 
      SET inbound_count_monthly = (
        SELECT count(*)::int 
        FROM inbound_order 
        WHERE customer_id = ${customerId} 
        AND inbound_date >= ${startOfMonth.toISOString()}
        AND status = 'active'
      )
      WHERE id = ${customerId}
    `);
  }

  // 撤销客户入库统计 - 完整恢复所有统计字段
  private async revertCustomerInboundStats(customerId: string, orderDate: Date) {
    // 获取该客户最近的入库单（排除当前要撤销的）
    const [lastOrder] = await this.db
      .select({ inboundDate: inboundOrder.inboundDate })
      .from(inboundOrder)
      .where(and(
        eq(inboundOrder.customerId, customerId),
        eq(inboundOrder.status, 'active')
      ))
      .orderBy(desc(inboundOrder.inboundDate))
      .limit(1);

    // 判断入库单是否在当月
    const orderMonth = orderDate.getMonth();
    const orderYear = orderDate.getFullYear();
    const now = new Date();
    const isCurrentMonth = orderMonth === now.getMonth() && orderYear === now.getFullYear();

    await this.db
      .update(customer)
      .set({
        inboundCount: sql`GREATEST(0, ${customer.inboundCount} - 1)`,
        // 只有当月入库单才减少月度计数
        inboundCountMonthly: isCurrentMonth 
          ? sql`GREATEST(0, ${customer.inboundCountMonthly} - 1)` 
          : customer.inboundCountMonthly,
        // 更新最后入库日期为最近的入库单日期
        lastInboundDate: lastOrder?.inboundDate || null,
      })
      .where(eq(customer.id, customerId));
  }

  // 增加库存
  private async increaseStock(params: {
    productId: string;
    quantity: number;
    weight?: number;
    referenceNo: string;
    operator: string;
    remark?: string;
  }) {
    const [productRecord] = await this.db
      .select({
        id: productTable.id,
        name: productTable.name,
        stock: productTable.stock,
        stockWeight: productTable.stockWeight,
      })
      .from(productTable)
      .where(eq(productTable.id, params.productId));

    if (!productRecord) {
      throw new BadRequestException('产品不存在');
    }

    const newStock = productRecord.stock + params.quantity;
    const newStockWeight = (productRecord.stockWeight || 0) + (params.weight || 0);

    await this.db
      .update(productTable)
      .set({
        stock: newStock,
        stockWeight: newStockWeight,
      })
      .where(eq(productTable.id, params.productId));

    // 记录库存变动
    await this.db.insert(inventoryRecordTable).values({
      productId: params.productId,
      productName: productRecord.name,
      changeType: 'inbound',
      quantityChange: params.quantity,
      weightChange: params.weight || 0,
      beforeStock: productRecord.stock,
      afterStock: newStock,
      beforeStockWeight: productRecord.stockWeight || 0,
      afterStockWeight: newStockWeight,
      referenceNo: params.referenceNo,
      operator: params.operator,
      remark: params.remark,
    });
  }

  // 检查是否可以撤销
  async checkCanUndo(id: string) {
    const order = await this.findById(id);
    if (!order) {
      return { canUndo: false, reason: '入库单不存在' };
    }

    if (order.status === 'cancelled') {
      return { canUndo: false, reason: '入库单已被撤销' };
    }

    // 检查是否有后续的出库操作
    for (const detail of order.details) {
      const outboundRecords = await this.db
        .select({ id: inventoryRecordTable.id })
        .from(inventoryRecordTable)
        .where(and(
          eq(inventoryRecordTable.productId, detail.productId),
          eq(inventoryRecordTable.changeType, 'outbound'),
          sql`${inventoryRecordTable.createdAt} > ${order.createdAt}`,
        ))
        .limit(1);

      if (outboundRecords.length > 0) {
        return { 
          canUndo: false, 
          reason: `产品 ${detail.productName} 已有后续出库记录，无法撤销` 
        };
      }

      // 检查当前库存是否足够扣减
      const [productRecord] = await this.db
        .select({
          stock: productTable.stock,
          stockWeight: productTable.stockWeight,
        })
        .from(productTable)
        .where(eq(productTable.id, detail.productId));

      if (productRecord) {
        if (productRecord.stock < detail.quantity) {
          return {
            canUndo: false,
            reason: `${detail.productName} 库存不足，无法撤销入库。当前库存: ${productRecord.stock}, 需要扣减: ${detail.quantity}`,
          };
        }
      }
    }

    // 检查是否在允许的时间窗口内（30分钟）或已过审批
    // 修复：使用系统创建时间createdAt，避免用户修改inboundDate导致的误判
    // 如果有已批准的撤销申请，允许超期撤销
    const approvedUndo = await this.db
      .select({ id: undoLogTable.id })
      .from(undoLogTable)
      .where(and(
        eq(undoLogTable.entityId, id),
        eq(undoLogTable.entityType, 'inbound_order'),
        eq(undoLogTable.status, 'approved')
      ))
      .limit(1);

    // 使用统一工具函数检查撤销时限
    const timeCheck = checkUndoable(order.createdAt, approvedUndo.length > 0);
    if (!timeCheck.canUndo) {
      return {
        canUndo: false,
        reason: timeCheck.reason,
        timeRemaining: 0,
      };
    }

    return {
      canUndo: true,
      timeRemaining: timeCheck.timeRemaining,
    };
  }

  // 撤销入库单 - 支持超期审批撤销
  async undo(id: string, operator: string, reason?: string) {
    const checkResult = await this.checkCanUndo(id);
    if (!checkResult.canUndo) {
      throw new BadRequestException(checkResult.reason);
    }

    const order = await this.findById(id);
    if (!order) {
      throw new NotFoundException('入库单不存在');
    }

    // 开始撤销流程
    await this.db.transaction(async (tx) => {
      // 1. 标记入库单为已撤销
      await tx
        .update(inboundOrderTable)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: reason || '用户撤销',
        })
        .where(eq(inboundOrderTable.id, id));

      // 2. 还原产品库存
      for (const detail of order.details) {
        // 获取当前产品库存
        const [productRecord] = await tx
          .select({
            stock: productTable.stock,
            stockWeight: productTable.stockWeight,
            inboundQuantity: productTable.inboundQuantity,
            inboundWeight: productTable.inboundWeight,
          })
          .from(productTable)
          .where(eq(productTable.id, detail.productId));

        if (productRecord) {
          const newStock = Math.max(0, productRecord.stock - detail.quantity);
          const newStockWeight = Math.max(0, (productRecord.stockWeight || 0) - detail.weight);
          const newInboundQty = Math.max(0, productRecord.inboundQuantity - detail.quantity);
          const newInboundWeight = Math.max(0, (productRecord.inboundWeight || 0) - detail.weight);

          await tx
            .update(productTable)
            .set({
              stock: newStock,
              stockWeight: newStockWeight,
              inboundQuantity: newInboundQty,
              inboundWeight: newInboundWeight,
            })
            .where(eq(productTable.id, detail.productId));
        }

        // 3. 删除关联批次库存记录（先删子表）
        const batches = await tx
          .select({ id: productBatchTable.id })
          .from(productBatchTable)
          .where(eq(productBatchTable.inboundOrderId, id));

        for (const batch of batches) {
          await tx
            .delete(productBatchStockTable)
            .where(eq(productBatchStockTable.batchId, batch.id));
        }

        // 4. 删除批次记录
        await tx
          .delete(productBatchTable)
          .where(eq(productBatchTable.inboundOrderId, id));

        // 5. 添加反向库存变动记录 - 修复：关联原入库单ID
        await tx.insert(inventoryRecordTable).values({
          productId: detail.productId,
          productName: detail.productName,
          changeType: 'inbound_rollback',
          quantityChange: -detail.quantity,
          weightChange: -detail.weight,
          beforeStock: productRecord?.stock || 0,
          afterStock: Math.max(0, (productRecord?.stock || 0) - detail.quantity),
          beforeStockWeight: productRecord?.stockWeight || 0,
          afterStockWeight: Math.max(0, (productRecord?.stockWeight || 0) - detail.weight),
          referenceNo: order.inboundNo,
          operator,
          remark: `入库单撤销：${reason || '无'}`,
          originalInboundId: id, // 修复：关联原入库单ID
        });
      }

      // 6. 记录撤销日志
      await tx.insert(undoLogTable).values({
        entityType: 'inbound_order',
        entityId: id,
        operator: operator as any,
        reason: reason || '用户撤销',
        undoTime: new Date(),
        originalData: JSON.stringify(order),
      });

      // 7. 记录操作日志（在事务中）
      await tx.insert(operationLogTable).values({
        entityType: 'inbound_order',
        entityId: id,
        operation: 'undo',
        operator: operator as any,
        beforeState: JSON.stringify(order),
        afterState: JSON.stringify({ status: 'cancelled', cancelledAt: new Date() }),
        source: 'web',
      });

      // 8. 更新客户统计（在事务中）
      const [lastOrder] = await tx
        .select({ inboundDate: inboundOrder.inboundDate })
        .from(inboundOrder)
        .where(and(
          eq(inboundOrder.customerId, order.customerId),
          eq(inboundOrder.status, 'active'),
          sql`${inboundOrder.id} != ${id}`
        ))
        .orderBy(desc(inboundOrder.inboundDate))
        .limit(1);

      const orderDate = new Date(order.inboundDate);
      const orderMonth = orderDate.getMonth();
      const orderYear = orderDate.getFullYear();
      const now = new Date();
      const isCurrentMonth = orderMonth === now.getMonth() && orderYear === now.getFullYear();

      await tx
        .update(customer)
        .set({
          inboundCount: sql`GREATEST(0, ${customer.inboundCount} - 1)`,
          inboundCountMonthly: isCurrentMonth
            ? sql`GREATEST(0, ${customer.inboundCountMonthly} - 1)`
            : customer.inboundCountMonthly,
          lastInboundDate: lastOrder?.inboundDate || null,
        })
        .where(eq(customer.id, order.customerId));
    });

    return this.findById(id);
  }

  // 申请超期撤销审批
  async requestUndoApproval(id: string, operator: string, reason: string) {
    const order = await this.findById(id);
    if (!order) {
      throw new NotFoundException('入库单不存在');
    }

    if (order.status === 'cancelled') {
      throw new BadRequestException('入库单已被撤销');
    }

    // 检查是否已有待审批的申请
    const existingApproval = await this.db
      .select({ id: undoLogTable.id })
      .from(undoLogTable)
      .where(and(
        eq(undoLogTable.entityId, id),
        eq(undoLogTable.entityType, 'inbound_order'),
        eq(undoLogTable.status, 'pending_approval')
      ))
      .limit(1);

    if (existingApproval.length > 0) {
      throw new BadRequestException('已存在待审批的撤销申请');
    }

    // 创建审批记录，使用 status 字段标记审批状态
    await this.db.insert(undoLogTable).values({
      entityType: 'inbound_order',
      entityId: id,
      operator: operator as any,
      reason,
      undoTime: new Date(),
      originalData: JSON.stringify({ inboundNo: order.inboundNo, customerName: order.customerName }),
      status: 'pending_approval',
    });

    return { message: '撤销申请已提交，等待审批' };
  }

  // 获取入库单统计
  async getStats(startDate?: string, endDate?: string) {
    const conditions = [eq(inboundOrder.status, 'active')];
    
    if (startDate) {
      conditions.push(sql`${inboundOrder.inboundDate} >= ${new Date(startDate)}`);
    }
    if (endDate) {
      conditions.push(sql`${inboundOrder.inboundDate} <= ${new Date(endDate)}`);
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [countResult, amountResult, weightResult] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)` }).from(inboundOrder).where(whereClause),
      this.db.select({ total: sql<number>`sum(${inboundOrder.totalAmount})` }).from(inboundOrder).where(whereClause),
      this.db.select({ total: sql<number>`sum(${inboundOrder.totalWeight})` }).from(inboundOrder).where(whereClause),
    ]);

    return {
      count: countResult[0]?.count || 0,
      totalAmount: amountResult[0]?.total || 0,
      totalWeight: weightResult[0]?.total || 0,
    };
  }

  // 获取入库单操作日志
  async getOperationLogs(inboundId: string) {
    const logs = await this.db
      .select()
      .from(operationLogTable)
      .where(and(
        eq(operationLogTable.entityType, 'inbound_order'),
        eq(operationLogTable.entityId, inboundId)
      ))
      .orderBy(desc(operationLogTable.createdAt));

    return logs;
  }

  private async syncToFeishuInbound(order: any, data: any) {
    if (!this.bitableSyncService) return;
    for (const detail of data.details) {
      await this.bitableSyncService.syncInbound({
        orderId: order.inboundNo,
        customerName: data.customerName,
        productName: detail.productName,
        quantity: detail.quantity,
        weight: detail.weight,
        createdAt: data.inboundDate,
        createdBy: data.creator,
        status: '待处理',
      });
    }
  }
}

import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { eq, like, or, and, sql, isNull, desc, inArray } from 'drizzle-orm';
import {
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { TENANT_DATABASE } from '../../common/tenant-database.provider';
import {
  customer,
  productTable,
  inboundOrderTable,
  inboundDetailTable,
  outboundOrderTable,
  outboundDetailTable,
  reconciliationTable,
  reconciliationDetailTable,
} from '../../database/schema';
import { PAGINATION } from '../../config/constants';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    @Inject(TENANT_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // 获取所有客户（排除已删除）
  async findAll(params: {
    search?: string;
    status?: string;
    page?: number;
    pageSize?: number;
    includeDeleted?: boolean;
  }) {
    const { search, status, page = PAGINATION.DEFAULT_PAGE, pageSize = PAGINATION.DEFAULT_PAGE_SIZE, includeDeleted = false } = params;

    // 构建查询条件
    const conditions = [];
    // 默认排除已删除的客户
    if (!includeDeleted) {
      conditions.push(isNull(customer.deletedAt));
    }
    if (search) {
      conditions.push(
        or(
          like(customer.name, `%${search}%`),
          like(customer.code, `%${search}%`),
        ),
      );
    }
    if (status) {
      conditions.push(eq(customer.status, status));
    }

    const offset = (page - 1) * pageSize;

    // 查询总数
    const countResult = conditions.length > 0
      ? await this.db.select({ count: sql<number>`count(*)` }).from(customer).where(and(...conditions))
      : await this.db.select({ count: sql<number>`count(*)` }).from(customer);
    const total = countResult[0]?.count || 0;

    // 查询数据
    const query = conditions.length > 0
      ? this.db.select().from(customer).where(and(...conditions)).limit(pageSize).offset(offset)
      : this.db.select().from(customer).limit(pageSize).offset(offset);

    const items = await query;

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  // 根据ID获取客户（排除已删除）
  async findById(id: string, includeDeleted = false) {
    const whereConditions = [eq(customer.id, id)];
    if (!includeDeleted) {
      whereConditions.push(isNull(customer.deletedAt));
    }
    const result = await this.db
      .select()
      .from(customer)
      .where(and(...whereConditions));
    return result[0] || null;
  }

  // 根据编码获取客户（排除已删除）
  async findByCode(code: string, includeDeleted = false) {
    const whereConditions = [eq(customer.code, code)];
    if (!includeDeleted) {
      whereConditions.push(isNull(customer.deletedAt));
    }
    const result = await this.db
      .select()
      .from(customer)
      .where(and(...whereConditions));
    return result[0] || null;
  }

  // 创建客户
  async create(data: {
    code: string;
    name: string;
    contact?: string;
    phone?: string;
    address?: string;
    transport?: string;
    paymentTerm?: string;
    deliveryDirection?: string;
    settlement?: string;
    category?: string;
    status?: string;
  }) {
    // 检查编码是否已存在
    const existing = await this.findByCode(data.code);
    if (existing) {
      throw new Error(`客户编码 ${data.code} 已存在`);
    }

    const result = await this.db
      .insert(customer)
      .values({
        code: data.code,
        name: data.name,
        contact: data.contact || null,
        phone: data.phone || null,
        address: data.address || null,
        transport: data.transport || null,
        paymentTerm: data.paymentTerm || null,
        deliveryDirection: data.deliveryDirection || null,
        settlement: data.settlement || null,
        category: data.category || null,
        status: data.status || 'active',
      })
      .returning();

    return result[0];
  }

  // 更新客户
  async update(
    id: string,
    data: {
      name?: string;
      contact?: string;
      phone?: string;
      address?: string;
      transport?: string;
      paymentTerm?: string;
      deliveryDirection?: string;
      settlement?: string;
      category?: string;
      status?: string;
    },
  ) {
    const result = await this.db
      .update(customer)
      .set({
        ...data,
      })
      .where(eq(customer.id, id))
      .returning();

    return result[0] || null;
  }

  // 删除客户 - 带关联检查
  async delete(id: string, operatorId?: string) {
    // 1. 检查客户是否存在
    const existing = await this.findById(id);
    if (!existing) {
      throw new BadRequestException('客户不存在');
    }

    // 2. 检查是否有关联的产品
    const products = await this.db
      .select({ id: productTable.id })
      .from(productTable)
      .where(eq(productTable.customerCode, existing.code))
      .limit(1);
    
    if (products.length > 0) {
      throw new BadRequestException('该客户下有关联产品，无法删除');
    }

    // 3. 检查是否有出库单
    const outboundOrders = await this.db
      .select({ id: outboundOrderTable.id })
      .from(outboundOrderTable)
      .where(eq(outboundOrderTable.customerId, id))
      .limit(1);
    
    if (outboundOrders.length > 0) {
      throw new BadRequestException('该客户有关联出库单，无法删除');
    }

    // 4. 检查是否有对账单
    const reconciliations = await this.db
      .select({ id: reconciliationTable.id })
      .from(reconciliationTable)
      .where(eq(reconciliationTable.customerId, id))
      .limit(1);
    
    if (reconciliations.length > 0) {
      throw new BadRequestException('该客户有关联对账单，无法删除');
    }

    // 5. 执行软删除
    const result = await this.db
      .update(customer)
      .set({
        deletedAt: new Date(),
        deletedReason: operatorId ? `用户 ${operatorId} 删除` : '用户删除',
        status: 'deleted',
      })
      .where(eq(customer.id, id))
      .returning();
    return result[0] || null;
  }

  // 恢复已删除的客户
  async restore(id: string) {
    const result = await this.db
      .update(customer)
      .set({
        deletedAt: null,
        deletedReason: null,
        status: 'active',
      })
      .where(eq(customer.id, id))
      .returning();
    return result[0] || null;
  }

  // 获取客户活跃度统计
  async getActivityStats(id: string) {
    const customerData = await this.findById(id);
    if (!customerData) {
      throw new BadRequestException('客户不存在');
    }

    // 计算入库统计
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyInboundCount = customerData.inboundCountMonthly || 0;
    const lastInboundDate = customerData.lastInboundDate;

    // 判断活跃度状态
    let status: 'active' | 'normal' | 'silent' = 'silent';
    if (lastInboundDate) {
      const daysSinceLastInbound = Math.floor(
        (Date.now() - new Date(lastInboundDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastInbound <= 30) {
        status = 'active';
      } else if (daysSinceLastInbound <= 90) {
        status = 'normal';
      }
    }

    const [inboundRows, outboundRows, reconciliationRows] = await Promise.all([
      this.db
        .select({
          id: inboundDetailTable.id,
          date: inboundOrderTable.inboundDate,
          orderNo: inboundOrderTable.inboundNo,
          productName: inboundDetailTable.productName,
          quantity: inboundDetailTable.quantity,
          amount: inboundDetailTable.amount,
          status: inboundOrderTable.status,
        })
        .from(inboundOrderTable)
        .innerJoin(inboundDetailTable, eq(inboundDetailTable.inboundId, inboundOrderTable.id))
        .where(eq(inboundOrderTable.customerId, id))
        .orderBy(desc(inboundOrderTable.inboundDate))
        .limit(500),
      this.db
        .select({
          id: outboundDetailTable.id,
          date: outboundOrderTable.outboundDate,
          orderNo: outboundOrderTable.outboundNo,
          productName: outboundDetailTable.productName,
          quantity: outboundDetailTable.quantity,
          amount: outboundDetailTable.amount,
          status: outboundOrderTable.status,
        })
        .from(outboundOrderTable)
        .innerJoin(outboundDetailTable, eq(outboundDetailTable.outboundId, outboundOrderTable.id))
        .where(eq(outboundOrderTable.customerId, id))
        .orderBy(desc(outboundOrderTable.outboundDate))
        .limit(500),
      this.db
        .select({
          id: reconciliationDetailTable.id,
          date: reconciliationTable.createdAt,
          orderNo: reconciliationTable.reconciliationNo,
          productName: reconciliationDetailTable.productName,
          quantity: reconciliationDetailTable.quantity,
          amount: reconciliationDetailTable.amount,
          status: reconciliationTable.status,
        })
        .from(reconciliationTable)
        .innerJoin(
          reconciliationDetailTable,
          and(
            eq(reconciliationDetailTable.reconciliationId, reconciliationTable.id),
            eq(reconciliationDetailTable.isActive, true),
          ),
        )
        .where(eq(reconciliationTable.customerId, id))
        .orderBy(desc(reconciliationTable.createdAt))
        .limit(500),
    ]);

    const normalizeStatus = (value: string | null, pendingStatuses: string[] = []) =>
      value === 'cancelled' ? 'cancelled' : pendingStatuses.includes(value || '') ? 'pending' : 'completed';
    const transactions = [
      ...inboundRows.map((row: any) => ({ ...row, type: 'inbound', status: normalizeStatus(row.status) })),
      ...outboundRows.map((row: any) => ({ ...row, type: 'outbound', status: normalizeStatus(row.status) })),
      ...reconciliationRows.map((row: any) => ({
        ...row,
        type: 'reconciliation',
        status: normalizeStatus(row.status, ['draft', 'confirmed']),
      })),
    ]
      .map((row: any) => ({
        ...row,
        date: new Date(row.date).toISOString().slice(0, 10),
        quantity: Number(row.quantity || 0),
        amount: Number(row.amount || 0),
      }))
      .sort((a: any, b: any) => b.date.localeCompare(a.date));

    return {
      customerId: id,
      customerName: customerData.name,
      totalInboundCount: customerData.inboundCount || 0,
      monthlyInboundCount,
      lastInboundDate,
      status,
      transactions,
    };
  }

  // 检查客户是否可以停用
  async checkCanDeactivate(id: string) {
    const customerData = await this.findById(id);
    if (!customerData) {
      return { canDeactivate: false, reason: '客户不存在' };
    }

    // 待对账出库单尚未完成财务闭环，禁止停用客户。
    const pendingOutbound = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(outboundOrderTable)
      .where(and(
        eq(outboundOrderTable.customerId, id),
        eq(outboundOrderTable.status, 'pending_reconciliation'),
      ));
    const pendingOutboundCount = pendingOutbound[0]?.count || 0;

    // 检查待对账金额
    const pendingReconciliation = await this.db
      .select({ totalAmount: sql<number>`COALESCE(SUM(total_amount_cents), 0)` })
      .from(reconciliationTable)
      .where(and(
        eq(reconciliationTable.customerId, id),
        eq(reconciliationTable.status, 'draft'),
      ));
    const pendingAmount = (pendingReconciliation[0]?.totalAmount || 0) / 100;

    // 检查未回款金额（已审核但未完全回款的对账单）
    const unreceivedResult = await this.db
      .select({
        totalFinalAmount: sql<number>`COALESCE(SUM(final_amount_cents), 0)`,
        totalReceiptAmount: sql<number>`COALESCE(SUM(receipt_amount_cents), 0)`,
      })
      .from(reconciliationTable)
      .where(and(
        eq(reconciliationTable.customerId, id),
        inArray(reconciliationTable.status, ['audited', 'invoiced', 'partial_paid']),
      ));
    const totalFinalAmount = (unreceivedResult[0]?.totalFinalAmount || 0) / 100;
    const totalReceiptAmount = (unreceivedResult[0]?.totalReceiptAmount || 0) / 100;
    const unreceivedAmount = totalFinalAmount - totalReceiptAmount;

    const canDeactivate = pendingOutboundCount === 0 && pendingAmount === 0 && unreceivedAmount <= 0;

    const reasons: string[] = [];
    if (pendingOutboundCount > 0) {
      reasons.push(`有${pendingOutboundCount}个待发货出库单`);
    }
    if (pendingAmount > 0) {
      reasons.push(`有待对账金额¥${pendingAmount.toFixed(2)}`);
    }
    if (unreceivedAmount > 0) {
      reasons.push(`有未回款金额¥${unreceivedAmount.toFixed(2)}`);
    }

    return {
      canDeactivate,
      pendingOutboundCount,
      pendingReconciliationAmount: pendingAmount,
      unreceivedAmount,
      reason: canDeactivate ? undefined : reasons.join('，'),
    };
  }
}

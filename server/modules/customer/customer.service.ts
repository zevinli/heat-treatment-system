import { Injectable, Inject, Logger, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
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
import { FeishuOutboxService } from '../feishu/feishu-outbox.service';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    @Inject(TENANT_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly feishuOutbox: FeishuOutboxService,
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
    const code = data.code?.trim();
    const name = data.name?.trim();
    if (!code || !/^[A-Za-z0-9_-]{1,50}$/.test(code)) throw new BadRequestException('客户编号需为1-50位字母、数字、横线或下划线');
    if (!name || name.length > 100) throw new BadRequestException('客户名称不能为空且不能超过100个字符');
    if (data.status && !['active', 'inactive'].includes(data.status)) throw new BadRequestException('无效客户状态');
    // 检查编码是否已存在
    const existing = await this.findByCode(code, true);
    if (existing) {
      throw new ConflictException(`客户编码 ${code} 已存在`);
    }

    try {
      return await this.db.transaction(async (tx) => {
      const [created] = await tx.insert(customer).values({
        code,
        name,
        contact: data.contact?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        transport: data.transport?.trim() || null,
        paymentTerm: data.paymentTerm?.trim() || null,
        deliveryDirection: data.deliveryDirection?.trim() || null,
        settlement: data.settlement?.trim() || null,
        category: data.category?.trim() || null,
        status: data.status || 'active',
      }).returning();
      await this.feishuOutbox.enqueue(tx, 'customer', created.id, {
        code: created.code,
        name: created.name,
        contact: created.contact || '',
        phone: created.phone || '',
        address: created.address || '',
        totalInbound: 0,
        totalOutbound: 0,
        paymentRate: 0,
        lastTradeDate: '',
      });
      return created;
      });
    } catch (error: any) {
      if (error?.code === '23505') throw new ConflictException(`客户编码 ${code} 已存在`);
      throw error;
    }
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
    if (data.name !== undefined && !data.name.trim()) {
      throw new BadRequestException('客户名称不能为空');
    }
    if (data.name !== undefined && data.name.trim().length > 100) throw new BadRequestException('客户名称不能超过100个字符');
    if (data.status !== undefined && !['active', 'inactive'].includes(data.status)) throw new BadRequestException('无效客户状态');
    if (data.status === 'inactive') {
      const check = await this.checkCanDeactivate(id);
      if (!check.canDeactivate) throw new BadRequestException(check.reason || '该客户当前不能停用');
    }
    return this.db.transaction(async (tx) => {
      const [updated] = await tx.update(customer).set({
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.contact !== undefined ? { contact: data.contact.trim() || null } : {}),
        ...(data.phone !== undefined ? { phone: data.phone.trim() || null } : {}),
        ...(data.address !== undefined ? { address: data.address.trim() || null } : {}),
        ...(data.transport !== undefined ? { transport: data.transport.trim() || null } : {}),
        ...(data.paymentTerm !== undefined ? { paymentTerm: data.paymentTerm.trim() || null } : {}),
        ...(data.deliveryDirection !== undefined ? { deliveryDirection: data.deliveryDirection.trim() || null } : {}),
        ...(data.settlement !== undefined ? { settlement: data.settlement.trim() || null } : {}),
        ...(data.category !== undefined ? { category: data.category.trim() || null } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        updatedAt: new Date(),
      }).where(and(eq(customer.id, id), isNull(customer.deletedAt))).returning();
      if (!updated) throw new NotFoundException('客户不存在或已删除');
      await this.feishuOutbox.enqueue(tx, 'customer', updated.id, await this.buildFeishuPayload(tx, updated));
      return updated;
    });
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
    return this.db.transaction(async (tx) => {
      const [deleted] = await tx.update(customer).set({
        deletedAt: new Date(),
        deletedReason: operatorId ? `用户 ${operatorId} 删除` : '用户删除',
        status: 'deleted',
      }).where(and(eq(customer.id, id), isNull(customer.deletedAt))).returning();
      if (!deleted) throw new BadRequestException('客户状态已变化，请刷新后重试');
      await this.feishuOutbox.enqueue(tx, 'customer', deleted.id, {
        code: deleted.code,
        name: deleted.name,
        contact: '', phone: '', address: '', totalInbound: 0, totalOutbound: 0,
        paymentRate: 0, lastTradeDate: '', deleted: true,
      });
      return deleted;
    });
  }

  // 恢复已删除的客户
  async restore(id: string) {
    return this.db.transaction(async (tx) => {
      const [restored] = await tx.update(customer).set({
        deletedAt: null,
        deletedReason: null,
        status: 'active',
      }).where(and(eq(customer.id, id), sql`${customer.deletedAt} IS NOT NULL`)).returning();
      if (!restored) throw new BadRequestException('客户不存在或未处于删除状态');
      await this.feishuOutbox.enqueue(tx, 'customer', restored.id, await this.buildFeishuPayload(tx, restored));
      return restored;
    });
  }

  private async buildFeishuPayload(db: any, record: typeof customer.$inferSelect) {
    const [stats] = await db.select({
      totalInbound: sql<number>`(SELECT count(*)::int FROM inbound_order io WHERE io.customer_id = ${record.id} AND io.status = 'active')`,
      totalOutbound: sql<number>`(SELECT count(*)::int FROM outbound_order oo WHERE oo.customer_id = ${record.id} AND oo.status <> 'cancelled')`,
      receivedAmount: sql<number>`COALESCE((SELECT sum(r.receipt_amount) FROM reconciliation r WHERE r.customer_id = ${record.id} AND r.status NOT IN ('voided', 'cancelled')), 0)`,
      finalAmount: sql<number>`COALESCE((SELECT sum(r.final_amount) FROM reconciliation r WHERE r.customer_id = ${record.id} AND r.status NOT IN ('voided', 'cancelled')), 0)`,
      lastTradeDate: sql<Date | null>`GREATEST(
        (SELECT max(io.inbound_date) FROM inbound_order io WHERE io.customer_id = ${record.id} AND io.status = 'active'),
        (SELECT max(oo.outbound_date) FROM outbound_order oo WHERE oo.customer_id = ${record.id} AND oo.status <> 'cancelled')
      )`,
    }).from(customer).where(eq(customer.id, record.id)).limit(1);
    const finalAmount = Number(stats?.finalAmount || 0);
    return {
      code: record.code,
      name: record.name,
      contact: record.contact || '',
      phone: record.phone || '',
      address: record.address || '',
      totalInbound: Number(stats?.totalInbound || 0),
      totalOutbound: Number(stats?.totalOutbound || 0),
      paymentRate: finalAmount > 0 ? Math.min(1, Number(stats?.receivedAmount || 0) / finalAmount) : 0,
      lastTradeDate: stats?.lastTradeDate?.toISOString() || '',
    };
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
        inArray(reconciliationTable.status, ['draft', 'confirmed']),
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
      reasons.push(`有${pendingOutboundCount}个待对账出库单`);
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

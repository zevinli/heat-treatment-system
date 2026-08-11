import { BadRequestException, Injectable } from '@nestjs/common';
import { and, eq, gt, gte, isNull, or, sql } from 'drizzle-orm';
import {
  customerTable,
  inboundDetailTable,
  inboundOrderTable,
  outboundDetailTable,
  outboundOrderTable,
  productBatchStockTable,
  productBatchTable,
  productTable,
  reconciliationTable,
} from '../../database/schema';
import { BitableSyncService } from './bitable-sync.service';
import { FeishuOutboxService, type FeishuSyncJobInput } from './feishu-outbox.service';
import { FeishuTenantConfigService } from './feishu-tenant-config.service';

export type BackfillScope = 'today' | '90d' | '365d' | 'all';

/** 为新连接的租户补齐已有业务数据。业务记录先进入租户自己的可靠同步队列。 */
@Injectable()
export class FeishuBackfillService {
  constructor(
    private readonly configs: FeishuTenantConfigService,
    private readonly outbox: FeishuOutboxService,
    private readonly sync: BitableSyncService,
  ) {}

  async enqueue(orgCode: string, db: any, scope: BackfillScope = '90d') {
    const config = await this.configs.getConfig(orgCode);
    if (!config?.isActive) throw new BadRequestException('请先完成飞书连接并启用同步');
    if (!['today', '90d', '365d', 'all'].includes(scope)) throw new BadRequestException('历史数据范围不正确');
    const since = this.since(scope);

    const inboundBase = db.select({
      orderId: inboundOrderTable.id,
      detailId: inboundDetailTable.id,
      orderNo: inboundOrderTable.inboundNo,
      customerName: inboundOrderTable.customerName,
      productName: inboundDetailTable.productName,
      quantity: inboundDetailTable.quantity,
      weight: inboundDetailTable.weight,
      createdAt: inboundOrderTable.inboundDate,
      createdBy: inboundOrderTable.creator,
      status: inboundOrderTable.status,
      attachments: inboundDetailTable.attachments,
    }).from(inboundDetailTable).innerJoin(inboundOrderTable, eq(inboundOrderTable.id, inboundDetailTable.inboundId));
    const inboundRows = since
      ? await inboundBase.where(gte(inboundOrderTable.inboundDate, since))
      : await inboundBase;
    const jobs: FeishuSyncJobInput[] = inboundRows.map((row: any) => ({
      topic: 'inbound', aggregateKey: `${row.orderId}:${row.detailId}`, payload: {
        orderId: row.orderNo,
        customerName: row.customerName,
        productName: row.productName,
        quantity: row.quantity,
        weight: row.weight,
        createdAt: row.createdAt,
        createdBy: row.createdBy,
        status: row.status === 'cancelled' ? '已取消' : '已入库',
        attachments: row.attachments || [],
      },
    }));

    const outboundBase = db.select({
      orderId: outboundOrderTable.id,
      detailId: outboundDetailTable.id,
      orderNo: outboundOrderTable.outboundNo,
      customerName: outboundOrderTable.customerName,
      productName: outboundDetailTable.productName,
      quantity: outboundDetailTable.quantity,
      weight: outboundDetailTable.weight,
      batchNo: outboundDetailTable.batchNo,
      createdAt: outboundOrderTable.outboundDate,
      status: outboundOrderTable.status,
    }).from(outboundDetailTable).innerJoin(outboundOrderTable, eq(outboundOrderTable.id, outboundDetailTable.outboundId));
    const outboundRows = since
      ? await outboundBase.where(gte(outboundOrderTable.outboundDate, since))
      : await outboundBase;
    jobs.push(...outboundRows.map((row: any) => ({
      topic: 'outbound' as const, aggregateKey: `${row.orderId}:${row.detailId}`, payload: {
        orderId: row.orderNo,
        customerName: row.customerName,
        productName: row.productName,
        quantity: row.quantity,
        weight: row.weight,
        batchNo: row.batchNo || '',
        createdAt: row.createdAt,
        status: row.status === 'cancelled' ? '已取消' : '待对账',
      },
    })));

    const reconciliationBase = db.select().from(reconciliationTable);
    const reconciliationRows = since
      ? await reconciliationBase.where(gte(reconciliationTable.createdAt, since))
      : await reconciliationBase;
    jobs.push(...reconciliationRows.map((row: any) => ({
      topic: 'reconciliation' as const, aggregateKey: row.id, payload: {
        reconciliationNo: row.reconciliationNo,
        date: row.month,
        customerName: row.customerName,
        outboundAmount: Number(row.totalAmount || 0),
        invoicedAmount: Number(row.invoiceAmount || 0),
        receivedAmount: Number(row.receiptAmount || 0),
        paymentStatus: this.paymentStatus(row),
      },
    })));

    // 客户总览和库存是当前状态，不受历史范围限制。
    const customers = await db.select({
      id: customerTable.id,
      code: customerTable.code,
      name: customerTable.name,
      contact: customerTable.contact,
      phone: customerTable.phone,
      address: customerTable.address,
      totalInbound: sql<number>`(SELECT count(*)::int FROM inbound_order io WHERE io.customer_id = ${customerTable.id} AND io.status = 'active')`,
      totalOutbound: sql<number>`(SELECT count(*)::int FROM outbound_order oo WHERE oo.customer_id = ${customerTable.id} AND oo.status <> 'cancelled')`,
      receivedAmount: sql<number>`COALESCE((SELECT sum(r.receipt_amount) FROM reconciliation r WHERE r.customer_id = ${customerTable.id} AND r.status NOT IN ('voided', 'cancelled')), 0)`,
      finalAmount: sql<number>`COALESCE((SELECT sum(r.final_amount) FROM reconciliation r WHERE r.customer_id = ${customerTable.id} AND r.status NOT IN ('voided', 'cancelled')), 0)`,
      lastTradeDate: sql<Date | null>`GREATEST(
        (SELECT max(io.inbound_date) FROM inbound_order io WHERE io.customer_id = ${customerTable.id} AND io.status = 'active'),
        (SELECT max(oo.outbound_date) FROM outbound_order oo WHERE oo.customer_id = ${customerTable.id} AND oo.status <> 'cancelled')
      )`,
    }).from(customerTable).where(isNull(customerTable.deletedAt));
    for (const customer of customers) {
      const finalAmount = Number(customer.finalAmount || 0);
      jobs.push({ topic: 'customer', aggregateKey: customer.id, payload: {
        code: customer.code,
        name: customer.name,
        contact: customer.contact || '',
        phone: customer.phone || '',
        address: customer.address || '',
        totalInbound: Number(customer.totalInbound || 0),
        totalOutbound: Number(customer.totalOutbound || 0),
        paymentRate: finalAmount > 0 ? Math.min(1, Number(customer.receivedAmount || 0) / finalAmount) : 0,
        lastTradeDate: customer.lastTradeDate?.toISOString() || '',
      } });
    }

    await this.outbox.enqueueMany(db, jobs);

    const inventory = await db.select({
      productName: productTable.name,
      material: productTable.material,
      quantityAvailable: productBatchStockTable.quantityAvailable,
      weightAvailable: productBatchStockTable.weightAvailable,
      unit: productTable.unit,
      batchNo: productBatchTable.batchNo,
      inboundDate: productBatchTable.inboundDate,
    }).from(productBatchStockTable)
      .innerJoin(productBatchTable, eq(productBatchTable.id, productBatchStockTable.batchId))
      .innerJoin(productTable, eq(productTable.id, productBatchStockTable.productId))
      .where(and(
        isNull(productTable.deletedAt),
        eq(productBatchStockTable.status, 'active'),
        or(gt(productBatchStockTable.quantityAvailable, 0), gt(productBatchStockTable.weightAvailable, 0)),
      ));
    const inventoryResult = await this.sync.syncInventoryFull(inventory.map((item: any) => ({
      productName: item.productName,
      material: item.material || '',
      currentStock: item.unit === 'kg' ? Number(item.weightAvailable || 0) : Number(item.quantityAvailable || 0),
      unit: item.unit || '件',
      location: '默认库位',
      batchNo: item.batchNo || '',
      inboundDate: item.inboundDate?.toISOString() || '',
    })), orgCode);
    return {
      scope,
      queued: {
        inbound: inboundRows.length,
        outbound: outboundRows.length,
        customer: customers.length,
        reconciliation: reconciliationRows.length,
      },
      inventory: { count: inventory.length, error: inventoryResult.error || null },
      queue: await this.outbox.getSummary(db),
    };
  }

  private since(scope: BackfillScope): Date | null {
    if (scope === 'all') return null;
    const date = new Date();
    if (scope === 'today') date.setHours(0, 0, 0, 0);
    else date.setDate(date.getDate() - (scope === '90d' ? 90 : 365));
    return date;
  }

  private paymentStatus(row: any): string {
    if (row.status === 'cancelled' || row.status === 'voided') return '已取消';
    const finalAmount = Number(row.finalAmountCents || 0);
    const received = Number(row.receiptAmountCents || 0);
    if (finalAmount <= 0 || received >= finalAmount || row.status === 'paid') return '已结清';
    if (received > 0 || row.status === 'partial_paid') return '部分回款';
    return '未回款';
  }
}

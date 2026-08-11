import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { FeishuAuthService } from './feishu-auth.service';
import { FeishuTenantConfigService } from './feishu-tenant-config.service';
import { SYNC_CONFIG } from './constants';
import { TenantConnectionService } from '../tenant/tenant-connection.service';
import { BitableSyncService } from './bitable-sync.service';
import {
  customerTable,
  productBatchStockTable,
  productBatchTable,
  productTable,
} from '../../database/schema';
import { and, eq, isNull, or, gt, sql } from 'drizzle-orm';
import { FeishuOutboxService } from './feishu-outbox.service';

/**
 * 多租户库存定时同步调度器
 * 遍历所有开通了飞书配置的组织，逐一同步库存快照到各自的多维表格
 */
@Injectable()
export class FeishuSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FeishuSchedulerService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private outboxTimer: ReturnType<typeof setInterval> | null = null;
  private inventoryRunning = false;
  private outboxRunning = false;

  constructor(
    private readonly auth: FeishuAuthService,
    private readonly configService: FeishuTenantConfigService,
    private readonly tenantConnections: TenantConnectionService,
    private readonly sync: BitableSyncService,
    private readonly outbox: FeishuOutboxService,
  ) {}

  onModuleInit() {
    if (!this.auth.isConfigured()) {
      this.logger.warn('飞书未配置，跳过库存调度');
      return;
    }
    this.start();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.outboxTimer) {
      clearInterval(this.outboxTimer);
      this.outboxTimer = null;
    }
  }

  private start() {
    const interval = SYNC_CONFIG.INVENTORY_SYNC_INTERVAL_MS;
    this.logger.log(`多租户库存调度已启动（${interval / 1000}s 间隔）`);
    this.runSync();
    this.timer = setInterval(() => this.runSync(), interval);
    this.runOutbox();
    this.outboxTimer = setInterval(() => this.runOutbox(), 10_000);
  }

  private async runSync() {
    if (this.inventoryRunning) return;
    this.inventoryRunning = true;
    try {
      const configs = await this.configService.getAllActiveConfigs();
      this.logger.log(`扫描到 ${configs.length} 个组织开通了飞书`);

      for (const config of configs) {
        try {
          const db = await this.tenantConnections.getTenantDb(config.orgCode);
          // 库存快照必须按真实批次库存同步；product.stock 只有产品汇总值，
          // 会丢失 FIFO 发货、质检及超期预警需要的批次维度。
          const products = await db.select({
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
              or(
                gt(productBatchStockTable.quantityAvailable, 0),
                gt(productBatchStockTable.weightAvailable, 0),
              ),
            ));
          const result = await this.sync.syncInventoryFull(products.map(item => ({
            productName: item.productName,
            material: item.material || '',
            currentStock: item.unit === 'kg'
              ? Number(item.weightAvailable || 0)
              : Number(item.quantityAvailable || 0),
            unit: item.unit || '件',
            location: '默认库位',
            batchNo: item.batchNo || '',
            inboundDate: item.inboundDate?.toISOString() || '',
          })), config.orgCode);
          if (result.error) throw new Error(result.error);

          const customers = await db.select({
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
            const customerResult = await this.sync.syncCustomer({
              code: customer.code,
              name: customer.name,
              contact: customer.contact || '',
              phone: customer.phone || '',
              address: customer.address || '',
              totalInbound: Number(customer.totalInbound || 0),
              totalOutbound: Number(customer.totalOutbound || 0),
              paymentRate: finalAmount > 0 ? Math.min(1, Number(customer.receivedAmount || 0) / finalAmount) : 0,
              lastTradeDate: customer.lastTradeDate?.toISOString() || '',
            }, config.orgCode);
            if (customerResult.error) throw new Error(customerResult.error);
          }
          this.logger.log(`[${config.orgCode}] 飞书库存及客户总览同步完成，共 ${result.affected} 个库存批次、${customers.length} 个客户`);
        } catch (error: any) {
          this.logger.error(`[${config.orgCode}] 飞书库存同步失败：${error.message}`);
        }
      }
    } catch (error: any) {
      this.logger.error(`库存调度异常：${error.message}`);
    } finally {
      this.inventoryRunning = false;
    }
  }

  private async runOutbox() {
    if (this.outboxRunning) return;
    this.outboxRunning = true;
    try {
      const configs = await this.configService.getAllActiveConfigs();
      for (const config of configs) {
        try {
          const db = await this.tenantConnections.getTenantDb(config.orgCode);
          const result = await this.outbox.processTenant(config.orgCode, db);
          if (result.completed || result.failed) {
            this.logger.log(`[${config.orgCode}] 飞书同步队列：成功 ${result.completed}，失败 ${result.failed}`);
          }
        } catch (error: any) {
          this.logger.error(`[${config.orgCode}] 飞书同步队列异常：${error.message}`);
        }
      }
    } catch (error: any) {
      this.logger.error(`飞书同步队列调度异常：${error.message}`);
    } finally {
      this.outboxRunning = false;
    }
  }
}

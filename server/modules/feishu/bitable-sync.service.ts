import { Injectable, Logger } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { FeishuAuthService } from './feishu-auth.service';
import {
  BITABLE_V1,
  FIELD_NAMES,
  SYNC_CONFIG,
  ORDER_STATUS,
} from './constants';
import { FeishuTenantConfigService, type FeishuTenantConfig } from './feishu-tenant-config.service';

// ---- 类型定义 ----
export interface InboundSyncData {
  orderId: string;
  customerName: string;
  productName: string;
  quantity: number;
  weight: number;
  createdAt: Date | string;
  createdBy: string;
  status: string;
}

export interface OutboundSyncData {
  orderId: string;
  customerName: string;
  productName: string;
  quantity: number;
  weight: number;
  batchNo: string;
  createdAt: Date | string;
  status: string;
}

export interface InventorySyncData {
  productName: string;
  material: string;
  currentStock: number;
  unit: string;
  location: string;
  batchNo: string;
  inboundDate: string;
}

export interface CustomerSyncData {
  name: string;
  contact: string;
  phone: string;
  address: string;
  totalInbound: number;
  totalOutbound: number;
  paymentRate: number;
  lastTradeDate: string;
}

export interface ReconciliationSyncData {
  date: string;
  customerName: string;
  outboundAmount: number;
  invoicedAmount: number;
  receivedAmount: number;
  paymentStatus: string;
}

export type SyncResult = {
  table: string;
  action: 'create' | 'update' | 'skip' | 'full_refresh';
  affected: number;
  error?: string;
};

// ---- 服务实现 ----
@Injectable()
export class BitableSyncService {
  private readonly logger = new Logger(BitableSyncService.name);
  /** 限流队列：记录最近的请求时间戳 */
  private requestTimestamps: number[] = [];

  constructor(private readonly auth: FeishuAuthService, private readonly tenantConfigService?: FeishuTenantConfigService) {}

  // =====================================================
  // 公开方法 — 业务层直接调用
  // =====================================================


  /**
   * 获取当前租户的飞书配置（含表 ID）
   * 业务请求中 DRIZZLE_DATABASE 指向主库，可通过 orgCode 查配置
   */
  
  private async getAppToken(orgCode?: string): Promise<string> {
    const config = await this.getTenantConfig(orgCode);
    if (config) return config.bitableAppToken;
    if (orgCode) return '';
    return process.env.FEISHU_BITABLE_APP_TOKEN || '';
  }

  private async getTenantConfig(orgCode?: string): Promise<FeishuTenantConfig | null> {
    if (!this.tenantConfigService) return null;
    // 如果传了 orgCode 则用，否则尝试从环境变量兼容
    if (orgCode) {
      const config = await this.tenantConfigService.getConfig(orgCode);
      return config?.isActive ? config : null;
    }
    return null;
  }

  /**
   * 获取指定表的 ID（先查租户配置，fallback 到环境变量）
   */
  private async resolveTableId(
    tableKey: keyof typeof ORDER_STATUS extends never ? never : 'inbound' | 'outbound' | 'inventory' | 'customer' | 'reconciliation',
    orgCode?: string,
  ): Promise<string> {
    const config = await this.getTenantConfig(orgCode);
    if (config) {
      const map: Record<string, string> = {
        inbound: config.tableInbound,
        outbound: config.tableOutbound,
        inventory: config.tableInventory,
        customer: config.tableCustomer,
        reconciliation: config.tableReconciliation,
      };
      return map[tableKey] || '';
    }
    // 多租户请求绝不能回退到全局表，避免把一个组织的数据写进另一个组织的飞书表。
    if (orgCode) return '';
    // Fallback 到环境变量（单租户模式兼容）
    const envMap: Record<string, string | undefined> = {
      inbound: process.env.FEISHU_TABLE_INBOUND,
      outbound: process.env.FEISHU_TABLE_OUTBOUND,
      inventory: process.env.FEISHU_TABLE_INVENTORY,
      customer: process.env.FEISHU_TABLE_CUSTOMER,
      reconciliation: process.env.FEISHU_TABLE_RECONCILIATION,
    };
    return envMap[tableKey] || '';
  }

  /** 同步单条来货登记 */
  async syncInbound(data: InboundSyncData, orgCode?: string): Promise<SyncResult> {
    if (!this.auth.isConfigured()) return this.skipped('inbound');
    const [tableId, appToken] = await Promise.all([this.resolveTableId('inbound', orgCode), this.getAppToken(orgCode)]);
    if (!tableId || !appToken) return this.missingConfig('inbound');
    return this.upsertRecord(appToken, tableId, FIELD_NAMES.inbound.orderId, data.orderId, {
      [FIELD_NAMES.inbound.orderId]: data.orderId,
      [FIELD_NAMES.inbound.customerName]: data.customerName,
      [FIELD_NAMES.inbound.productName]: data.productName,
      [FIELD_NAMES.inbound.quantity]: data.quantity,
      [FIELD_NAMES.inbound.weight]: data.weight,
      [FIELD_NAMES.inbound.createdAt]: this.toTimestamp(data.createdAt),
      [FIELD_NAMES.inbound.createdBy]: data.createdBy,
      [FIELD_NAMES.inbound.status]: data.status || ORDER_STATUS.INBOUND_PENDING,
    });
  }

  /** 同步单条发货记录 */
  async syncOutbound(data: OutboundSyncData, orgCode?: string): Promise<SyncResult> {
    if (!this.auth.isConfigured()) return this.skipped('outbound');
    const [tableId, appToken] = await Promise.all([this.resolveTableId('outbound', orgCode), this.getAppToken(orgCode)]);
    if (!tableId || !appToken) return this.missingConfig('outbound');
    return this.upsertRecord(appToken, tableId, FIELD_NAMES.outbound.orderId, data.orderId, {
      [FIELD_NAMES.outbound.orderId]: data.orderId,
      [FIELD_NAMES.outbound.customerName]: data.customerName,
      [FIELD_NAMES.outbound.productName]: data.productName,
      [FIELD_NAMES.outbound.quantity]: data.quantity,
      [FIELD_NAMES.outbound.weight]: data.weight,
      [FIELD_NAMES.outbound.batchNo]: data.batchNo,
      [FIELD_NAMES.outbound.createdAt]: this.toTimestamp(data.createdAt),
      [FIELD_NAMES.outbound.status]: data.status || ORDER_STATUS.OUTBOUND_PARTIAL,
    });
  }

  /** 全量刷新库存快照表 */
  async syncInventoryFull(items: InventorySyncData[], orgCode?: string): Promise<SyncResult> {
    if (!this.auth.isConfigured()) return this.skipped('inventory');
    try {
      const [tableId, appToken] = await Promise.all([this.resolveTableId('inventory', orgCode), this.getAppToken(orgCode)]);
      if (!tableId || !appToken) return this.missingConfig('inventory');
      // 1. 清空现有记录
      await this.clearTable(appToken, tableId);
      // 2. 批量写入
      await this.batchCreate(appToken, tableId, items.map(item => ({
        [FIELD_NAMES.inventory.productName]: item.productName,
        [FIELD_NAMES.inventory.material]: item.material,
        [FIELD_NAMES.inventory.currentStock]: item.currentStock,
        [FIELD_NAMES.inventory.unit]: item.unit,
        [FIELD_NAMES.inventory.location]: item.location,
        [FIELD_NAMES.inventory.batchNo]: item.batchNo,
        [FIELD_NAMES.inventory.inboundDate]: item.inboundDate ? this.toTimestamp(item.inboundDate) : undefined,
      })));
      return { table: 'inventory', action: 'full_refresh', affected: items.length };
    } catch (error: any) {
      this.logger.error(`库存全量同步失败：${error.message}`);
      return { table: 'inventory', action: 'full_refresh', affected: 0, error: error.message };
    }
  }

  /** 同步客户总览 */
  async syncCustomer(data: CustomerSyncData, orgCode?: string): Promise<SyncResult> {
    if (!this.auth.isConfigured()) return this.skipped('customer');
    const [tableId, appToken] = await Promise.all([this.resolveTableId('customer', orgCode), this.getAppToken(orgCode)]);
    if (!tableId || !appToken) return this.missingConfig('customer');
    return this.upsertRecord(appToken, tableId, FIELD_NAMES.customer.name, data.name, {
      [FIELD_NAMES.customer.name]: data.name,
      [FIELD_NAMES.customer.contact]: data.contact,
      [FIELD_NAMES.customer.phone]: data.phone,
      [FIELD_NAMES.customer.address]: data.address,
      [FIELD_NAMES.customer.totalInbound]: data.totalInbound,
      [FIELD_NAMES.customer.totalOutbound]: data.totalOutbound,
      [FIELD_NAMES.customer.paymentRate]: data.paymentRate,
      [FIELD_NAMES.customer.lastTradeDate]: data.lastTradeDate ? this.toTimestamp(data.lastTradeDate) : undefined,
    });
  }

  /** 同步每日对账 */
  async syncReconciliation(data: ReconciliationSyncData, orgCode?: string): Promise<SyncResult> {
    if (!this.auth.isConfigured()) return this.skipped('reconciliation');
    const [tableId, appToken] = await Promise.all([this.resolveTableId('reconciliation', orgCode), this.getAppToken(orgCode)]);
    if (!tableId || !appToken) return this.missingConfig('reconciliation');
    const matchValue = `${data.date}_${data.customerName}`;
    return this.upsertRecord(appToken, tableId, FIELD_NAMES.reconciliation.date, matchValue, {
      [FIELD_NAMES.reconciliation.date]: this.toTimestamp(data.date),
      [FIELD_NAMES.reconciliation.customerName]: data.customerName,
      [FIELD_NAMES.reconciliation.outboundAmount]: data.outboundAmount,
      [FIELD_NAMES.reconciliation.invoicedAmount]: data.invoicedAmount,
      [FIELD_NAMES.reconciliation.receivedAmount]: data.receivedAmount,
      [FIELD_NAMES.reconciliation.paymentStatus]: data.paymentStatus,
    });
  }

  // =====================================================
  // 底层 API 封装
  // =====================================================

  /**
   * 按字段值查找记录 — 返回 record_id 或 null
   */
  private async findRecordByField(
    appToken: string,
    tableId: string,
    fieldName: string,
    fieldValue: string,
  ): Promise<string | null> {
    const client = await this.auth.getAuthorizedClient();

    try {
      const encodedValue = encodeURIComponent(fieldValue);
      const url = `${BITABLE_V1}/${appToken}/tables/${tableId}/records`
        + `?filter=${encodeURIComponent(`CurrentValue.[${fieldName}].exact("${encodedValue}")`)}`;

      const resp = await client.get(url);
      if (resp.data.code !== 0) {
        this.logger.warn(`查询记录失败：${resp.data.msg}`);
        return null;
      }
      const items = resp.data.data?.items;
      return items?.length > 0 ? items[0].record_id : null;
    } catch (error: any) {
      this.logger.error(`查询记录异常：${error.message}`);
      return null;
    }
  }

  /**
   * 创建单条记录
   */
  private async createRecord(
    appToken: string,
    tableId: string,
    fields: Record<string, any>,
  ): Promise<string | null> {
    const client = await this.auth.getAuthorizedClient();

    try {
      await this.rateLimit();
      const resp = await client.post(
        `${BITABLE_V1}/${appToken}/tables/${tableId}/records`,
        { fields },
      );
      if (resp.data.code !== 0) {
        this.logger.warn(`创建记录失败：${resp.data.msg}`);
        return null;
      }
      return resp.data.data?.record?.record_id || null;
    } catch (error: any) {
      this.logger.error(`创建记录异常：${error.message}`);
      return null;
    }
  }

  /**
   * 更新单条记录
   */
  private async updateRecord(
    appToken: string,
    tableId: string,
    recordId: string,
    fields: Record<string, any>,
  ): Promise<boolean> {
    const client = await this.auth.getAuthorizedClient();

    try {
      await this.rateLimit();
      const resp = await client.put(
        `${BITABLE_V1}/${appToken}/tables/${tableId}/records/${recordId}`,
        { fields },
      );
      if (resp.data.code !== 0) {
        this.logger.warn(`更新记录失败：${resp.data.msg}`);
        return false;
      }
      return true;
    } catch (error: any) {
      this.logger.error(`更新记录异常：${error.message}`);
      return false;
    }
  }

  /**
   * Upsert：存在则更新，不存在则创建
   */
  private async upsertRecord(
    appToken: string,
    tableId: string,
    matchField: string,
    matchValue: string,
    fields: Record<string, any>,
  ): Promise<SyncResult> {
    try {
      const existingId = await this.findRecordByField(appToken, tableId, matchField, matchValue);
      if (existingId) {
        const ok = await this.updateRecord(appToken, tableId, existingId, fields);
        return { table: tableId, action: ok ? 'update' : 'skip', affected: ok ? 1 : 0 };
      } else {
        await this.createRecord(appToken, tableId, fields);
        return { table: tableId, action: 'create', affected: 1 };
      }
    } catch (error: any) {
      this.logger.error(`Upsert 异常：${error.message}`);
      return { table: tableId, action: 'skip', affected: 0, error: error.message };
    }
  }

  /**
   * 清空整表（删除全部记录）
   */
  private async clearTable(appToken: string, tableId: string): Promise<void> {
    const client = await this.auth.getAuthorizedClient();

    try {
      let hasMore = true;
      let pageToken: string | undefined;
      while (hasMore) {
        const url = `${BITABLE_V1}/${appToken}/tables/${tableId}/records`
          + (pageToken ? `?page_token=${pageToken}` : '');
        const resp = await client.get(url);
        if (resp.data.code !== 0) break;
        const items = resp.data.data?.items || [];
        for (const item of items) {
          await this.rateLimit();
          await client.delete(
            `${BITABLE_V1}/${appToken}/tables/${tableId}/records/${item.record_id}`,
          );
        }
        hasMore = resp.data.data?.has_more || false;
        pageToken = resp.data.data?.page_token;
      }
    } catch (error: any) {
      this.logger.error(`清空表异常：${error.message}`);
    }
  }

  /**
   * 批量创建记录（自动分批，飞书限制单次 500 条）
   */
  private async batchCreate(
    appToken: string,
    tableId: string,
    records: Array<Record<string, any>>,
  ): Promise<void> {
    const client = await this.auth.getAuthorizedClient();
    const batchSize = SYNC_CONFIG.BATCH_CREATE_MAX;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await this.rateLimit();
      try {
        await client.post(
          `${BITABLE_V1}/${appToken}/tables/${tableId}/records/batch_create`,
          { records: batch.map(fields => ({ fields })) },
        );
      } catch (error: any) {
        this.logger.error(`批量创建异常（批次 ${Math.floor(i / batchSize) + 1}）：${error.message}`);
      }
    }
  }

  /**
   * 简单限流：每秒最多 SYNC_CONFIG.RATE_LIMIT_PER_SECOND 次
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      ts => now - ts < 1000,
    );
    if (this.requestTimestamps.length >= SYNC_CONFIG.RATE_LIMIT_PER_SECOND) {
      const oldest = this.requestTimestamps[0];
      const waitMs = 1000 - (now - oldest) + 50;
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
    this.requestTimestamps.push(Date.now());
  }

  /**
   * 未配置时跳过同步
   */
  private skipped(table: string): SyncResult {
    return { table, action: 'skip', affected: 0 };
  }

  private missingConfig(table: string): SyncResult {
    return { table, action: 'skip', affected: 0, error: '当前组织未配置飞书多维表格 App Token 或数据表 ID' };
  }

  /**
   * 日期/字符串 → 毫秒时间戳（飞书日期字段用毫秒值）
   */
  private toTimestamp(value: Date | string | undefined): number | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value.getTime();
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d.getTime();
  }
}

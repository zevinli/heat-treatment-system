import { Injectable, Logger } from '@nestjs/common';
import { FeishuAuthService } from './feishu-auth.service';
import {
  BITABLE_V1,
  FIELD_NAMES,
  FEISHU_FIELD_TYPES,
  FEISHU_DRIVE_UPLOAD_URL,
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
  /** Data URL 形式的现场图片；撤销任务省略此字段，以保留已同步附件。 */
  attachments?: string[];
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
  code: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  totalInbound: number;
  totalOutbound: number;
  paymentRate: number;
  lastTradeDate: string;
  deleted?: boolean;
}

export interface ReconciliationSyncData {
  reconciliationNo: string;
  date: string;
  customerName: string;
  outboundAmount: number;
  invoicedAmount: number;
  receivedAmount: number;
  paymentStatus: string;
  deleted?: boolean;
}

export type SyncResult = {
  table: string;
  action: 'create' | 'update' | 'delete' | 'skip' | 'full_refresh';
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
    let attachmentValues: Array<{ file_token: string }> | undefined;
    try {
      if (data.attachments !== undefined) {
        attachmentValues = await this.uploadInboundAttachments(appToken, data);
      }
    } catch (error: any) {
      const message = `上传来货附件失败：${error?.message || error}`;
      this.logger.error(message);
      return { table: tableId, action: 'skip', affected: 0, error: message };
    }
    return this.upsertRecord(appToken, tableId, {
      [FIELD_NAMES.inbound.orderId]: data.orderId,
      [FIELD_NAMES.inbound.productName]: data.productName,
    }, {
      [FIELD_NAMES.inbound.orderId]: data.orderId,
      [FIELD_NAMES.inbound.customerName]: data.customerName,
      [FIELD_NAMES.inbound.productName]: data.productName,
      [FIELD_NAMES.inbound.quantity]: data.quantity,
      [FIELD_NAMES.inbound.weight]: data.weight,
      [FIELD_NAMES.inbound.createdAt]: this.toTimestamp(data.createdAt),
      [FIELD_NAMES.inbound.createdBy]: data.createdBy,
      [FIELD_NAMES.inbound.status]: data.status || ORDER_STATUS.INBOUND_PENDING,
      ...(attachmentValues !== undefined ? { [FIELD_NAMES.inbound.attachments]: attachmentValues } : {}),
    });
  }

  /** 同步单条发货记录 */
  async syncOutbound(data: OutboundSyncData, orgCode?: string): Promise<SyncResult> {
    if (!this.auth.isConfigured()) return this.skipped('outbound');
    const [tableId, appToken] = await Promise.all([this.resolveTableId('outbound', orgCode), this.getAppToken(orgCode)]);
    if (!tableId || !appToken) return this.missingConfig('outbound');
    return this.upsertRecord(appToken, tableId, {
      [FIELD_NAMES.outbound.orderId]: data.orderId,
      [FIELD_NAMES.outbound.productName]: data.productName,
      [FIELD_NAMES.outbound.batchNo]: data.batchNo,
    }, {
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
      // 先逐行 upsert，全部成功后才删除已经不存在的旧批次。旧实现先清空整表，
      // 一旦飞书在重建过程中超时，用户看到的库存快照会瞬间变成空表。
      const existing = await this.listRecords(appToken, tableId);
      const recordsByKey = new Map<string, Array<{ record_id: string; fields: Record<string, any> }>>();
      for (const record of existing) {
        const key = this.inventoryKey(
          this.normalizeTextField(record.fields?.[FIELD_NAMES.inventory.productName]),
          this.normalizeTextField(record.fields?.[FIELD_NAMES.inventory.batchNo]),
        );
        recordsByKey.set(key, [...(recordsByKey.get(key) || []), record]);
      }
      const desiredKeys = new Set<string>();
      for (const item of items) {
        const key = this.inventoryKey(item.productName, item.batchNo);
        if (desiredKeys.has(key)) throw new Error(`库存快照包含重复批次：${item.productName}/${item.batchNo}`);
        desiredKeys.add(key);
        const fields = {
          [FIELD_NAMES.inventory.productName]: item.productName,
          [FIELD_NAMES.inventory.material]: item.material,
          [FIELD_NAMES.inventory.currentStock]: item.currentStock,
          [FIELD_NAMES.inventory.unit]: item.unit,
          [FIELD_NAMES.inventory.location]: item.location,
          [FIELD_NAMES.inventory.batchNo]: item.batchNo,
          [FIELD_NAMES.inventory.inboundDate]: item.inboundDate ? this.toTimestamp(item.inboundDate) : undefined,
        };
        const current = recordsByKey.get(key)?.[0];
        if (current) await this.updateRecord(appToken, tableId, current.record_id, fields);
        else await this.createRecord(appToken, tableId, fields);
      }
      for (const [key, records] of recordsByKey) {
        const staleRecords = desiredKeys.has(key) ? records.slice(1) : records;
        for (const record of staleRecords) await this.deleteRecord(appToken, tableId, record.record_id);
      }
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
    const matchFields = { [FIELD_NAMES.customer.code]: data.code };
    if (data.deleted) return this.deleteMatchingRecord(appToken, tableId, matchFields);
    return this.upsertRecord(appToken, tableId, matchFields, {
      [FIELD_NAMES.customer.code]: data.code,
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
    const matchFields = { [FIELD_NAMES.reconciliation.orderId]: data.reconciliationNo };
    if (data.deleted) return this.deleteMatchingRecord(appToken, tableId, matchFields);
    const dateTimestamp = this.toTimestamp(data.date);
    if (dateTimestamp === undefined) {
      return { table: 'reconciliation', action: 'skip', affected: 0, error: '对账日期格式无效' };
    }
    return this.upsertRecord(appToken, tableId, matchFields, {
      [FIELD_NAMES.reconciliation.orderId]: data.reconciliationNo,
      [FIELD_NAMES.reconciliation.date]: dateTimestamp,
      [FIELD_NAMES.reconciliation.customerName]: data.customerName,
      [FIELD_NAMES.reconciliation.outboundAmount]: data.outboundAmount,
      [FIELD_NAMES.reconciliation.invoicedAmount]: data.invoicedAmount,
      [FIELD_NAMES.reconciliation.receivedAmount]: data.receivedAmount,
      [FIELD_NAMES.reconciliation.paymentStatus]: data.paymentStatus,
    });
  }

  /** 校验当前租户配置的表是否真实存在，且字段名称和类型都符合同步要求。 */
  async validateTenantConfig(orgCode: string) {
    if (!this.auth.isConfigured()) return { valid: false, error: '服务端飞书 App 凭据未配置', tables: {} };
    const config = await this.getTenantConfig(orgCode);
    if (!config) return { valid: false, error: '当前组织未启用飞书配置', tables: {} };
    const client = await this.auth.getAuthorizedClient();
    const definitions = this.getTableDefinitions(config);
    const tables: Record<string, { valid: boolean; missingFields: string[]; typeMismatches: string[]; error?: string }> = {};
    for (const definition of definitions) {
      if (!definition.id) {
        tables[definition.key] = { valid: false, missingFields: Object.keys(definition.fields), typeMismatches: [], error: '未配置表 ID' };
        continue;
      }
      try {
        await this.rateLimit();
        const response = await client.get(
          `${BITABLE_V1}/${config.bitableAppToken}/tables/${definition.id}/fields`,
          { params: { page_size: 100 } },
        );
        if (response.data.code !== 0) throw new Error(response.data.msg || String(response.data.code));
        const actual = new Map<string, number>((response.data.data?.items || []).map((field: any) => [field.field_name, Number(field.type)]));
        const missingFields = Object.keys(definition.fields).filter(field => !actual.has(field));
        const typeMismatches = Object.entries(definition.fields)
          .filter(([field, expected]) => actual.has(field) && actual.get(field) !== expected)
          .map(([field, expected]) => `${field}（应为类型${expected}，当前为${actual.get(field)}）`);
        tables[definition.key] = { valid: missingFields.length === 0 && typeMismatches.length === 0, missingFields, typeMismatches };
      } catch (error: any) {
        tables[definition.key] = { valid: false, missingFields: Object.keys(definition.fields), typeMismatches: [], error: error.message };
      }
    }
    return { valid: Object.values(tables).every(table => table.valid), tables };
  }

  /**
   * 为用户已经存在的七张表补齐缺失字段。不会删除记录、不会删除额外字段，
   * 也不会强行改写已有的错误类型字段（改类型可能损坏现有数据，需在校验结果中人工处理）。
   */
  async repairTenantFields(orgCode: string) {
    if (!this.auth.isConfigured()) return { repaired: false, error: '服务端飞书 App 凭据未配置', tables: {} };
    const config = await this.getTenantConfig(orgCode);
    if (!config) return { repaired: false, error: '当前组织未启用飞书配置', tables: {} };
    const client = await this.auth.getAuthorizedClient();
    const tables: Record<string, { addedFields: string[]; error?: string }> = {};
    for (const definition of this.getTableDefinitions(config)) {
      if (!definition.id) {
        tables[definition.key] = { addedFields: [], error: '未配置表 ID' };
        continue;
      }
      try {
        await this.rateLimit();
        const currentResponse = await client.get(
          `${BITABLE_V1}/${config.bitableAppToken}/tables/${definition.id}/fields`,
          { params: { page_size: 100 } },
        );
        if (currentResponse.data.code !== 0) throw new Error(currentResponse.data.msg || String(currentResponse.data.code));
        const actual = new Set<string>((currentResponse.data.data?.items || []).map((field: any) => field.field_name));
        const missing = Object.entries(definition.fields).filter(([field]) => !actual.has(field));
        if (missing.length > 0) {
          await this.rateLimit();
          const response = await client.post(
            `${BITABLE_V1}/${config.bitableAppToken}/tables/${definition.id}/fields/batch_create`,
            { fields: missing.map(([fieldName, type]) => ({ field_name: fieldName, type, ui_type: this.feishuUiType(type) })) },
          );
          if (response.data.code !== 0) throw new Error(response.data.msg || String(response.data.code));
        }
        tables[definition.key] = { addedFields: missing.map(([field]) => field) };
      } catch (error: any) {
        tables[definition.key] = { addedFields: [], error: error.message };
      }
    }
    const validation = await this.validateTenantConfig(orgCode);
    return {
      repaired: Object.values(tables).every(table => !table.error),
      addedCount: Object.values(tables).reduce((sum, table) => sum + table.addedFields.length, 0),
      tables,
      validation,
    };
  }

  private getTableDefinitions(config: FeishuTenantConfig) {
    return [
      { key: 'inbound', id: config.tableInbound, fields: FEISHU_FIELD_TYPES.inbound },
      { key: 'outbound', id: config.tableOutbound, fields: FEISHU_FIELD_TYPES.outbound },
      { key: 'inventory', id: config.tableInventory, fields: FEISHU_FIELD_TYPES.inventory },
      { key: 'customer', id: config.tableCustomer, fields: FEISHU_FIELD_TYPES.customer },
      { key: 'reconciliation', id: config.tableReconciliation, fields: FEISHU_FIELD_TYPES.reconciliation },
      { key: 'quality', id: config.tableQuality, fields: FEISHU_FIELD_TYPES.quality },
      { key: 'process', id: config.tableProcess, fields: FEISHU_FIELD_TYPES.process },
    ];
  }

  private feishuUiType(type: number): string {
    return type === 1 ? 'Text'
      : type === 2 ? 'Number'
      : type === 3 ? 'SingleSelect'
      : type === 5 ? 'DateTime'
      : type === 6 ? 'Progress'
      : type === 17 ? 'Attachment'
      : 'Text';
  }

  /**
   * 多维表格附件不能直接写 Data URL：需先上传到同一个 Bitable，
   * 再把返回的 file_token 写入附件字段。
   */
  private async uploadInboundAttachments(
    appToken: string,
    data: InboundSyncData,
  ): Promise<Array<{ file_token: string }>> {
    const attachments = data.attachments || [];
    if (attachments.length > 3) throw new Error('单个产品最多同步3张图片');
    const uploaded: Array<{ file_token: string }> = [];
    for (let index = 0; index < attachments.length; index += 1) {
      const { bytes, mimeType, extension } = this.parseImageDataUrl(attachments[index]);
      const safeOrderId = data.orderId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48) || 'inbound';
      const fileName = `${safeOrderId}-${index + 1}.${extension}`;
      const form = new FormData();
      form.append('file_name', fileName);
      form.append('parent_type', 'bitable_image');
      form.append('parent_node', appToken);
      form.append('size', String(bytes.byteLength));
      form.append('file', new Blob([bytes], { type: mimeType }), fileName);
      const client = await this.auth.getAuthorizedClient();
      await this.rateLimit();
      const response = await client.post(FEISHU_DRIVE_UPLOAD_URL, form);
      if (response.data.code !== 0) {
        throw new Error(response.data.msg || String(response.data.code));
      }
      const fileToken = response.data.data?.file_token;
      if (!fileToken) throw new Error('飞书上传响应缺少 file_token');
      uploaded.push({ file_token: fileToken });
    }
    return uploaded;
  }

  private parseImageDataUrl(value: string): { bytes: Uint8Array; mimeType: string; extension: string } {
    const match = /^data:(image\/(?:png|jpe?g|webp|gif|bmp|tiff|x-icon));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(value);
    if (!match) throw new Error('附件不是受支持的图片 Data URL');
    const normalizedMime = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length === 0 || buffer.length > 2 * 1024 * 1024) {
      throw new Error('每张图片必须大于0且不超过2MB');
    }
    const extensionByMime: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/bmp': 'bmp',
      'image/tiff': 'tiff',
      'image/x-icon': 'ico',
    };
    return { bytes: Uint8Array.from(buffer), mimeType: normalizedMime, extension: extensionByMime[normalizedMime] };
  }

  // =====================================================
  // 底层 API 封装
  // =====================================================

  /**
   * 按字段值查找记录 — 返回 record_id 或 null
   */
  private async findRecordByFields(
    appToken: string,
    tableId: string,
    matchFields: Record<string, string | number | boolean>,
  ): Promise<string | null> {
    const client = await this.auth.getAuthorizedClient();

    const expressions = Object.entries(matchFields).map(([fieldName, value]) =>
      `CurrentValue.[${fieldName}] = ${this.toFilterLiteral(value)}`,
    );
    if (expressions.length === 0) {
      throw new Error('飞书记录匹配条件不能为空');
    }
    const filter = expressions.length === 1 ? expressions[0] : `AND(${expressions.join(',')})`;
    await this.rateLimit();
    const resp = await client.get(
      `${BITABLE_V1}/${appToken}/tables/${tableId}/records`,
      // 交给 Axios 统一编码一次。手动 encodeURIComponent 会让中文和特殊字符二次编码，
      // 导致飞书无法命中已有记录并不断创建重复行。
      { params: { filter, page_size: 2 } },
    );
    if (resp.data.code !== 0) {
      throw new Error(`查询飞书记录失败：${resp.data.msg || resp.data.code}`);
    }
    const items = resp.data.data?.items || [];
    if (items.length > 1) {
      this.logger.warn(`飞书表 ${tableId} 存在重复记录，匹配条件：${Object.keys(matchFields).join('、')}`);
    }
    return items[0]?.record_id || null;
  }

  /**
   * 创建单条记录
   */
  private async createRecord(
    appToken: string,
    tableId: string,
    fields: Record<string, any>,
  ): Promise<string> {
    const client = await this.auth.getAuthorizedClient();

    await this.rateLimit();
    const resp = await client.post(
      `${BITABLE_V1}/${appToken}/tables/${tableId}/records`,
      { fields },
    );
    if (resp.data.code !== 0) {
      throw new Error(`创建飞书记录失败：${resp.data.msg || resp.data.code}`);
    }
    const recordId = resp.data.data?.record?.record_id;
    if (!recordId) throw new Error('飞书创建记录成功响应缺少 record_id');
    return recordId;
  }

  /**
   * 更新单条记录
   */
  private async updateRecord(
    appToken: string,
    tableId: string,
    recordId: string,
    fields: Record<string, any>,
  ): Promise<void> {
    const client = await this.auth.getAuthorizedClient();

    await this.rateLimit();
    const resp = await client.put(
      `${BITABLE_V1}/${appToken}/tables/${tableId}/records/${recordId}`,
      { fields },
    );
    if (resp.data.code !== 0) {
      throw new Error(`更新飞书记录失败：${resp.data.msg || resp.data.code}`);
    }
  }

  private async deleteRecord(appToken: string, tableId: string, recordId: string): Promise<void> {
    const client = await this.auth.getAuthorizedClient();
    await this.rateLimit();
    const resp = await client.delete(`${BITABLE_V1}/${appToken}/tables/${tableId}/records/${recordId}`);
    if (resp.data.code !== 0) throw new Error(`删除飞书记录失败：${resp.data.msg || resp.data.code}`);
  }

  private async listRecords(appToken: string, tableId: string): Promise<Array<{ record_id: string; fields: Record<string, any> }>> {
    const client = await this.auth.getAuthorizedClient();
    const records: Array<{ record_id: string; fields: Record<string, any> }> = [];
    let pageToken: string | undefined;
    do {
      await this.rateLimit();
      const resp = await client.get(`${BITABLE_V1}/${appToken}/tables/${tableId}/records`, {
        params: { page_size: 500, ...(pageToken ? { page_token: pageToken } : {}) },
      });
      if (resp.data.code !== 0) throw new Error(`读取飞书记录失败：${resp.data.msg || resp.data.code}`);
      records.push(...(resp.data.data?.items || []));
      pageToken = resp.data.data?.has_more ? resp.data.data?.page_token : undefined;
      if (pageToken === '') pageToken = undefined;
    } while (pageToken);
    return records;
  }

  /**
   * Upsert：存在则更新，不存在则创建
   */
  private async upsertRecord(
    appToken: string,
    tableId: string,
    matchFields: Record<string, string | number | boolean>,
    fields: Record<string, any>,
  ): Promise<SyncResult> {
    try {
      const existingId = await this.findRecordByFields(appToken, tableId, matchFields);
      if (existingId) {
        await this.updateRecord(appToken, tableId, existingId, fields);
        return { table: tableId, action: 'update', affected: 1 };
      } else {
        await this.createRecord(appToken, tableId, fields);
        return { table: tableId, action: 'create', affected: 1 };
      }
    } catch (error: any) {
      this.logger.error(`Upsert 异常：${error.message}`);
      return { table: tableId, action: 'skip', affected: 0, error: error.message };
    }
  }

  private async deleteMatchingRecord(
    appToken: string,
    tableId: string,
    matchFields: Record<string, string | number | boolean>,
  ): Promise<SyncResult> {
    try {
      const existingId = await this.findRecordByFields(appToken, tableId, matchFields);
      if (!existingId) return { table: tableId, action: 'delete', affected: 0 };
      await this.deleteRecord(appToken, tableId, existingId);
      return { table: tableId, action: 'delete', affected: 1 };
    } catch (error: any) {
      this.logger.error(`删除飞书记录异常：${error.message}`);
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
    return { table, action: 'skip', affected: 0, error: '服务端未配置 FEISHU_APP_ID 或 FEISHU_APP_SECRET' };
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

  private toFilterLiteral(value: string | number | boolean): string {
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new Error('飞书筛选条件包含无效数字');
      return String(value);
    }
    if (typeof value === 'boolean') return value ? 'TRUE()' : 'FALSE()';
    // 飞书筛选公式中的字符串使用双引号；同时转义反斜杠和双引号。
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }

  private inventoryKey(productName: string, batchNo: string): string {
    return `${productName.trim()}\u0000${batchNo.trim()}`;
  }

  private normalizeTextField(value: unknown): string {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(item => typeof item === 'string' ? item : (item as any)?.text || '').join('');
    return value == null ? '' : String(value);
  }
}

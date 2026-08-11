import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { FeishuAuthService } from './feishu-auth.service';
import { FeishuTenantConfigService, FeishuTenantConfig } from './feishu-tenant-config.service';
import { FEISHU_API_BASE, FIELD_NAMES, SYNC_CONFIG } from './constants';

/**
 * 飞书多维表格自动开通服务 — 为组织创建五张核心表，可按需连接质检/工艺扩展表
 */
@Injectable()
export class FeishuProvisioningService {
  private readonly logger = new Logger(FeishuProvisioningService.name);

  constructor(
    private readonly auth: FeishuAuthService,
    private readonly configService: FeishuTenantConfigService,
  ) {}

  /**
   * 为指定组织创建飞书多维表格 + 数据表，并保存配置
   * @param orgCode 组织编码
   * @param orgName 组织名称（用于飞书表格标题）
   */
  async provision(orgCode: string, orgName: string): Promise<FeishuTenantConfig> {
    if (!orgCode?.trim() || !orgName?.trim()) {
      throw new BadRequestException('组织编码和组织名称不能为空');
    }
    const existing = await this.configService.getConfig(orgCode);
    if (existing?.bitableAppToken) {
      throw new BadRequestException('当前组织已经绑定飞书表格。请使用现有连接，或先在高级设置中解绑后再新建');
    }
    const token = await this.auth.getAccessToken();
    const client = axios.create({
      baseURL: FEISHU_API_BASE,
      timeout: SYNC_CONFIG.REQUEST_TIMEOUT_MS,
      headers: { Authorization: `Bearer ${token}` },
    });

    // 1. 创建多维表格
    this.logger.log(`为组织 ${orgCode} 创建飞书多维表格...`);
    const bitableResp = await client.post('/bitable/v1/apps', {
      name: `热处理｜${orgName}｜${orgCode}`,
      folder_token: '', // 创建在根目录
    });

    if (bitableResp.data.code !== 0) {
      throw new Error(`创建多维表格失败：${bitableResp.data.msg}`);
    }

    const appToken = bitableResp.data.data?.app?.app_token;
    if (!appToken) throw new Error('飞书创建多维表格响应缺少 app_token');
    const baseUrl = bitableResp.data.data.app.url || `https://feishu.cn/base/${appToken}`;
    this.logger.log(`多维表格创建成功：${appToken}`);

    // 2. 默认只创建每天实际使用的五张核心表。质检和工艺属于按需扩展，
    // 未开通对应模块时不制造长期空白入口。
    const tableIds = await this.createTables(client, appToken, false);
    await this.removeDefaultTable(client, appToken, new Set(Object.values(tableIds)));

    // 3. 保存到数据库
    const config: FeishuTenantConfig = {
      orgCode,
      bitableAppToken: appToken,
      baseUrl,
      isActive: true,
      tableInbound: tableIds.inbound,
      tableOutbound: tableIds.outbound,
      tableInventory: tableIds.inventory,
      tableCustomer: tableIds.customer,
      tableReconciliation: tableIds.reconciliation,
      tableQuality: tableIds.quality || '',
      tableProcess: tableIds.process || '',
    };

    await this.configService.saveConfig(orgCode, {
      bitableAppToken: config.bitableAppToken,
      baseUrl: config.baseUrl,
      isActive: true,
      tableInbound: config.tableInbound,
      tableOutbound: config.tableOutbound,
      tableInventory: config.tableInventory,
      tableCustomer: config.tableCustomer,
      tableReconciliation: config.tableReconciliation,
      tableQuality: config.tableQuality,
      tableProcess: config.tableProcess,
    });

    this.logger.log(`组织 ${orgCode} 飞书配置已保存`);
    return config;
  }

  /**
   * 创建核心业务表并返回各表 ID。任意表或字段创建失败都终止开通，
   * 避免把不完整配置标记为已启用，随后所有业务同步持续失败。
   */
  private async createTables(
    client: any,
    appToken: string,
    includeExtensions = false,
  ): Promise<Record<string, string>> {
    const tables: Array<{
      key: string;
      name: string;
      fields: Array<{ field_name: string; type: number }>;
    }> = [
      {
        key: 'inbound',
        name: '01 来货登记',
        fields: [
          { field_name: FIELD_NAMES.inbound.orderId, type: 1 },
          { field_name: FIELD_NAMES.inbound.customerName, type: 1 },
          { field_name: FIELD_NAMES.inbound.productName, type: 1 },
          { field_name: FIELD_NAMES.inbound.quantity, type: 2 },
          { field_name: FIELD_NAMES.inbound.weight, type: 2 },
          { field_name: FIELD_NAMES.inbound.createdAt, type: 5 },
          { field_name: FIELD_NAMES.inbound.createdBy, type: 1 },
          { field_name: FIELD_NAMES.inbound.status, type: 3 },
          { field_name: FIELD_NAMES.inbound.attachments, type: 17 },
        ],
      },
      {
        key: 'outbound',
        name: '02 发货记录',
        fields: [
          { field_name: FIELD_NAMES.outbound.orderId, type: 1 },
          { field_name: FIELD_NAMES.outbound.customerName, type: 1 },
          { field_name: FIELD_NAMES.outbound.productName, type: 1 },
          { field_name: FIELD_NAMES.outbound.quantity, type: 2 },
          { field_name: FIELD_NAMES.outbound.weight, type: 2 },
          { field_name: FIELD_NAMES.outbound.batchNo, type: 1 },
          { field_name: FIELD_NAMES.outbound.createdAt, type: 5 },
          { field_name: FIELD_NAMES.outbound.status, type: 3 },
        ],
      },
      {
        key: 'inventory',
        name: '03 库存快照',
        fields: [
          { field_name: FIELD_NAMES.inventory.productName, type: 1 },
          { field_name: FIELD_NAMES.inventory.material, type: 1 },
          { field_name: FIELD_NAMES.inventory.currentStock, type: 2 },
          { field_name: FIELD_NAMES.inventory.unit, type: 1 },
          { field_name: FIELD_NAMES.inventory.location, type: 1 },
          { field_name: FIELD_NAMES.inventory.batchNo, type: 1 },
          { field_name: FIELD_NAMES.inventory.inboundDate, type: 5 },
        ],
      },
      {
        key: 'customer',
        name: '04 客户总览',
        fields: [
          { field_name: FIELD_NAMES.customer.code, type: 1 },
          { field_name: FIELD_NAMES.customer.name, type: 1 },
          { field_name: FIELD_NAMES.customer.contact, type: 1 },
          { field_name: FIELD_NAMES.customer.phone, type: 1 },
          { field_name: FIELD_NAMES.customer.address, type: 1 },
          { field_name: FIELD_NAMES.customer.totalInbound, type: 2 },
          { field_name: FIELD_NAMES.customer.totalOutbound, type: 2 },
          { field_name: FIELD_NAMES.customer.paymentRate, type: 6 },
          { field_name: FIELD_NAMES.customer.lastTradeDate, type: 5 },
        ],
      },
      {
        key: 'reconciliation',
        name: '05 对账与回款',
        fields: [
          { field_name: FIELD_NAMES.reconciliation.orderId, type: 1 },
          { field_name: FIELD_NAMES.reconciliation.date, type: 5 },
          { field_name: FIELD_NAMES.reconciliation.customerName, type: 1 },
          { field_name: FIELD_NAMES.reconciliation.outboundAmount, type: 2 },
          { field_name: FIELD_NAMES.reconciliation.invoicedAmount, type: 2 },
          { field_name: FIELD_NAMES.reconciliation.receivedAmount, type: 2 },
          { field_name: FIELD_NAMES.reconciliation.paymentStatus, type: 3 },
        ],
      },
      {
        key: 'quality',
        name: '06 质检记录',
        fields: [
          { field_name: FIELD_NAMES.quality.batchNo, type: 1 },
          { field_name: FIELD_NAMES.quality.productName, type: 1 },
          { field_name: FIELD_NAMES.quality.customerName, type: 1 },
          { field_name: FIELD_NAMES.quality.inspectDate, type: 5 },
          { field_name: FIELD_NAMES.quality.inspectItem, type: 3 },
          { field_name: FIELD_NAMES.quality.inspectResult, type: 1 },
          { field_name: FIELD_NAMES.quality.verdict, type: 3 },
          { field_name: FIELD_NAMES.quality.inspector, type: 1 },
          { field_name: FIELD_NAMES.quality.remark, type: 1 },
        ],
      },
      {
        key: 'process',
        name: '07 工艺参数',
        fields: [
          { field_name: FIELD_NAMES.process.batchNo, type: 1 },
          { field_name: FIELD_NAMES.process.productName, type: 1 },
          { field_name: FIELD_NAMES.process.customerName, type: 1 },
          { field_name: FIELD_NAMES.process.processType, type: 3 },
          { field_name: FIELD_NAMES.process.heatTemp, type: 2 },
          { field_name: FIELD_NAMES.process.holdTime, type: 2 },
          { field_name: FIELD_NAMES.process.coolMethod, type: 1 },
          { field_name: FIELD_NAMES.process.chargeWeight, type: 2 },
          { field_name: FIELD_NAMES.process.operator, type: 1 },
          { field_name: FIELD_NAMES.process.operateTime, type: 5 },
          { field_name: FIELD_NAMES.process.remark, type: 1 },
        ],
      },
    ];

    const result: Record<string, string> = {};

    for (const table of tables.filter(table => includeExtensions || !['quality', 'process'].includes(table.key))) {
      const fields = table.fields.map(f => ({
        field_name: f.field_name,
        type: f.type,
        ui_type: f.type === 1 ? 'Text'
          : f.type === 2 ? 'Number'
          : f.type === 3 ? 'SingleSelect'
          : f.type === 5 ? 'DateTime'
          : f.type === 6 ? 'Progress'
          : f.type === 17 ? 'Attachment' : 'Text',
      }));

      const resp = await client.post(`/bitable/v1/apps/${appToken}/tables`, {
        table: { name: table.name },
        fields: fields.slice(0, 0), // 先创建空表头
      });

      if (resp.data.code !== 0) {
        throw new Error(`创建表 ${table.name} 失败：${resp.data.msg || resp.data.code}`);
      }

      const tableId = resp.data.data?.table_id;
      if (!tableId) throw new Error(`创建表 ${table.name} 响应缺少 table_id`);

      // 再加字段（先创建再添加字段更可靠）
      if (fields.length > 0) {
        const fieldResp = await client.post(`/bitable/v1/apps/${appToken}/tables/${tableId}/fields/batch_create`, {
          fields,
        });
        if (fieldResp.data.code !== 0) {
          throw new Error(`创建表 ${table.name} 的字段失败：${fieldResp.data.msg || fieldResp.data.code}`);
        }
      }

      result[table.key] = tableId;
      this.logger.log(`表 ${table.name} 创建成功：${tableId}`);
    }

    return result;
  }

  /**
   * 飞书新建多维表格时会附带一张空白“数据表”。业务表全部创建成功后清理它，
   * 避免用户进入后看到无用途的第八张表。清理失败不影响已经可用的业务表。
   */
  private async removeDefaultTable(client: any, appToken: string, businessTableIds: Set<string>): Promise<void> {
    try {
      const response = await client.get(`/bitable/v1/apps/${appToken}/tables`, { params: { page_size: 100 } });
      if (response.data.code !== 0) throw new Error(response.data.msg || String(response.data.code));
      const defaults = (response.data.data?.items || []).filter((table: any) =>
        !businessTableIds.has(table.table_id) && ['数据表', 'Table'].includes(String(table.name || '').trim()),
      );
      for (const table of defaults) {
        const deleted = await client.delete(`/bitable/v1/apps/${appToken}/tables/${table.table_id}`);
        if (deleted.data.code !== 0) throw new Error(deleted.data.msg || String(deleted.data.code));
        this.logger.log(`已清理默认空白表：${table.table_id}`);
      }
    } catch (error: any) {
      this.logger.warn(`清理飞书默认空白表失败，不影响业务表使用：${error.message}`);
    }
  }
}

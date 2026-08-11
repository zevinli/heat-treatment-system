import { BadRequestException, Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { organization } from '../../database/schema';

/**
 * 租户级飞书多维表格配置
 */
export interface FeishuTenantConfig {
  /** 组织编码 */
  orgCode: string;
  /** 多维表格 App Token */
  bitableAppToken: string;
  /** 可直接访问的多维表格基础地址（企业域名或飞书返回 URL） */
  baseUrl: string;
  /** 是否激活 */
  isActive: boolean;
  /** 各数据表 ID */
  tableInbound: string;
  tableOutbound: string;
  tableInventory: string;
  tableCustomer: string;
  tableReconciliation: string;
  tableQuality: string;
  tableProcess: string;
}

@Injectable()
export class FeishuTenantConfigService {
  private readonly logger = new Logger(FeishuTenantConfigService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  /** 获取指定组织的飞书配置 */
  async getConfig(orgCode: string): Promise<FeishuTenantConfig | null> {
    const rows = await this.db
      .select({ feishuConfig: organization.feishuConfig, code: organization.code })
      .from(organization)
      .where(eq(organization.code, orgCode))
      .limit(1);

    if (!rows[0]?.feishuConfig) return null;

    const config = rows[0].feishuConfig as any;
    return {
      orgCode: rows[0].code,
      bitableAppToken: config.bitableAppToken || '',
      baseUrl: config.baseUrl || '',
      isActive: config.isActive ?? false,
      tableInbound: config.tableInbound || '',
      tableOutbound: config.tableOutbound || '',
      tableInventory: config.tableInventory || '',
      tableCustomer: config.tableCustomer || '',
      tableReconciliation: config.tableReconciliation || '',
      tableQuality: config.tableQuality || '',
      tableProcess: config.tableProcess || '',
    };
  }

  /** 获取所有已激活飞书的组织配置 */
  async getAllActiveConfigs(): Promise<FeishuTenantConfig[]> {
    try {
      const rows = await this.db
        .select({ feishuConfig: organization.feishuConfig, code: organization.code })
        .from(organization)
        .where(eq(organization.isActive, true));

      const configs: FeishuTenantConfig[] = [];
      for (const row of rows) {
        const cfg = row.feishuConfig as any;
        if (cfg?.isActive && cfg?.bitableAppToken) {
          configs.push({
            orgCode: row.code,
            bitableAppToken: cfg.bitableAppToken,
            baseUrl: cfg.baseUrl || '',
            isActive: true,
            tableInbound: cfg.tableInbound || '',
            tableOutbound: cfg.tableOutbound || '',
            tableInventory: cfg.tableInventory || '',
            tableCustomer: cfg.tableCustomer || '',
            tableReconciliation: cfg.tableReconciliation || '',
            tableQuality: cfg.tableQuality || '',
            tableProcess: cfg.tableProcess || '',
          });
        }
      }
      return configs;
    } catch (error: any) {
      this.logger.error(`读取所有组织飞书配置失败：${error.message}`);
      return [];
    }
  }

  /** 保存或更新组织的飞书配置 */
  async saveConfig(orgCode: string, config: Partial<Omit<FeishuTenantConfig, 'orgCode'>>): Promise<void> {
    const existing = await this.getConfig(orgCode);
    const text = (value: unknown, fallback = '') => typeof value === 'string' ? value.trim() : fallback;
    const merged: Omit<FeishuTenantConfig, 'orgCode'> = {
      bitableAppToken: text(config.bitableAppToken, existing?.bitableAppToken),
      baseUrl: text(config.baseUrl, existing?.baseUrl),
      isActive: config.isActive ?? existing?.isActive ?? false,
      tableInbound: text(config.tableInbound, existing?.tableInbound),
      tableOutbound: text(config.tableOutbound, existing?.tableOutbound),
      tableInventory: text(config.tableInventory, existing?.tableInventory),
      tableCustomer: text(config.tableCustomer, existing?.tableCustomer),
      tableReconciliation: text(config.tableReconciliation, existing?.tableReconciliation),
      tableQuality: text(config.tableQuality, existing?.tableQuality),
      tableProcess: text(config.tableProcess, existing?.tableProcess),
    };
    if (merged.baseUrl && !/^https:\/\//i.test(merged.baseUrl)) throw new BadRequestException('飞书访问地址必须使用 https://');
    const identifiers = [merged.bitableAppToken, merged.tableInbound, merged.tableOutbound, merged.tableInventory,
      merged.tableCustomer, merged.tableReconciliation, merged.tableQuality, merged.tableProcess].filter(Boolean);
    if (identifiers.some(value => !/^[A-Za-z0-9_-]{3,255}$/.test(value))) {
      throw new BadRequestException('App Token 或数据表 ID 格式不正确');
    }
    if (merged.isActive && (!merged.bitableAppToken || !merged.tableInbound || !merged.tableOutbound || !merged.tableInventory || !merged.tableCustomer || !merged.tableReconciliation)) {
      throw new BadRequestException('启用飞书同步前必须填写 App Token 和五个业务表 ID');
    }
    const [updated] = await this.db
      .update(organization)
      .set({ feishuConfig: merged as any })
      .where(eq(organization.code, orgCode))
      .returning({ id: organization.id });
    if (!updated) throw new NotFoundException('组织不存在');
  }
}

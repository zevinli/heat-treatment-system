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
    try {
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
        isActive: config.isActive ?? false,
        tableInbound: config.tableInbound || '',
        tableOutbound: config.tableOutbound || '',
        tableInventory: config.tableInventory || '',
        tableCustomer: config.tableCustomer || '',
        tableReconciliation: config.tableReconciliation || '',
        tableQuality: config.tableQuality || '',
        tableProcess: config.tableProcess || '',
      };
    } catch (error: any) {
      this.logger.warn(`读取组织 ${orgCode} 飞书配置失败：${error.message}`);
      return null;
    }
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
    const merged = {
      ...(existing || {}),
      ...config,
      isActive: config.isActive ?? existing?.isActive ?? false,
    };
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

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { FeishuAuthService } from './feishu-auth.service';
import { FeishuTenantConfigService } from './feishu-tenant-config.service';
import { SYNC_CONFIG } from './constants';
import { TenantConnectionService } from '../tenant/tenant-connection.service';
import { BitableSyncService } from './bitable-sync.service';
import { productTable } from '../../database/schema';
import { isNull } from 'drizzle-orm';

/**
 * 多租户库存定时同步调度器
 * 遍历所有开通了飞书配置的组织，逐一同步库存快照到各自的多维表格
 */
@Injectable()
export class FeishuSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FeishuSchedulerService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly auth: FeishuAuthService,
    private readonly configService: FeishuTenantConfigService,
    private readonly tenantConnections: TenantConnectionService,
    private readonly sync: BitableSyncService,
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
  }

  private start() {
    const interval = SYNC_CONFIG.INVENTORY_SYNC_INTERVAL_MS;
    this.logger.log(`多租户库存调度已启动（${interval / 1000}s 间隔）`);
    this.runSync();
    this.timer = setInterval(() => this.runSync(), interval);
  }

  private async runSync() {
    try {
      const configs = await this.configService.getAllActiveConfigs();
      this.logger.log(`扫描到 ${configs.length} 个组织开通了飞书`);

      for (const config of configs) {
        try {
          const db = await this.tenantConnections.getTenantDb(config.orgCode);
          const products = await db.select({
            productName: productTable.name,
            material: productTable.material,
            currentStock: productTable.stock,
            unit: productTable.unit,
            batchNo: productTable.batchNo,
            inboundDate: productTable.inboundDate,
          }).from(productTable).where(isNull(productTable.deletedAt));
          const result = await this.sync.syncInventoryFull(products.map(item => ({
            productName: item.productName,
            material: item.material || '',
            currentStock: item.currentStock || 0,
            unit: item.unit || '件',
            location: '默认库位',
            batchNo: item.batchNo || '',
            inboundDate: item.inboundDate?.toISOString() || '',
          })), config.orgCode);
          this.logger.log(`[${config.orgCode}] 飞书库存同步完成，共 ${result.affected} 条`);
        } catch (error: any) {
          this.logger.error(`[${config.orgCode}] 飞书库存同步失败：${error.message}`);
        }
      }
    } catch (error: any) {
      this.logger.error(`库存调度异常：${error.message}`);
    }
  }
}

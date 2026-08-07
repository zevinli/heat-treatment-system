import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { FeishuAuthService } from './feishu-auth.service';
import { FeishuTenantConfigService } from './feishu-tenant-config.service';
import { SYNC_CONFIG } from './constants';

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
        this.logger.log(`[${config.orgCode}] 库存/质检/工艺同步待接入（需 DB 查询租户数据）`);
        // 质检表同步: quality_inspection 表 → 飞书质检记录表
        // 工艺表同步: product_batch 表 → 飞书工艺参数表
        // 注意：此处需通过 TenantConnectionService 获取租户 DB 才能查库存
        // 当前版本先记录日志，完整实现需注入 TenantConnectionService
      }
    } catch (error: any) {
      this.logger.error(`库存调度异常：${error.message}`);
    }
  }
}

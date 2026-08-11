import { Module } from '@nestjs/common';
import { FeishuController } from './feishu.controller';
import { FeishuAuthService } from './feishu-auth.service';
import { FeishuTenantConfigService } from './feishu-tenant-config.service';
import { BitableSyncService } from './bitable-sync.service';
import { FeishuSchedulerService } from './feishu-scheduler.service';
import { FeishuProvisioningService } from './feishu-provisioning.service';
import { FeishuOutboxService } from './feishu-outbox.service';

@Module({
  controllers: [FeishuController],
  providers: [
    FeishuAuthService,
    FeishuTenantConfigService,
    BitableSyncService,
    FeishuSchedulerService,
    FeishuProvisioningService,
    FeishuOutboxService,
  ],
  exports: [BitableSyncService, FeishuTenantConfigService, FeishuProvisioningService, FeishuOutboxService],
})
export class FeishuModule {}

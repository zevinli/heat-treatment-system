import { Controller, Post, Get, Body, Param, Logger, ForbiddenException } from '@nestjs/common';
import { CanRole, NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { FeishuAuthService } from './feishu-auth.service';
import { FeishuTenantConfigService } from './feishu-tenant-config.service';
import { FeishuProvisioningService } from './feishu-provisioning.service';
import { getCurrentTenantContext } from '../../common/tenant-context.storage';
import { CurrentTenantDb } from '../../common/decorators/tenant.decorator';
import { FeishuOutboxService } from './feishu-outbox.service';
import { BitableSyncService } from './bitable-sync.service';

@Controller('api/integration/feishu')
export class FeishuController {
  private readonly logger = new Logger(FeishuController.name);

  constructor(
    private readonly auth: FeishuAuthService,
    private readonly configService: FeishuTenantConfigService,
    private readonly provisioningService: FeishuProvisioningService,
    private readonly outboxService: FeishuOutboxService,
    private readonly bitableSyncService: BitableSyncService,
  ) {}

  private assertCurrentOrg(orgCode: string) {
    const tenant = getCurrentTenantContext();
    if (!tenant || tenant.orgCode !== orgCode) {
      throw new ForbiddenException('只能管理当前组织的飞书配置');
    }
  }

  /** 检查飞书全局配置状态 */
  @Get('status')
  async getStatus() {
    return {
      configured: this.auth.isConfigured(),
      appId: process.env.FEISHU_APP_ID ? '已配置' : '未配置',
    };
  }

  /** 当前租户可访问的飞书表链接配置。只读取当前租户，禁止客户端硬编码或跨租户取表。 */
  @NeedLogin()
  @Get('current/tables')
  async getCurrentTables(@CurrentTenantDb() db: any) {
    const tenant = getCurrentTenantContext();
    if (!tenant) throw new ForbiddenException('请先选择组织');
    const config = await this.configService.getConfig(tenant.orgCode);
    if (!config?.isActive || !config.bitableAppToken) {
      return {
        configured: false,
        orgCode: tenant.orgCode,
        tables: {},
        syncQueue: db ? await this.outboxService.getSummary(db) : undefined,
      };
    }
    const baseUrl = config.baseUrl || `https://feishu.cn/base/${config.bitableAppToken}`;
    return {
      configured: true,
      orgCode: tenant.orgCode,
      baseUrl,
      tables: {
        inbound: config.tableInbound,
        outbound: config.tableOutbound,
        inventory: config.tableInventory,
        customer: config.tableCustomer,
        reconciliation: config.tableReconciliation,
        quality: config.tableQuality,
        process: config.tableProcess,
      },
      syncQueue: db ? await this.outboxService.getSummary(db) : undefined,
    };
  }

  /** 管理员手动立即重试当前租户失败的同步任务。 */
  @NeedLogin()
  @CanRole('system:permission')
  @Post('current/retry-failed')
  async retryFailed(@CurrentTenantDb() db: any) {
    if (!db) throw new ForbiddenException('请先选择组织');
    return { retried: await this.outboxService.retryFailed(db) };
  }

  @NeedLogin()
  @CanRole('system:permission')
  @Get('current/validate')
  async validateCurrent() {
    const tenant = getCurrentTenantContext();
    if (!tenant) throw new ForbiddenException('请先选择组织');
    return this.bitableSyncService.validateTenantConfig(tenant.orgCode);
  }

  /** 在不清空既有数据的前提下，为当前组织的七张表补齐同步所需字段。 */
  @NeedLogin()
  @CanRole('system:permission')
  @Post('current/repair-fields')
  async repairCurrentFields() {
    const tenant = getCurrentTenantContext();
    if (!tenant) throw new ForbiddenException('请先选择组织');
    return this.bitableSyncService.repairTenantFields(tenant.orgCode);
  }

  /** 查询指定组织的飞书配置 */
  @NeedLogin()
  @CanRole('system:permission')
  @Get('org/:orgCode/config')
  async getOrgConfig(@Param('orgCode') orgCode: string) {
    this.assertCurrentOrg(orgCode);
    const config = await this.configService.getConfig(orgCode);
    return { orgCode, config, configured: config?.isActive || false };
  }

  /** 保存指定组织的飞书配置（手动配置） */
  @NeedLogin()
  @CanRole('system:permission')
  @Post('org/:orgCode/config')
  async saveOrgConfig(
    @Param('orgCode') orgCode: string,
    @Body() body: any,
  ) {
    this.assertCurrentOrg(orgCode);
    await this.configService.saveConfig(orgCode, body);
    return { success: true };
  }

  /** 自动开通：为指定组织创建飞书多维表格 + 数据表 */
  @NeedLogin()
  @CanRole('system:permission')
  @Post('org/:orgCode/provision')
  async provisionOrg(
    @Param('orgCode') orgCode: string,
    @Body() body: { orgName: string },
  ) {
    this.assertCurrentOrg(orgCode);
    const config = await this.provisioningService.provision(orgCode, body.orgName);
    return { success: true, config };
  }

  /** 列出所有已激活飞书的组织 */
  @NeedLogin()
  @CanRole('system:permission')
  @Get('orgs')
  async listActiveOrgs() {
    const configs = await this.configService.getAllActiveConfigs();
    return { orgs: configs.map(c => c.orgCode), total: configs.length };
  }
}

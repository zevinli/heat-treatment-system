import { BadRequestException, Controller, Post, Get, Body, Param, Logger, ForbiddenException } from '@nestjs/common';
import { CanRole, NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { FeishuAuthService } from './feishu-auth.service';
import { FeishuTenantConfigService } from './feishu-tenant-config.service';
import { FeishuProvisioningService } from './feishu-provisioning.service';
import { getCurrentTenantContext } from '../../common/tenant-context.storage';
import { CurrentTenantDb } from '../../common/decorators/tenant.decorator';
import { FeishuOutboxService } from './feishu-outbox.service';
import { BitableSyncService } from './bitable-sync.service';
import { FeishuBackfillService, type BackfillScope } from './feishu-backfill.service';

@Controller('api/integration/feishu')
export class FeishuController {
  private readonly logger = new Logger(FeishuController.name);

  constructor(
    private readonly auth: FeishuAuthService,
    private readonly configService: FeishuTenantConfigService,
    private readonly provisioningService: FeishuProvisioningService,
    private readonly outboxService: FeishuOutboxService,
    private readonly bitableSyncService: BitableSyncService,
    private readonly backfillService: FeishuBackfillService,
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
    const [syncQueue, recentJobs] = db
      ? await Promise.all([this.outboxService.getSummary(db), this.outboxService.getRecent(db, 50)])
      : [undefined, []];
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
      syncQueue,
      lastSyncedAt: recentJobs.find((job: any) => job.status === 'completed')?.completedAt || null,
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

  /** 当前租户最近的同步任务，供管理员定位失败原因。 */
  @NeedLogin()
  @CanRole('system:permission')
  @Get('current/jobs')
  async currentJobs(@CurrentTenantDb() db: any) {
    if (!db) throw new ForbiddenException('请先选择组织');
    return { items: await this.outboxService.getRecent(db) };
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

  /** 粘贴一个飞书链接即可自动识别其中的业务表。 */
  @NeedLogin()
  @CanRole('system:permission')
  @Post('current/discover')
  async discoverCurrent(@Body() body: { url?: string; appToken?: string }) {
    const tenant = getCurrentTenantContext();
    if (!tenant) throw new ForbiddenException('请先选择组织');
    return this.bitableSyncService.discoverTables(body?.url || body?.appToken || '');
  }

  /** 首次连接或换表后，按管理员选择的范围补齐历史业务数据。 */
  @NeedLogin()
  @CanRole('system:permission')
  @Post('current/backfill')
  async backfillCurrent(
    @CurrentTenantDb() db: any,
    @Body() body: { scope?: BackfillScope },
  ) {
    const tenant = getCurrentTenantContext();
    if (!tenant || !db) throw new ForbiddenException('请先选择组织');
    return this.backfillService.enqueue(tenant.orgCode, db, body?.scope || '90d');
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
    const existing = await this.configService.getConfig(orgCode);
    const identityKeys = ['bitableAppToken', 'tableInbound', 'tableOutbound', 'tableInventory', 'tableCustomer', 'tableReconciliation', 'tableQuality', 'tableProcess'] as const;
    const bindingChanged = identityKeys.some(key =>
      String(body?.[key] ?? '') !== String(existing?.[key] ?? ''),
    );
    await this.configService.saveConfig(orgCode, body);
    if (body?.isActive && (!existing?.isActive || bindingChanged)) {
      const validation = await this.bitableSyncService.validateTenantConfig(orgCode);
      if (!validation.valid) {
        // 新连接校验失败时保持停用；修改既有连接失败时恢复原配置，避免一次误填
        // 让原本正常运行的同步立即中断。
        if (existing) await this.configService.saveConfig(orgCode, existing);
        else await this.configService.saveConfig(orgCode, { ...body, isActive: false });
        const details = Object.entries(validation.tables || {})
          .filter(([, result]: any) => !result.valid)
          .map(([key, result]: any) => `${key}${result.error ? `：${result.error}` : result.missingFields?.length ? `缺少字段 ${result.missingFields.join('、')}` : '字段类型不正确'}`)
          .join('；');
        throw new BadRequestException(`飞书表结构校验未通过，未启用同步：${validation.error || details || '请检查表格权限和字段'}`);
      }
    }
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

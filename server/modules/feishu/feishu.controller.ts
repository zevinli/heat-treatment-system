import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { FeishuAuthService } from './feishu-auth.service';
import { FeishuTenantConfigService } from './feishu-tenant-config.service';
import { FeishuProvisioningService } from './feishu-provisioning.service';

@Controller('api/integration/feishu')
export class FeishuController {
  private readonly logger = new Logger(FeishuController.name);

  constructor(
    private readonly auth: FeishuAuthService,
    private readonly configService: FeishuTenantConfigService,
    private readonly provisioningService: FeishuProvisioningService,
  ) {}

  /** 检查飞书全局配置状态 */
  @Get('status')
  async getStatus() {
    return {
      configured: this.auth.isConfigured(),
      appId: process.env.FEISHU_APP_ID ? '已配置' : '未配置',
    };
  }

  /** 查询指定组织的飞书配置 */
  @NeedLogin()
  @Get('org/:orgCode/config')
  async getOrgConfig(@Param('orgCode') orgCode: string) {
    const config = await this.configService.getConfig(orgCode);
    return { orgCode, config, configured: config?.isActive || false };
  }

  /** 保存指定组织的飞书配置（手动配置） */
  @NeedLogin()
  @Post('org/:orgCode/config')
  async saveOrgConfig(
    @Param('orgCode') orgCode: string,
    @Body() body: any,
  ) {
    await this.configService.saveConfig(orgCode, body);
    return { success: true };
  }

  /** 自动开通：为指定组织创建飞书多维表格 + 数据表 */
  @NeedLogin()
  @Post('org/:orgCode/provision')
  async provisionOrg(
    @Param('orgCode') orgCode: string,
    @Body() body: { orgName: string },
  ) {
    const config = await this.provisioningService.provision(orgCode, body.orgName);
    return { success: true, config };
  }

  /** 列出所有已激活飞书的组织 */
  @NeedLogin()
  @Get('orgs')
  async listActiveOrgs() {
    const configs = await this.configService.getAllActiveConfigs();
    return { orgs: configs.map(c => c.orgCode), total: configs.length };
  }
}

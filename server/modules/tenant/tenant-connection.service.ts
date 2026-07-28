import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
// eslint-disable-next-line import/no-extraneous-dependencies
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import type * as tenantSchema from '../../database/schema';
import { organization } from '../../database/schema';

interface OrganizationConfig {
  id: string;
  code: string;
  dbName: string;
  dbHost: string | null;
  dbPort: number | null;
  dbUser: string | null;
  dbPassword: string | null;
}

/**
 * 租户数据库连接服务
 * 管理每个租户的数据库连接池
 */
@Injectable()
export class TenantConnectionService {
  private readonly logger = new Logger(TenantConnectionService.name);
  private connections: Map<string, unknown> = new Map();
  private configs: Map<string, OrganizationConfig> = new Map();

  constructor() {
    this.logger.log('TenantConnectionService initialized');
  }

  /**
   * 获取租户数据库连接
   * @param orgCode 组织编码
   * @param masterDb 主数据库连接（用于查询租户配置）
   * @returns 租户数据库连接
   */
  async getTenantDb(
    orgCode: string,
    masterDb: any,
  ): Promise<unknown> {
    // 1. 从缓存获取连接
    const cachedDb = this.connections.get(orgCode);
    if (cachedDb) {
      return cachedDb;
    }

    // 2. 从主库查询租户数据库配置
    const orgConfig = await this.getOrganizationConfig(orgCode, masterDb);
    if (!orgConfig) {
      throw new Error(`Organization '${orgCode}' not found`);
    }

    // 3. 创建新的数据库连接
    const db = await this.createTenantConnection(orgConfig);

    // 4. 缓存连接
    this.connections.set(orgCode, db);
    this.configs.set(orgCode, orgConfig);

    this.logger.log(`Created tenant database connection for: ${orgCode}`);
    return db;
  }

  /**
   * 获取组织配置（带缓存）
   */
  private async getOrganizationConfig(
    orgCode: string,
    masterDb: any,
  ): Promise<OrganizationConfig | null> {
    // 先检查缓存
    const cachedConfig = this.configs.get(orgCode);
    if (cachedConfig) {
      return cachedConfig;
    }

    // 从数据库查询
    const result = await masterDb
      .select({
        id: organization.id,
        code: organization.code,
        dbName: organization.dbName,
        dbHost: organization.dbHost,
        dbPort: organization.dbPort,
        dbUser: organization.dbUser,
        dbPassword: organization.dbPassword,
      })
      .from(organization)
      .where(eq(organization.code, orgCode))
      .limit(1);

    if (!result[0]) {
      return null;
    }

    // 验证配置完整性
    if (!result[0].dbHost || !result[0].dbUser || !result[0].dbPassword) {
      throw new Error(`Incomplete database configuration for organization: ${orgCode}`);
    }

    return {
      id: result[0].id,
      code: result[0].code,
      dbName: result[0].dbName,
      dbHost: result[0].dbHost,
      dbPort: result[0].dbPort || 5432,
      dbUser: result[0].dbUser,
      dbPassword: result[0].dbPassword,
    };
  }

  /**
   * 创建租户数据库连接
   */
  private async createTenantConnection(
    config: OrganizationConfig,
  ): Promise<unknown> {
    const connectionString = `postgres://${config.dbUser}:${config.dbPassword}@${config.dbHost}:${config.dbPort}/${config.dbName}`;

    try {
      const client = postgres(connectionString, {
        max: 10, // 连接池大小
        idle_timeout: 20, // 空闲超时(秒)
        connect_timeout: 10, // 连接超时(秒)
      });

      const db = drizzle(client, { schema: {} as typeof tenantSchema });

      // 测试连接
      await client`SELECT 1`;

      return db;
    } catch (error) {
      this.logger.error(
        `Failed to connect to tenant database: ${config.dbName}`,
        error instanceof Error ? error.message : String(error),
      );
      throw new Error(`Failed to connect to tenant database: ${config.dbName}`);
    }
  }

  /**
   * 清理指定租户的连接（用于配置变更后刷新）
   */
  clearConnection(orgCode: string): void {
    this.connections.delete(orgCode);
    this.configs.delete(orgCode);
    this.logger.log(`Cleared tenant connection for: ${orgCode}`);
  }

  /**
   * 获取所有缓存的连接数
   */
  getCachedConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * 获取已缓存的组织编码列表
   */
  getCachedOrganizations(): string[] {
    return Array.from(this.connections.keys());
  }
}

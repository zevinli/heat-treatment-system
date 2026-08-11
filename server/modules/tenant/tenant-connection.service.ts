import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { DRIZZLE_DATABASE } from '@lark-apaas/fullstack-nestjs-core';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import type * as tenantSchema from '../../database/schema';
import { organization } from '../../database/schema';
import { initializeDatabase } from '../../scripts/init-db';

export interface OrganizationConfig {
  id: string;
  code: string;
  dbName: string;
  dbHost: string | null;
  dbPort: number | null;
  dbUser: string | null;
  dbPassword: string | null;
}

type TenantClient = ReturnType<typeof postgres> | PGlite;

/**
 * 租户数据库连接服务
 * 管理每个租户的数据库连接池
 */
@Injectable()
export class TenantConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantConnectionService.name);
  private connections: Map<string, any> = new Map();
  private clients: Map<string, TenantClient> = new Map();
  private configs: Map<string, OrganizationConfig> = new Map();
  /** 同一租户首次访问时复用正在创建的连接，避免页面并发请求重复初始化数据库。 */
  private pendingConnections: Map<string, Promise<any>> = new Map();

  constructor(@Inject(DRIZZLE_DATABASE) private readonly masterDb: any) {
    this.logger.log('TenantConnectionService initialized');
  }

  async onModuleDestroy() {
    await Promise.allSettled(Array.from(this.pendingConnections.values()));
    await Promise.allSettled(Array.from(this.clients.values()).map(client => this.closeClient(client)));
    this.pendingConnections.clear();
    this.clients.clear();
    this.connections.clear();
    this.configs.clear();
  }

  /**
   * 获取租户数据库连接
   * @param orgCode 组织编码
   * @param masterDb 主数据库连接（用于查询租户配置）
   * @returns 租户数据库连接
   */
  async getTenantDb(
    orgCode: string,
    masterDb: any = this.masterDb,
  ): Promise<any> {
    // 1. 从缓存获取连接
    const cachedDb = this.connections.get(orgCode);
    if (cachedDb) {
      return cachedDb;
    }

    const pendingDb = this.pendingConnections.get(orgCode);
    if (pendingDb) return pendingDb;

    const creation = this.createAndCacheTenantConnection(orgCode, masterDb);
    this.pendingConnections.set(orgCode, creation);
    try {
      return await creation;
    } finally {
      if (this.pendingConnections.get(orgCode) === creation) {
        this.pendingConnections.delete(orgCode);
      }
    }
  }

  private async createAndCacheTenantConnection(orgCode: string, masterDb: any): Promise<any> {
    // 创建期间再次检查缓存，兼容清理/热更新边界。
    const cachedDb = this.connections.get(orgCode);
    if (cachedDb) return cachedDb;

    // 2. 从主库查询租户数据库配置
    const orgConfig = await this.getOrganizationConfig(orgCode, masterDb);
    if (!orgConfig) {
      throw new Error(`Organization '${orgCode}' not found`);
    }

    // 3. 创建新的数据库连接
    const { db, client } = await this.createTenantConnection(orgConfig);

    // 4. 缓存连接
    this.connections.set(orgCode, db);
    this.clients.set(orgCode, client);
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
    if ((!result[0].dbHost || !result[0].dbUser || !result[0].dbPassword) && process.env.NODE_ENV === 'production') {
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
  ): Promise<{ db: any; client: TenantClient }> {
    if (!config.dbHost || !config.dbUser || !config.dbPassword) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Incomplete database configuration for organization: ${config.code}`);
      }
      const dataDir = this.localTenantDataDir(config.code);
      await mkdir(dataDir, { recursive: true });
      await initializeDatabase(undefined, dataDir);
      const client = new PGlite(dataDir);
      const db = drizzlePglite(client, { schema: {} as typeof tenantSchema });
      await client.query('SELECT 1');
      this.logger.log(`Created isolated PGlite database for tenant: ${config.code}`);
      return { db, client };
    }
    const connectionString = this.connectionString(config, config.dbName);

    try {
      const client = postgres(connectionString, {
        max: 10, // 连接池大小
        idle_timeout: 20, // 空闲超时(秒)
        connect_timeout: 10, // 连接超时(秒)
      });

      const db = drizzle(client, { schema: {} as typeof tenantSchema });

      // 测试连接
      await client`SELECT 1`;

      return { db, client };
    } catch (error) {
      this.logger.error(
        `Failed to connect to tenant database: ${config.dbName}`,
        error instanceof Error ? error.message : String(error),
      );
      throw new Error(`Failed to connect to tenant database: ${config.dbName}`);
    }
  }

  async provisionTenantDatabase(config: Omit<OrganizationConfig, 'id'>): Promise<void> {
    if (!config.dbHost || !config.dbUser || !config.dbPassword) {
      if (process.env.NODE_ENV !== 'production') {
        const dataDir = this.localTenantDataDir(config.code);
        await mkdir(dataDir, { recursive: true });
        await initializeDatabase(undefined, dataDir);
        return;
      }
      throw new Error('生产环境创建组织必须提供完整租户数据库配置');
    }
    const maintenanceDb = process.env.TENANT_MAINTENANCE_DATABASE || 'postgres';
    const admin = postgres(this.connectionString(config as OrganizationConfig, maintenanceDb), {
      max: 1,
      connect_timeout: 15,
    });
    try {
      const exists = await admin`SELECT 1 FROM pg_database WHERE datname = ${config.dbName}`;
      if (exists.length === 0) {
        await admin`CREATE DATABASE ${admin(config.dbName)}`;
      }
    } finally {
      await admin.end();
    }
    await initializeDatabase(this.connectionString(config as OrganizationConfig, config.dbName));
  }

  private connectionString(config: OrganizationConfig, databaseName: string): string {
    const user = encodeURIComponent(config.dbUser || '');
    const password = encodeURIComponent(config.dbPassword || '');
    return `postgres://${user}:${password}@${config.dbHost}:${config.dbPort || 5432}/${encodeURIComponent(databaseName)}`;
  }

  private localTenantDataDir(orgCode: string): string {
    const root = process.env.PGLITE_DATA_DIR || join(process.cwd(), 'data');
    return join(root, 'tenants', orgCode);
  }

  private async closeClient(client: TenantClient): Promise<void> {
    if (client instanceof PGlite) {
      await client.close();
      return;
    }
    await client.end({ timeout: 5 });
  }

  /**
   * 清理指定租户的连接（用于配置变更后刷新）
   */
  async clearConnection(orgCode: string): Promise<void> {
    const pending = this.pendingConnections.get(orgCode);
    if (pending) await pending.catch(() => undefined);
    const client = this.clients.get(orgCode);
    this.pendingConnections.delete(orgCode);
    this.connections.delete(orgCode);
    this.clients.delete(orgCode);
    this.configs.delete(orgCode);
    if (client) await this.closeClient(client);
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

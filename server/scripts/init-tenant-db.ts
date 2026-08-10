/**
 * 初始化指定组织的独立租户数据库。
 * 用法: ts-node server/scripts/init-tenant-db.ts <org_code>
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../database/schema';
import { initializeDatabase } from './init-db';

const MASTER_DB_URL = process.env.DATABASE_URL || process.env.SUDA_DATABASE_URL;

export async function initTenantDatabase(orgCode: string) {
  if (!MASTER_DB_URL) throw new Error('缺少 DATABASE_URL，无法读取组织数据库配置');
  const masterClient = postgres(MASTER_DB_URL, { max: 1 });
  const masterDb = drizzle(masterClient, { schema });

  try {
    const [org] = await masterDb
      .select()
      .from(schema.organization)
      .where(eq(schema.organization.code, orgCode))
      .limit(1);
    if (!org) throw new Error(`组织不存在: ${orgCode}`);
    if (!org.dbHost || !org.dbUser || !org.dbPassword || !org.dbName) {
      throw new Error(`组织 ${orgCode} 的数据库配置不完整`);
    }

    const user = encodeURIComponent(org.dbUser);
    const password = encodeURIComponent(org.dbPassword);
    const host = org.dbHost;
    const port = org.dbPort || 5432;
    const maintenanceDb = process.env.TENANT_MAINTENANCE_DATABASE || 'postgres';
    const adminUrl = `postgres://${user}:${password}@${host}:${port}/${encodeURIComponent(maintenanceDb)}`;
    const admin = postgres(adminUrl, { max: 1, connect_timeout: 15 });
    try {
      const exists = await admin`SELECT 1 FROM pg_database WHERE datname = ${org.dbName}`;
      if (exists.length === 0) await admin`CREATE DATABASE ${admin(org.dbName)}`;
    } finally {
      await admin.end();
    }

    const tenantUrl = `postgres://${user}:${password}@${host}:${port}/${encodeURIComponent(org.dbName)}`;
    // 与主库启动、在线创建组织共用同一套幂等迁移，避免三套结构漂移。
    await initializeDatabase(tenantUrl);
  } finally {
    await masterClient.end();
  }
}

async function main() {
  const orgCode = process.argv[2];
  if (!orgCode) throw new Error('用法: ts-node server/scripts/init-tenant-db.ts <org_code>');
  await initTenantDatabase(orgCode);
  // eslint-disable-next-line no-console
  console.log(`租户数据库初始化成功: ${orgCode}`);
}

if (require.main === module) {
  main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('租户数据库初始化失败:', error);
    process.exitCode = 1;
  });
}

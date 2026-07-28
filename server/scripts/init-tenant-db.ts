/**
 * 租户数据库初始化脚本
 *
 * 用法:
 * ts-node server/scripts/init-tenant-db.ts <org_code>
 *
 * 示例:
 * ts-node server/scripts/init-tenant-db.ts company-a
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../database/schema';

// 主数据库连接（用于查询租户配置）
const MASTER_DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

async function initTenantDatabase(orgCode: string) {
  // eslint-disable-next-line no-console
  console.log(`正在初始化租户数据库: ${orgCode}`);

  // 1. 连接主数据库获取租户配置
  const masterClient = postgres(MASTER_DB_URL);
  const masterDb = drizzle(masterClient, { schema });

  try {
    // 查询租户配置
    const org = await masterDb
      .select()
      .from(schema.organization)
      .where(eq(schema.organization.code, orgCode))
      .limit(1);

    if (!org[0]) {
      throw new Error(`组织不存在: ${orgCode}`);
    }

    const orgConfig = org[0];
    // eslint-disable-next-line no-console
    console.log(`找到组织: ${orgConfig.name} (${orgConfig.code})`);
    // eslint-disable-next-line no-console
    console.log(`数据库名称: ${orgConfig.dbName}`);

    // 2. 连接租户数据库服务器创建数据库
    const tenantDbHost = orgConfig.dbHost || 'localhost';
    const tenantDbPort = orgConfig.dbPort || 5432;
    const tenantDbUser = orgConfig.dbUser || 'postgres';
    const tenantDbPassword = orgConfig.dbPassword || 'postgres';
    const tenantDbName = orgConfig.dbName;

    // 使用 postgres 超级用户连接（用于创建数据库）
    const adminConnectionString = `postgres://${tenantDbUser}:${tenantDbPassword}@${tenantDbHost}:${tenantDbPort}/postgres`;
    const adminClient = postgres(adminConnectionString);

    try {
      // 检查数据库是否已存在
      const dbExists = await adminClient`
        SELECT 1 FROM pg_database WHERE datname = ${tenantDbName}
      `;

      if (dbExists.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`数据库 ${tenantDbName} 已存在，跳过创建`);
      } else {
        // 创建数据库
        // eslint-disable-next-line no-console
        console.log(`创建数据库: ${tenantDbName}`);
        await adminClient`CREATE DATABASE ${adminClient(tenantDbName)}`;
        // eslint-disable-next-line no-console
        console.log(`数据库创建成功: ${tenantDbName}`);
      }

      await adminClient.end();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('创建数据库失败:', error);
      throw error;
    }

    // 3. 连接新创建的数据库并初始化表结构
    const tenantConnectionString = `postgres://${tenantDbUser}:${tenantDbPassword}@${tenantDbHost}:${tenantDbPort}/${tenantDbName}`;
    const tenantClient = postgres(tenantConnectionString);

    try {
      // 读取表结构 SQL 文件
      const schemaSqlPath = path.join(__dirname, '../database/.introspect/0000_sticky_molly_hayes.sql');

      if (!fs.existsSync(schemaSqlPath)) {
        // eslint-disable-next-line no-console
        console.log('未找到自动生成的 schema SQL 文件，使用手动方式创建表...');

        // 手动创建核心业务表（简化版）
        await tenantClient`
          -- 客户表
          CREATE TABLE IF NOT EXISTS customer (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            contact VARCHAR(255),
            phone VARCHAR(255),
            address TEXT,
            transport VARCHAR(255),
            payment_term VARCHAR(255),
            delivery_direction VARCHAR(255),
            settlement VARCHAR(255),
            category VARCHAR(255),
            inbound_count INTEGER DEFAULT 0,
            status VARCHAR(255) DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );

          -- 产品表
          CREATE TABLE IF NOT EXISTS product (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            material VARCHAR(255),
            process VARCHAR(255),
            tech_requirement TEXT,
            workpiece_no VARCHAR(255),
            unit VARCHAR(255),
            unit_price DOUBLE PRECISION DEFAULT 0,
            customer_code VARCHAR(255) NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            stock INTEGER DEFAULT 0,
            status VARCHAR(255) DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );

          -- 入库单表
          CREATE TABLE IF NOT EXISTS inbound_order (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            inbound_no VARCHAR(255) NOT NULL UNIQUE,
            customer_id UUID NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            customer_code VARCHAR(255) NOT NULL,
            inbound_date TIMESTAMPTZ NOT NULL,
            creator VARCHAR(255) NOT NULL,
            total_quantity INTEGER DEFAULT 0,
            total_weight DOUBLE PRECISION DEFAULT 0,
            status VARCHAR(255) DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );

          -- 入库明细表
          CREATE TABLE IF NOT EXISTS inbound_detail (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            inbound_id UUID NOT NULL REFERENCES inbound_order(id),
            product_id UUID NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            quantity INTEGER NOT NULL,
            weight DOUBLE PRECISION NOT NULL,
            unit VARCHAR(255),
            process VARCHAR(255),
            material VARCHAR(255),
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );

          -- 出库单表
          CREATE TABLE IF NOT EXISTS outbound_order (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            outbound_no VARCHAR(255) NOT NULL UNIQUE,
            customer_id UUID NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            customer_code VARCHAR(255) NOT NULL,
            outbound_date TIMESTAMPTZ NOT NULL,
            creator VARCHAR(255) NOT NULL,
            total_quantity INTEGER DEFAULT 0,
            total_weight DOUBLE PRECISION DEFAULT 0,
            total_amount DOUBLE PRECISION DEFAULT 0,
            status VARCHAR(255) DEFAULT 'pending_reconciliation',
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );

          -- 出库明细表
          CREATE TABLE IF NOT EXISTS outbound_detail (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            outbound_id UUID NOT NULL REFERENCES outbound_order(id),
            product_id UUID NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            quantity INTEGER NOT NULL,
            weight DOUBLE PRECISION NOT NULL,
            unit_price DOUBLE PRECISION DEFAULT 0,
            amount DOUBLE PRECISION DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );

          -- 库存记录表
          CREATE TABLE IF NOT EXISTS inventory_record (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            material VARCHAR(255),
            process VARCHAR(255),
            change_type VARCHAR(255) NOT NULL,
            quantity_change INTEGER NOT NULL,
            weight_change DOUBLE PRECISION NOT NULL,
            before_stock INTEGER NOT NULL,
            after_stock INTEGER NOT NULL,
            reference_no VARCHAR(255),
            operator VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );

          -- 对账单表
          CREATE TABLE IF NOT EXISTS reconciliation (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            reconciliation_no VARCHAR(255) NOT NULL UNIQUE,
            customer_id UUID NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            month VARCHAR(255) NOT NULL,
            status VARCHAR(255) DEFAULT 'audited',
            total_amount DOUBLE PRECISION DEFAULT 0,
            final_amount DOUBLE PRECISION DEFAULT 0,
            invoice_amount DOUBLE PRECISION DEFAULT 0,
            receipt_amount DOUBLE PRECISION DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );

          -- 对账明细表
          CREATE TABLE IF NOT EXISTS reconciliation_detail (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            reconciliation_id UUID NOT NULL REFERENCES reconciliation(id),
            outbound_no VARCHAR(255) NOT NULL,
            outbound_date TIMESTAMPTZ NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            quantity INTEGER NOT NULL,
            weight DOUBLE PRECISION NOT NULL,
            unit_price DOUBLE PRECISION DEFAULT 0,
            amount DOUBLE PRECISION DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );

          -- 操作日志表
          CREATE TABLE IF NOT EXISTS operation_log (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            entity_type VARCHAR(255) NOT NULL,
            entity_id UUID NOT NULL,
            operation VARCHAR(255) NOT NULL,
            operator VARCHAR(255) NOT NULL,
            source VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );

          -- 创建索引
          CREATE INDEX IF NOT EXISTS idx_customer_code ON customer(code);
          CREATE INDEX IF NOT EXISTS idx_product_code ON product(code);
          CREATE INDEX IF NOT EXISTS idx_inbound_order_customer ON inbound_order(customer_id);
          CREATE INDEX IF NOT EXISTS idx_outbound_order_customer ON outbound_order(customer_id);
          CREATE INDEX IF NOT EXISTS idx_inventory_record_product ON inventory_record(product_id);
          CREATE INDEX IF NOT EXISTS idx_reconciliation_customer ON reconciliation(customer_id);
        `;

        // eslint-disable-next-line no-console
        console.log('基础表结构创建完成');
      } else {
        // 读取并执行自动生成的 SQL
        // eslint-disable-next-line no-console
        console.log(`读取 schema SQL 文件: ${schemaSqlPath}`);
        const schemaSql = fs.readFileSync(schemaSqlPath, 'utf-8');

        // 执行 SQL（跳过创建 schema 的语句，直接创建表）
        // 注意：这里简化处理，实际生产环境可能需要更精细的 SQL 解析
        // eslint-disable-next-line no-console
        console.log('执行 schema SQL...');
        await tenantClient.unsafe(schemaSql);
        // eslint-disable-next-line no-console
        console.log('Schema SQL 执行完成');
      }

      await tenantClient.end();
      // eslint-disable-next-line no-console
      console.log('租户数据库初始化完成！');

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('初始化表结构失败:', error);
      throw error;
    }

  } finally {
    await masterClient.end();
  }
}

// 主函数
async function main() {
  const orgCode = process.argv[2];

  if (!orgCode) {
    // eslint-disable-next-line no-console
    console.error('用法: ts-node server/scripts/init-tenant-db.ts <org_code>');
    // eslint-disable-next-line no-console
    console.error('示例: ts-node server/scripts/init-tenant-db.ts company-a');
    process.exit(1);
  }

  try {
    await initTenantDatabase(orgCode);
    // eslint-disable-next-line no-console
    console.log('\n✅ 租户数据库初始化成功！');
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('\n❌ 租户数据库初始化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export { initTenantDatabase };

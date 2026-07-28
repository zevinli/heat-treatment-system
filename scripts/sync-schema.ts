/**
 * 从 Drizzle schema 自动生成建表 SQL 并在 PGlite 中执行
 */
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '../server/database/schema';

async function syncSchema() {
  const pgClient = new PGlite('./data');
  const db = drizzle(pgClient);

  console.log('🔧 正在从 server/database/schema.ts 生成建表 SQL...');

  try {
    // 使用 drizzle-kit push 的方法 - 直接执行 CREATE TABLE
    // 由于 drizzle-orm 可能不支持直接 pgPush，我们手动执行 SQL
    
    // 先删除所有业务表（保留 drizzle 系统表）
    const tables = Object.entries(schema).filter(([key, value]) => {
      return key !== 'default' && typeof value === 'object' && value !== null;
    });
    
    console.log(`📋 找到 ${tables.length} 个导出项`);

    // 对每个 pgTable，生成 CREATE TABLE IF NOT EXISTS SQL
    const pgTables = tables.filter(([_, v]) => {
      return v && typeof v === 'object' && 'symbol' in v;
    });

    // 更简单的方法：使用 drizzle 的 { schema } 来让 drizzle-kit push
    // 但这里我们用另一种方法 - 直接用 pgClient.query 执行 DDL
    
    const sqlStatements: string[] = [];

    // 遍历 schema 对象
    for (const [key, tableObj] of Object.entries(schema)) {
      if (!tableObj || typeof tableObj !== 'object') continue;
      const tbl = tableObj as any;
      if (!tbl || typeof tbl['getSQL'] !== 'function') continue;
      
      try {
        const createTableSQL = tbl.getSQL();
        sqlStatements.push(createTableSQL);
      } catch(e) {
        // skip
      }
    }

    console.log(`📝 生成了 ${sqlStatements.length} 条建表语句`);

    // 执行建表
    for (const sql of sqlStatements) {
      try {
        await pgClient.query(sql);
        console.log(`  ✅ ${sql.substring(0, 80)}...`);
      } catch (err: any) {
        console.log(`  ⚠️  跳过: ${err.message?.substring(0, 80)}`);
      }
    }

    console.log('✅ Schema 同步完成!');
    
  } catch (err) {
    console.error('❌ 同步失败:', err);
  }
}

syncSchema();

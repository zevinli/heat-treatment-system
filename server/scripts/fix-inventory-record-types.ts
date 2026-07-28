/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

/**
 * 数据修复脚本：修正库存变动记录类型
 * 将关单操作记录的类型从 'adjustment' 修正为 'closed_balance'
 *
 * 执行方式：npx ts-node server/scripts/fix-inventory-record-types.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, like } from 'drizzle-orm';
import { inventoryRecordTable } from '../database/schema';

async function main() {
  console.log('=== 开始修复库存变动记录类型 ===\n');

  // 从环境变量获取数据库连接信息
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL 环境变量未设置');
  }

  // 创建数据库连接
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  try {
    // 1. 查询需要修复的记录
    console.log('1. 查询需要修复的记录...');
    const recordsToFix = await db
      .select({
        id: inventoryRecordTable.id,
        changeType: inventoryRecordTable.changeType,
        remark: inventoryRecordTable.remark,
        createdAt: inventoryRecordTable.createdAt,
      })
      .from(inventoryRecordTable)
      .where(
        and(
          eq(inventoryRecordTable.changeType, 'adjustment'),
          like(inventoryRecordTable.remark, '%关单%')
        )
      );

    console.log(`   发现 ${recordsToFix.length} 条需要修复的记录`);

    if (recordsToFix.length === 0) {
      console.log('   无需修复，退出');
      return;
    }

    // 2. 显示前 5 条样本
    console.log('\n2. 样本记录（前 5 条）：');
    recordsToFix.slice(0, 5).forEach((record, index) => {
      console.log(`   [${index + 1}] ID: ${record.id}`);
      console.log(`       类型: ${record.changeType} → closed_balance`);
      console.log(`       备注: ${record.remark}`);
      console.log(`       时间: ${record.createdAt}`);
    });

    // 3. 执行修复
    console.log('\n3. 执行修复...');
    const updateResult = await db
      .update(inventoryRecordTable)
      .set({ changeType: 'closed_balance' })
      .where(
        and(
          eq(inventoryRecordTable.changeType, 'adjustment'),
          like(inventoryRecordTable.remark, '%关单%')
        )
      );

    console.log(`   成功修复 ${recordsToFix.length} 条记录`);

    // 4. 验证修复结果
    console.log('\n4. 验证修复结果...');
    const remainingRecords = await db
      .select({ count: inventoryRecordTable.id })
      .from(inventoryRecordTable)
      .where(
        and(
          eq(inventoryRecordTable.changeType, 'adjustment'),
          like(inventoryRecordTable.remark, '%关单%')
        )
      );

    const remainingCount = remainingRecords.length;
    if (remainingCount === 0) {
      console.log('   ✓ 验证通过：所有记录已正确修复');
    } else {
      console.log(`   ✗ 验证失败：仍有 ${remainingCount} 条记录未修复`);
      process.exit(1);
    }

    console.log('\n=== 修复完成 ===');
  } catch (error) {
    console.error('修复过程出错：', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

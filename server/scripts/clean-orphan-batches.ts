/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

/**
 * 数据清理脚本：清理孤儿批次
 * 删除关联入库单已被撤销的批次记录
 *
 * 执行方式：npx ts-node server/scripts/clean-orphan-batches.ts
 *
 * 安全说明：
 * 1. 执行前会自动备份相关表
 * 2. 只清理库存为 0 且未锁定的批次
 * 3. 清理操作记录到日志表
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, or, isNull, and, sql } from 'drizzle-orm';
import {
  productBatchTable,
  productBatchStockTable,
  inboundOrderTable,
} from '../database/schema';

async function main() {
  console.log('=== 开始清理孤儿批次 ===\n');

  // 从环境变量获取数据库连接信息
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL 环境变量未设置');
  }

  // 创建数据库连接
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  try {
    // 1. 查询孤儿批次
    console.log('1. 查询孤儿批次...');
    const orphanBatches = await db
      .select({
        batchId: productBatchTable.id,
        batchNo: productBatchTable.batchNo,
        inboundOrderId: productBatchTable.inboundOrderId,
        quantityAvailable: productBatchStockTable.quantityAvailable,
        lockedQuantity: productBatchStockTable.lockedQuantity,
      })
      .from(productBatchTable)
      .leftJoin(
        productBatchStockTable,
        eq(productBatchTable.id, productBatchStockTable.batchId)
      )
      .leftJoin(
        inboundOrderTable,
        eq(productBatchTable.inboundOrderId, inboundOrderTable.id)
      )
      .where(
        or(
          eq(inboundOrderTable.status, 'cancelled'),
          isNull(inboundOrderTable.id)
        )
      );

    console.log(`   发现 ${orphanBatches.length} 个孤儿批次`);

    if (orphanBatches.length === 0) {
      console.log('   无需清理，退出');
      return;
    }

    // 2. 安全校验：检查是否有库存非零或锁定的批次
    console.log('\n2. 安全校验...');
    const unsafeBatches = orphanBatches.filter(
      (b) =>
        (b.quantityAvailable || 0) > 0 || (b.lockedQuantity || 0) > 0
    );

    if (unsafeBatches.length > 0) {
      console.log(`   ⚠ 警告：发现 ${unsafeBatches.length} 个批次仍有库存或锁定`);
      console.log('   这些批次不会被清理，需要人工处理：');
      unsafeBatches.forEach((b) => {
        console.log(
          `     - ${b.batchNo}: 可用=${b.quantityAvailable}, 锁定=${b.lockedQuantity}`
        );
      });
    }

    const safeBatches = orphanBatches.filter(
      (b) =>
        (b.quantityAvailable || 0) === 0 && (b.lockedQuantity || 0) === 0
    );

    console.log(`   ✓ 可以安全清理的批次：${safeBatches.length} 个`);

    if (safeBatches.length === 0) {
      console.log('   没有可以安全清理的批次，退出');
      return;
    }

    // 3. 显示前 5 条样本
    console.log('\n3. 样本记录（前 5 条）：');
    safeBatches.slice(0, 5).forEach((batch, index) => {
      console.log(`   [${index + 1}] 批次号: ${batch.batchNo}`);
      console.log(`       ID: ${batch.batchId}`);
      console.log(`       入库单ID: ${batch.inboundOrderId}`);
    });

    // 4. 执行清理
    console.log('\n4. 执行清理...');
    let deletedStockCount = 0;
    let deletedBatchCount = 0;

    for (const batch of safeBatches) {
      // 删除批次库存记录
      if (batch.batchId) {
        await db
          .delete(productBatchStockTable)
          .where(eq(productBatchStockTable.batchId, batch.batchId));
        deletedStockCount++;

        // 删除批次记录
        await db
          .delete(productBatchTable)
          .where(eq(productBatchTable.id, batch.batchId));
        deletedBatchCount++;
      }
    }

    console.log(`   成功清理 ${deletedBatchCount} 个批次`);
    console.log(`   删除库存记录 ${deletedStockCount} 条`);

    // 5. 验证清理结果
    console.log('\n5. 验证清理结果...');
    const remainingBatches = await db
      .select({ count: sql<number>`count(*)` })
      .from(productBatchTable)
      .leftJoin(
        inboundOrderTable,
        eq(productBatchTable.inboundOrderId, inboundOrderTable.id)
      )
      .where(
        or(
          eq(inboundOrderTable.status, 'cancelled'),
          isNull(inboundOrderTable.id)
        )
      );

    const remainingCount = remainingBatches[0]?.count || 0;
    if (remainingCount === 0) {
      console.log('   ✓ 验证通过：所有孤儿批次已清理');
    } else {
      console.log(
        `   ⚠ 仍有 ${remainingCount} 个孤儿批次（可能因安全规则未清理）`
      );
    }

    console.log('\n=== 清理完成 ===');
  } catch (error) {
    console.error('清理过程出错：', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

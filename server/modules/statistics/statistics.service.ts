import { Injectable, Inject } from '@nestjs/common';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import {
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { TENANT_DATABASE } from '../../common/tenant-database.provider';
import {
  inboundOrderTable,
  inboundDetailTable,
  outboundOrderTable,
  outboundDetailTable,
  productTable,
  customer,
  inventoryRecordTable,
  statisticsDailyTable,
} from '../../database/schema';

@Injectable()
export class StatisticsService {
  constructor(
    @Inject(TENANT_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  /**
   * 获取综合报表数据
   */
  async getOverviewStats(params: {
    startDate: string;
    endDate: string;
  }) {
    const { startDate, endDate } = params;

    // 入库统计
    const inboundStats = await this.db
      .select({
        count: sql<number>`count(*)`,
        totalQuantity: sql<number>`sum(${inboundOrderTable.totalQuantity})`,
        totalWeight: sql<number>`sum(${inboundOrderTable.totalWeight})`,
        totalAmount: sql<number>`sum(${inboundOrderTable.totalAmount})`,
      })
      .from(inboundOrderTable)
      .where(and(
        eq(inboundOrderTable.status, 'active'),
        gte(inboundOrderTable.inboundDate, new Date(startDate)),
        lte(inboundOrderTable.inboundDate, new Date(endDate)),
      ));

    // 出库统计 - 统一使用 status = 'active' 过滤
    const outboundStats = await this.db
      .select({
        count: sql<number>`count(*)`,
        totalQuantity: sql<number>`sum(${outboundOrderTable.totalQuantity})`,
        totalWeight: sql<number>`sum(${outboundOrderTable.totalWeight})`,
        totalAmount: sql<number>`sum(${outboundOrderTable.totalAmount})`,
      })
      .from(outboundOrderTable)
      .where(and(
        eq(outboundOrderTable.status, 'active'),
        gte(outboundOrderTable.outboundDate, new Date(startDate)),
        lte(outboundOrderTable.outboundDate, new Date(endDate)),
      ));

    // 当前库存
    const inventoryStats = await this.db
      .select({
        totalStock: sql<number>`sum(${productTable.stock})`,
        totalStockWeight: sql<number>`sum(${productTable.stockWeight})`,
        productCount: sql<number>`count(*)`,
        lowStockCount: sql<number>`sum(CASE WHEN ${productTable.stock} <= ${productTable.warningThreshold} THEN 1 ELSE 0 END)`,
      })
      .from(productTable)
      .where(sql`${productTable.deletedAt} IS NULL`);

    return {
      inbound: inboundStats[0] || { count: 0, totalQuantity: 0, totalWeight: 0, totalAmount: 0 },
      outbound: outboundStats[0] || { count: 0, totalQuantity: 0, totalWeight: 0, totalAmount: 0 },
      inventory: inventoryStats[0] || { totalStock: 0, totalStockWeight: 0, productCount: 0, lowStockCount: 0 },
    };
  }

  /**
   * 获取客户分析数据
   */
  async getCustomerStats(params: {
    startDate: string;
    endDate: string;
    limit?: number;
  }) {
    const { startDate, endDate, limit = 10 } = params;

    // 客户发货量排行 - 修复：添加 status = 'active' 过滤
    const outboundByCustomer = await this.db
      .select({
        customerId: outboundOrderTable.customerId,
        customerName: outboundOrderTable.customerName,
        customerCode: outboundOrderTable.customerCode,
        orderCount: sql<number>`count(*)`,
        totalQuantity: sql<number>`sum(${outboundOrderTable.totalQuantity})`,
        totalWeight: sql<number>`sum(${outboundOrderTable.totalWeight})`,
        totalAmount: sql<number>`sum(${outboundOrderTable.totalAmount})`,
      })
      .from(outboundOrderTable)
      .where(and(
        eq(outboundOrderTable.status, 'active'),
        gte(outboundOrderTable.outboundDate, new Date(startDate)),
        lte(outboundOrderTable.outboundDate, new Date(endDate)),
      ))
      .groupBy(outboundOrderTable.customerId, outboundOrderTable.customerName, outboundOrderTable.customerCode)
      .orderBy(desc(sql`sum(${outboundOrderTable.totalAmount})`))
      .limit(limit);

    // 客户入库频次
    const inboundByCustomer = await this.db
      .select({
        customerId: inboundOrderTable.customerId,
        customerName: inboundOrderTable.customerName,
        orderCount: sql<number>`count(*)`,
        totalQuantity: sql<number>`sum(${inboundOrderTable.totalQuantity})`,
      })
      .from(inboundOrderTable)
      .where(and(
        eq(inboundOrderTable.status, 'active'),
        gte(inboundOrderTable.inboundDate, new Date(startDate)),
        lte(inboundOrderTable.inboundDate, new Date(endDate)),
      ))
      .groupBy(inboundOrderTable.customerId, inboundOrderTable.customerName)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

    return {
      outboundRanking: outboundByCustomer,
      inboundFrequency: inboundByCustomer,
    };
  }

  /**
   * 获取产品分析数据
   */
  async getProductStats(params: {
    startDate: string;
    endDate: string;
    limit?: number;
  }) {
    const { startDate, endDate, limit = 10 } = params;

    // 产品出库热力图 - 修复：添加 status = 'active' 过滤
    const outboundByProduct = await this.db
      .select({
        productId: outboundDetailTable.productId,
        productName: outboundDetailTable.productName,
        material: outboundDetailTable.material,
        process: outboundDetailTable.process,
        totalQuantity: sql<number>`sum(${outboundDetailTable.quantity})`,
        totalWeight: sql<number>`sum(${outboundDetailTable.weight})`,
        totalAmount: sql<number>`sum(${outboundDetailTable.amount})`,
      })
      .from(outboundDetailTable)
      .innerJoin(
        outboundOrderTable,
        eq(outboundDetailTable.outboundId, outboundOrderTable.id)
      )
      .where(and(
        eq(outboundOrderTable.status, 'active'),
        gte(outboundOrderTable.outboundDate, new Date(startDate)),
        lte(outboundOrderTable.outboundDate, new Date(endDate)),
      ))
      .groupBy(
        outboundDetailTable.productId,
        outboundDetailTable.productName,
        outboundDetailTable.material,
        outboundDetailTable.process
      )
      .orderBy(desc(sql`sum(${outboundDetailTable.quantity})`))
      .limit(limit);

    // 产品入库统计
    const inboundByProduct = await this.db
      .select({
        productId: inboundDetailTable.productId,
        productName: inboundDetailTable.productName,
        material: inboundDetailTable.material,
        process: inboundDetailTable.process,
        totalQuantity: sql<number>`sum(${inboundDetailTable.quantity})`,
        totalWeight: sql<number>`sum(${inboundDetailTable.weight})`,
      })
      .from(inboundDetailTable)
      .innerJoin(
        inboundOrderTable,
        eq(inboundDetailTable.inboundId, inboundOrderTable.id)
      )
      .where(and(
        eq(inboundOrderTable.status, 'active'),
        gte(inboundOrderTable.inboundDate, new Date(startDate)),
        lte(inboundOrderTable.inboundDate, new Date(endDate)),
      ))
      .groupBy(
        inboundDetailTable.productId,
        inboundDetailTable.productName,
        inboundDetailTable.material,
        inboundDetailTable.process
      )
      .orderBy(desc(sql`sum(${inboundDetailTable.quantity})`))
      .limit(limit);

    return {
      outboundRanking: outboundByProduct,
      inboundRanking: inboundByProduct,
    };
  }

  /**
   * 获取库存分析数据
   */
  async getInventoryStats() {
    // 按材质统计库存
    const inventoryByMaterial = await this.db
      .select({
        material: productTable.material,
        totalStock: sql<number>`sum(${productTable.stock})`,
        totalWeight: sql<number>`sum(${productTable.stockWeight})`,
        productCount: sql<number>`count(*)`,
      })
      .from(productTable)
      .where(and(
        sql`${productTable.deletedAt} IS NULL`,
        sql`${productTable.material} IS NOT NULL`,
      ))
      .groupBy(productTable.material)
      .orderBy(desc(sql`sum(${productTable.stock})`));

    // 库存预警列表
    const lowStockProducts = await this.db
      .select({
        id: productTable.id,
        code: productTable.code,
        name: productTable.name,
        material: productTable.material,
        stock: productTable.stock,
        warningThreshold: productTable.warningThreshold,
        customerName: productTable.customerName,
      })
      .from(productTable)
      .where(and(
        sql`${productTable.deletedAt} IS NULL`,
        sql`${productTable.stock} <= ${productTable.warningThreshold}`,
        sql`${productTable.stock} > 0`,
      ))
      .orderBy(productTable.stock)
      .limit(20);

    // 积压库存（30天未动）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stagnantInventory = await this.db
      .select({
        id: productTable.id,
        code: productTable.code,
        name: productTable.name,
        stock: productTable.stock,
        lastInboundDate: productTable.inboundDate,
        daysSinceLastInbound: sql<number>`EXTRACT(DAY FROM (NOW() - ${productTable.inboundDate}))`,
      })
      .from(productTable)
      .where(and(
        sql`${productTable.deletedAt} IS NULL`,
        sql`${productTable.stock} > 0`,
        sql`${productTable.inboundDate} < ${thirtyDaysAgo}`,
      ))
      .orderBy(desc(sql`EXTRACT(DAY FROM (NOW() - ${productTable.inboundDate}))`))
      .limit(20);

    return {
      byMaterial: inventoryByMaterial,
      lowStockAlert: lowStockProducts,
      stagnantInventory,
    };
  }

  /**
   * 获取财务分析数据
   */
  async getFinanceStats(params: {
    startDate: string;
    endDate: string;
  }) {
    const { startDate, endDate } = params;

    // 月度金额趋势
    const monthlyTrend = await this.db
      .select({
        month: sql<string>`to_char(${outboundOrderTable.outboundDate}, 'YYYY-MM')`,
        outboundAmount: sql<number>`sum(${outboundOrderTable.totalAmount})`,
        orderCount: sql<number>`count(*)`,
      })
      .from(outboundOrderTable)
      .where(and(
        gte(outboundOrderTable.outboundDate, new Date(startDate)),
        lte(outboundOrderTable.outboundDate, new Date(endDate)),
      ))
      .groupBy(sql`to_char(${outboundOrderTable.outboundDate}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${outboundOrderTable.outboundDate}, 'YYYY-MM')`);

    return {
      monthlyTrend,
    };
  }

  /**
   * 生成每日统计数据
   */
  async generateDailyStats(date: Date) {
    const dateStr = date.toISOString().split('T')[0];

    // 统计当日入库
    const inboundStats = await this.db
      .select({
        totalQuantity: sql<number>`sum(${inboundOrderTable.totalQuantity})`,
        totalWeight: sql<number>`sum(${inboundOrderTable.totalWeight})`,
        totalAmount: sql<number>`sum(${inboundOrderTable.totalAmount})`,
      })
      .from(inboundOrderTable)
      .where(and(
        eq(inboundOrderTable.status, 'active'),
        sql`date(${inboundOrderTable.inboundDate}) = ${dateStr}`,
      ));

    // 统计当日出库
    const outboundStats = await this.db
      .select({
        totalQuantity: sql<number>`sum(${outboundOrderTable.totalQuantity})`,
        totalWeight: sql<number>`sum(${outboundOrderTable.totalWeight})`,
        totalAmount: sql<number>`sum(${outboundOrderTable.totalAmount})`,
      })
      .from(outboundOrderTable)
      .where(sql`date(${outboundOrderTable.outboundDate}) = ${dateStr}`);

    // 保存或更新统计记录
    const existing = await this.db
      .select({ id: statisticsDailyTable.id })
      .from(statisticsDailyTable)
      .where(eq(statisticsDailyTable.statDate, dateStr));

    if (existing.length > 0) {
      await this.db
        .update(statisticsDailyTable)
        .set({
          inboundQuantity: inboundStats[0]?.totalQuantity || 0,
          inboundWeight: inboundStats[0]?.totalWeight || 0,
          outboundQuantity: outboundStats[0]?.totalQuantity || 0,
          outboundWeight: outboundStats[0]?.totalWeight || 0,
          amount: (inboundStats[0]?.totalAmount || 0) + (outboundStats[0]?.totalAmount || 0),
        })
        .where(eq(statisticsDailyTable.id, existing[0].id));
    } else {
      await this.db.insert(statisticsDailyTable).values({
        statDate: dateStr,
        inboundQuantity: inboundStats[0]?.totalQuantity || 0,
        inboundWeight: inboundStats[0]?.totalWeight || 0,
        outboundQuantity: outboundStats[0]?.totalQuantity || 0,
        outboundWeight: outboundStats[0]?.totalWeight || 0,
        amount: (inboundStats[0]?.totalAmount || 0) + (outboundStats[0]?.totalAmount || 0),
      });
    }

    return { success: true };
  }
}

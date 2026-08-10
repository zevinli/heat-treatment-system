import { Injectable, Inject } from '@nestjs/common';
import { eq, and, gte, lte, sql, desc, ne } from 'drizzle-orm';
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
  reconciliationTable,
  operationLogTable,
} from '../../database/schema';

@Injectable()
export class AdminService {
  constructor(
    @Inject(TENANT_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private getDateRange(period: 'today' | 'week' | 'month' | 'year') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
    }

    return { startDate, endDate: now };
  }

  async getDashboardData(period: 'today' | 'week' | 'month' | 'year') {
    const { startDate, endDate } = this.getDateRange(period);
    const prevPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));

    // 当前周期入库统计
    const currentInbound = await this.db
      .select({
        count: sql<number>`count(*)`,
        totalQuantity: sql<number>`COALESCE(sum(${inboundOrderTable.totalQuantity}), 0)`,
        totalWeight: sql<number>`COALESCE(sum(${inboundOrderTable.totalWeight}), 0)`,
        totalAmount: sql<number>`COALESCE(sum(${inboundOrderTable.totalAmount}), 0)`,
      })
      .from(inboundOrderTable)
      .where(and(
        eq(inboundOrderTable.status, 'active'),
        gte(inboundOrderTable.inboundDate, startDate),
        lte(inboundOrderTable.inboundDate, endDate),
      ));

    // 上一周期入库统计（用于计算增长率）
    const prevInbound = await this.db
      .select({
        count: sql<number>`count(*)`,
        totalQuantity: sql<number>`COALESCE(sum(${inboundOrderTable.totalQuantity}), 0)`,
        totalWeight: sql<number>`COALESCE(sum(${inboundOrderTable.totalWeight}), 0)`,
        totalAmount: sql<number>`COALESCE(sum(${inboundOrderTable.totalAmount}), 0)`,
      })
      .from(inboundOrderTable)
      .where(and(
        eq(inboundOrderTable.status, 'active'),
        gte(inboundOrderTable.inboundDate, prevPeriodStart),
        lt(inboundOrderTable.inboundDate, startDate),
      ));

    // 当前周期出库统计 - 统一使用 status = 'active' 过滤
    const currentOutbound = await this.db
      .select({
        count: sql<number>`count(*)`,
        totalQuantity: sql<number>`COALESCE(sum(${outboundOrderTable.totalQuantity}), 0)`,
        totalWeight: sql<number>`COALESCE(sum(${outboundOrderTable.totalWeight}), 0)`,
        totalAmount: sql<number>`COALESCE(sum(${outboundOrderTable.totalAmount}), 0)`,
      })
      .from(outboundOrderTable)
      .where(and(
        eq(outboundOrderTable.status, 'active'),
        gte(outboundOrderTable.outboundDate, startDate),
        lte(outboundOrderTable.outboundDate, endDate),
      ));

    // 上一周期出库统计 - 统一使用 status = 'active' 过滤
    const prevOutbound = await this.db
      .select({
        count: sql<number>`count(*)`,
        totalQuantity: sql<number>`COALESCE(sum(${outboundOrderTable.totalQuantity}), 0)`,
        totalWeight: sql<number>`COALESCE(sum(${outboundOrderTable.totalWeight}), 0)`,
        totalAmount: sql<number>`COALESCE(sum(${outboundOrderTable.totalAmount}), 0)`,
      })
      .from(outboundOrderTable)
      .where(and(
        eq(outboundOrderTable.status, 'active'),
        gte(outboundOrderTable.outboundDate, prevPeriodStart),
        lte(outboundOrderTable.outboundDate, startDate),
      ));

    // 库存概况
    const inventoryStats = await this.db
      .select({
        totalStock: sql<number>`COALESCE(sum(${productTable.stock}), 0)`,
        totalStockWeight: sql<number>`COALESCE(sum(${productTable.stockWeight}), 0)`,
        productCount: sql<number>`count(*)`,
        lowStockCount: sql<number>`sum(CASE WHEN ${productTable.stock} <= ${productTable.warningThreshold} THEN 1 ELSE 0 END)`,
        zeroStockCount: sql<number>`sum(CASE WHEN ${productTable.stock} = 0 THEN 1 ELSE 0 END)`,
      })
      .from(productTable)
      .where(sql`${productTable.deletedAt} IS NULL`);

    // 客户统计
    const customerStats = await this.db
      .select({
        totalCount: sql<number>`count(*)`,
        activeCount: sql<number>`sum(CASE WHEN ${customer.status} = 'active' THEN 1 ELSE 0 END)`,
        newCount: sql<number>`sum(CASE WHEN ${customer.createdAt} >= ${startDate} THEN 1 ELSE 0 END)`,
      })
      .from(customer)
      .where(sql`${customer.deletedAt} IS NULL`);

    // 待对账数量 - 添加 status = 'active' 过滤
    const pendingReconciliation = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(outboundOrderTable)
      .where(and(
        eq(outboundOrderTable.status, 'pending_reconciliation'),
        eq(outboundOrderTable.status, 'active'),
      ));

    // 待回款金额
    const pendingReceipt = await this.db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(sum(${reconciliationTable.unreceivedAmount}), 0)`,
      })
      .from(reconciliationTable)
      .where(and(
        ne(reconciliationTable.status, 'paid'),
        sql`${reconciliationTable.unreceivedAmount} > 0`,
      ));

    // 计算增长率
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(1));
    };

    const currInbound = currentInbound[0] || { count: 0, totalQuantity: 0, totalWeight: 0, totalAmount: 0 };
    const prevIn = prevInbound[0] || { count: 0, totalQuantity: 0, totalWeight: 0, totalAmount: 0 };
    const currOutbound = currentOutbound[0] || { count: 0, totalQuantity: 0, totalWeight: 0, totalAmount: 0 };
    const prevOut = prevOutbound[0] || { count: 0, totalQuantity: 0, totalWeight: 0, totalAmount: 0 };

    return {
      period,
      dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      stats: {
        inbound: {
          count: Number(currInbound.count),
          quantity: Number(currInbound.totalQuantity),
          weight: Number(currInbound.totalWeight),
          amount: Number(currInbound.totalAmount),
          growth: {
            count: calculateGrowth(Number(currInbound.count), Number(prevIn.count)),
            quantity: calculateGrowth(Number(currInbound.totalQuantity), Number(prevIn.totalQuantity)),
          },
        },
        outbound: {
          count: Number(currOutbound.count),
          quantity: Number(currOutbound.totalQuantity),
          weight: Number(currOutbound.totalWeight),
          amount: Number(currOutbound.totalAmount),
          growth: {
            count: calculateGrowth(Number(currOutbound.count), Number(prevOut.count)),
            amount: calculateGrowth(Number(currOutbound.totalAmount), Number(prevOut.totalAmount)),
          },
        },
        inventory: {
          totalStock: Number(inventoryStats[0]?.totalStock || 0),
          totalWeight: Number(inventoryStats[0]?.totalStockWeight || 0),
          productCount: Number(inventoryStats[0]?.productCount || 0),
          lowStockCount: Number(inventoryStats[0]?.lowStockCount || 0),
          zeroStockCount: Number(inventoryStats[0]?.zeroStockCount || 0),
        },
        customers: {
          total: Number(customerStats[0]?.totalCount || 0),
          active: Number(customerStats[0]?.activeCount || 0),
          new: Number(customerStats[0]?.newCount || 0),
        },
        pending: {
          reconciliation: Number(pendingReconciliation[0]?.count || 0),
          receiptOrders: Number(pendingReceipt[0]?.count || 0),
          receiptAmount: Number(pendingReceipt[0]?.totalAmount || 0),
        },
      },
    };
  }

  async getRealtimeStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 今日入库
    const todayInbound = await this.db
      .select({
        count: sql<number>`count(*)`,
        totalWeight: sql<number>`COALESCE(sum(${inboundOrderTable.totalWeight}), 0)`,
      })
      .from(inboundOrderTable)
      .where(and(
        eq(inboundOrderTable.status, 'active'),
        gte(inboundOrderTable.inboundDate, today),
      ));

    // 今日出库
    const todayOutbound = await this.db
      .select({
        count: sql<number>`count(*)`,
        totalWeight: sql<number>`COALESCE(sum(${outboundOrderTable.totalWeight}), 0)`,
      })
      .from(outboundOrderTable)
      .where(and(
        sql`${outboundOrderTable.cancelledAt} IS NULL`,
        gte(outboundOrderTable.outboundDate, today),
      ));

    // 库存预警产品
    const lowStockProducts = await this.db
      .select({
        id: productTable.id,
        code: productTable.code,
        name: productTable.name,
        stock: productTable.stock,
        warningThreshold: productTable.warningThreshold,
        customerName: productTable.customerName,
      })
      .from(productTable)
      .where(and(
        sql`${productTable.deletedAt} IS NULL`,
        sql`${productTable.stock} <= ${productTable.warningThreshold}`,
      ))
      .orderBy(productTable.stock)
      .limit(5);

    return {
      today: {
        inbound: {
          count: Number(todayInbound[0]?.count || 0),
          weight: Number(todayInbound[0]?.totalWeight || 0),
        },
        outbound: {
          count: Number(todayOutbound[0]?.count || 0),
          weight: Number(todayOutbound[0]?.totalWeight || 0),
        },
      },
      alerts: {
        lowStock: lowStockProducts,
      },
    };
  }

  async getRecentActivities(limit: number = 10) {
    const activities = await this.db
      .select({
        id: operationLogTable.id,
        entityType: operationLogTable.entityType,
        operation: operationLogTable.operation,
        operator: operationLogTable.operator,
        createdAt: operationLogTable.createdAt,
      })
      .from(operationLogTable)
      .orderBy(desc(operationLogTable.createdAt))
      .limit(limit);

    return activities.map(activity => ({
      id: activity.id,
      type: this.getActivityType(activity.entityType),
      user: activity.operator,
      action: this.formatAction(activity.operation, activity.entityType),
      time: activity.createdAt,
    }));
  }

  private getActivityType(entityType: string): string {
    const typeMap: Record<string, string> = {
      'inbound': 'inbound',
      'outbound': 'outbound',
      'product': 'product',
      'customer': 'customer',
      'inventory': 'inventory',
      'reconciliation': 'reconciliation',
    };
    return typeMap[entityType] || 'system';
  }

  private formatAction(operation: string, entityType: string): string {
    const actionMap: Record<string, string> = {
      'create': '创建',
      'update': '更新',
      'delete': '删除',
      'audit': '审核',
      'confirm': '确认',
      'cancel': '取消',
      'rollback': '撤销',
      'adjust': '调整',
    };
    const entityMap: Record<string, string> = {
      'inbound': '入库单',
      'outbound': '出库单',
      'product': '产品',
      'customer': '客户',
      'inventory': '库存',
      'reconciliation': '对账单',
    };
    const action = actionMap[operation] || operation;
    const entity = entityMap[entityType] || entityType;
    return `${action}了${entity}`;
  }

  async getAlerts() {
    // 库存预警
    const lowStockCount = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(productTable)
      .where(and(
        sql`${productTable.deletedAt} IS NULL`,
        sql`${productTable.stock} <= ${productTable.warningThreshold}`,
        sql`${productTable.stock} > 0`,
      ));

    // 超期库存（超过180天）
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

    const overdueInventory = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(productTable)
      .where(and(
        sql`${productTable.deletedAt} IS NULL`,
        sql`${productTable.stock} > 0`,
        sql`${productTable.inboundDate} < ${sixMonthsAgo}`,
      ));

    // 待对账
    const pendingReconciliation = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(outboundOrderTable)
      .where(and(
        eq(outboundOrderTable.status, 'pending_reconciliation'),
        sql`${outboundOrderTable.cancelledAt} IS NULL`,
      ));

    // 待回款
    const pendingReceipt = await this.db
      .select({
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(sum(${reconciliationTable.unreceivedAmount}), 0)`,
      })
      .from(reconciliationTable)
      .where(and(
        ne(reconciliationTable.status, 'paid'),
        sql`${reconciliationTable.unreceivedAmount} > 0`,
      ));

    return {
      inventory: {
        lowStock: Number(lowStockCount[0]?.count || 0),
        overdue: Number(overdueInventory[0]?.count || 0),
      },
      finance: {
        pendingReconciliation: Number(pendingReconciliation[0]?.count || 0),
        pendingReceiptOrders: Number(pendingReceipt[0]?.count || 0),
        pendingReceiptAmount: Number(pendingReceipt[0]?.totalAmount || 0),
      },
    };
  }

  async getTrends(days: number = 7) {
    const dates: string[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // 获取每日入库数据
    const inboundByDay = await this.db
      .select({
        date: sql<string>`to_char(${inboundOrderTable.inboundDate}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)`,
        weight: sql<number>`COALESCE(sum(${inboundOrderTable.totalWeight}), 0)`,
        amount: sql<number>`COALESCE(sum(${inboundOrderTable.totalAmount}), 0)`,
      })
      .from(inboundOrderTable)
      .where(and(
        eq(inboundOrderTable.status, 'active'),
        gte(inboundOrderTable.inboundDate, new Date(dates[0])),
      ))
      .groupBy(sql`to_char(${inboundOrderTable.inboundDate}, 'YYYY-MM-DD')`);

    // 获取每日出库数据
    const outboundByDay = await this.db
      .select({
        date: sql<string>`to_char(${outboundOrderTable.outboundDate}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)`,
        weight: sql<number>`COALESCE(sum(${outboundOrderTable.totalWeight}), 0)`,
        amount: sql<number>`COALESCE(sum(${outboundOrderTable.totalAmount}), 0)`,
      })
      .from(outboundOrderTable)
      .where(and(
        sql`${outboundOrderTable.cancelledAt} IS NULL`,
        gte(outboundOrderTable.outboundDate, new Date(dates[0])),
      ))
      .groupBy(sql`to_char(${outboundOrderTable.outboundDate}, 'YYYY-MM-DD')`);

    // 合并数据
    const inboundMap = new Map(inboundByDay.map((d: any) => [d.date, d]));
    const outboundMap = new Map(outboundByDay.map((d: any) => [d.date, d]));

    return dates.map(date => ({
      date,
      inbound: {
        count: Number((inboundMap.get(date) as any)?.count || 0),
        weight: Number((inboundMap.get(date) as any)?.weight || 0),
        amount: Number((inboundMap.get(date) as any)?.amount || 0),
      },
      outbound: {
        count: Number((outboundMap.get(date) as any)?.count || 0),
        weight: Number((outboundMap.get(date) as any)?.weight || 0),
        amount: Number((outboundMap.get(date) as any)?.amount || 0),
      },
    }));
  }
}

// 辅助函数
function lt(column: any, value: any) {
  return sql`${column} < ${value}`;
}

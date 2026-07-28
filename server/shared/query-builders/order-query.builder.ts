/**
 * 单据查询构建器 - 统一的单据查询条件构建
 * 
 * 设计原则：
 * 1. 统一使用 status 字段进行过滤
 * 2. 废弃 cancelledAt 字段的过滤逻辑（保留字段用于记录）
 * 3. 所有模块复用同一套逻辑
 */

import type { SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

/**
 * 单据状态筛选类型
 * - 'active': 只返回正常单据
 * - 'cancelled': 只返回已撤销单据
 * - 'all' | undefined: 返回全部单据
 */
export type OrderStatusFilter = 'active' | 'cancelled' | 'all';

/**
 * 单据查询条件构建器配置
 */
export interface OrderQueryBuilderConfig<T extends PgTable> {
  table: T;
  statusField: keyof T;
  cancelledAtField?: keyof T;
}

/**
 * 统一的单据状态过滤条件构建器
 */
export class OrderQueryBuilder {
  /**
   * 构建状态过滤条件
   * 
   * @param status 筛选状态
   * @param config 表配置
   * @returns SQL 条件或 undefined（不过滤）
   */
  static buildStatusCondition<T extends PgTable>(
    status: OrderStatusFilter | undefined,
    config: OrderQueryBuilderConfig<T>
  ): SQL<unknown> | undefined {
    if (!status || status === 'all') {
      return undefined;
    }

    const statusColumn = config.table[config.statusField] as unknown as { eq: (value: string) => SQL<unknown> };
    return statusColumn.eq(status);
  }

  /**
   * 构建统计查询的过滤条件（始终排除已撤销）
   * 
   * 重要：用于 Dashboard、Statistics 等统计场景
   */
  static buildStatsFilter<T extends PgTable>(
    config: OrderQueryBuilderConfig<T>
  ): SQL<unknown> {
    const statusColumn = config.table[config.statusField] as unknown as { eq: (value: string) => SQL<unknown> };
    return statusColumn.eq('active');
  }
}

/**
 * 状态统计信息
 */
export interface IOrderStatusStats {
  /** 总数量 */
  total: number;
  /** 正常单据数量 */
  active: number;
  /** 已撤销单据数量 */
  cancelled: number;
}

/**
 * 入库单查询参数
 */
export interface IInboundOrderQueryParams {
  /** 客户ID */
  customerId?: string;
  /** 状态筛选：all-全部(默认), active-正常, cancelled-已撤销 */
  status?: OrderStatusFilter;
  /** 开始日期 (YYYY-MM-DD) */
  startDate?: string;
  /** 结束日期 (YYYY-MM-DD) */
  endDate?: string;
  /** 页码 (1-based) */
  page?: number;
  /** 每页数量 (最大100) */
  pageSize?: number;
  /** 搜索关键词（单号/客户名称） */
  keyword?: string;
}

/**
 * 出库单查询参数
 */
export interface IOutboundOrderQueryParams {
  customerId?: string;
  status?: OrderStatusFilter;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  keyword?: string;
}

/**
 * 入库单列表响应
 */
export interface IInboundOrderListResponse {
  /** 单据列表 */
  items: IInboundOrder[];
  /** 状态统计 */
  stats: IOrderStatusStats;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 是否有更多数据 */
  hasMore: boolean;
}

/**
 * 出库单列表响应
 */
export interface IOutboundOrderListResponse {
  items: IOutboundOrder[];
  stats: IOrderStatusStats;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// 引入已有的类型定义
declare interface IInboundOrder {
  id: string;
  inboundNo: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  inboundDate: string;
  creator: string;
  totalAmount: number;
  totalQuantity: number;
  totalWeight: number;
  status: string;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

declare interface IOutboundOrder {
  id: string;
  outboundNo: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  outboundDate: string;
  creator: string;
  totalAmount: number;
  totalQuantity: number;
  totalWeight: number;
  status: string;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

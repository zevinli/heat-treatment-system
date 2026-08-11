/**
 * 前后端共享的 API 类型定义
 * 确保前后端接口契约一致
 */

// ======== 通用类型 ========

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// ======== 客户管理 ========

export interface Customer {
  id: string;
  code: string;
  name: string;
  contact?: string | null;
  phone?: string | null;
  address?: string | null;
  transport?: string | null;
  paymentTerm?: string | null;
  deliveryDirection?: string | null;
  settlement?: string | null;
  category?: string | null;
  inboundCount?: number;
  status?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedReason?: string | null;
}

export interface CreateCustomerDto {
  code: string;
  name: string;
  contact?: string;
  phone?: string;
  address?: string;
  transport?: string;
  paymentTerm?: string;
  deliveryDirection?: string;
  settlement?: string;
  category?: string;
  status?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  contact?: string;
  phone?: string;
  address?: string;
  transport?: string;
  paymentTerm?: string;
  deliveryDirection?: string;
  settlement?: string;
  category?: string;
  status?: string;
}

// ======== 产品管理 ========

export interface Product {
  id: string;
  code: string;
  name: string;
  material?: string | null;
  process?: string | null;
  techRequirement?: string | null;
  workpieceNo?: string | null;
  unit?: string | null;
  unitPrice?: number;
  unitPriceCents?: number;
  customerCode: string;
  customerName: string;
  stock: number;
  stockWeight: number;
  inboundQuantity?: number;
  inboundWeight?: number;
  inboundDate?: string | null;
  batchNo?: string | null;
  status?: 'complete' | 'incomplete' | 'archived';
  version?: number;
  warningThreshold?: number;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  archivedAt?: string | null;
  archivedReason?: string | null;
}

export interface CreateProductDto {
  code: string;
  name: string;
  material?: string;
  process?: string;
  techRequirement?: string;
  workpieceNo?: string;
  unit?: string;
  unitPrice?: number;
  customerCode: string;
  customerName: string;
  customerIds?: string[];
  status?: 'complete' | 'incomplete';
  warningThreshold?: number;
  attachments?: string[];
}

export interface UpdateProductDto {
  name?: string;
  material?: string;
  process?: string;
  techRequirement?: string;
  workpieceNo?: string;
  unit?: string;
  unitPrice?: number;
  customerCode?: string;
  customerName?: string;
  customerIds?: string[];
  status?: 'complete' | 'incomplete' | 'archived';
  warningThreshold?: number;
  attachments?: string[];
}

// ======== 库存管理 ========

export type InventoryChangeType =
  | 'inbound'
  | 'outbound'
  | 'outbound_rollback'
  | 'inbound_rollback'
  | 'adjustment_increase'
  | 'adjustment_decrease'
  | 'manual_increase'
  | 'manual_decrease'
  | 'inventory_profit'
  | 'inventory_loss'
  | 'damage'
  | 'quality_reject'
  | 'closed_balance'
  | 'return'
  | 'scrap'
  | 'rework';

export interface InventoryRecord {
  id: string;
  productId: string;
  productName: string;
  material?: string | null;
  process?: string | null;
  workpieceNo?: string | null;
  unit?: string | null;
  changeType: InventoryChangeType;
  quantityChange: number;
  weightChange: number;
  beforeStock: number;
  afterStock: number;
  beforeStockWeight: number;
  afterStockWeight: number;
  referenceNo?: string | null;
  customerCode?: string | null;
  customerName?: string | null;
  operator: string;
  remark: string;
  createdAt: string;
  attachments?: string[];
  originalInboundId?: string | null;
}

export interface InventorySummary {
  productId: string;
  productCode: string;
  productName: string;
  material?: string | null;
  process?: string | null;
  techRequirement?: string | null;
  workpieceNo?: string | null;
  unitPrice?: number;
  unit?: string | null;
  inboundQuantity?: number;
  inboundWeight?: number;
  currentStock: number;
  currentStockWeight: number;
  customerCode: string;
  customerName: string;
}

export interface AdjustStockDto {
  productId: string;
  quantityChange: number;
  weightChange?: number;
  operator: string;
  reason: 'inventory_profit' | 'inventory_loss' | 'damage' | 'quality_reject' | 'other';
  remark?: string;
  requiresApproval?: boolean;
}

// ======== 出库单 ========

export type OutboundOrderStatus =
  | 'pending_reconciliation'
  | 'reconciled'
  | 'invoiced'
  | 'paid'
  | 'cancelled';

export type LockStatus = 'unlocked' | 'locked';

export interface OutboundOrder {
  id: string;
  outboundNo: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  outboundDate: string;
  creator: string;
  receiver?: string | null;
  transporter?: string | null;
  plateNumber?: string | null;
  driver?: string | null;
  totalAmount: number;
  totalAmountCents?: number;
  totalQuantity: number;
  totalWeight: number;
  status: OutboundOrderStatus;
  lockStatus: LockStatus;
  lockedAt?: string | null;
  reconciliationId?: string | null;
  details: OutboundDetail[];
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  version?: number;
}

export interface OutboundDetail {
  id: string;
  outboundId: string;
  productId: string;
  productName: string;
  workpieceNo?: string | null;
  material?: string | null;
  process?: string | null;
  unit?: string | null;
  unitPrice?: number;
  quantity: number;
  weight: number;
  amount: number;
  batchNo?: string | null;
  inboundDate?: string | null;
  createdAt: string;
}

export interface CreateOutboundOrderDto {
  outboundNo: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  outboundDate: string;
  creator: string;
  receiver?: string;
  transporter?: string;
  plateNumber?: string;
  driver?: string;
  totalAmount: number;
  totalQuantity: number;
  totalWeight: number;
  details: Array<{
    productId: string;
    productName: string;
    workpieceNo?: string;
    material?: string;
    process?: string;
    unit?: string;
    unitPrice?: number;
    quantity: number;
    weight: number;
    amount: number;
    batchNo?: string;
    inboundDate?: string;
  }>;
}

// ======== 入库单 ========

export interface InboundOrder {
  id: string;
  inboundNo: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  inboundDate: string;
  inboundTime?: string;
  creator: string;
  internalCode?: string;
  receiver?: string;
  transporter?: string;
  plateNumber?: string;
  driver?: string;
  selfCode?: string;
  handler?: string;
  handleTime?: string;
  status: 'active' | 'cancelled';
  totalQuantity: number;
  totalWeight: number;
  totalAmount: number;
  details: InboundDetail[];
  createdAt: string;
  cancelledAt?: string | null;
  cancelReason?: string | null;
}

export interface InboundDetail {
  id: string;
  productId: string;
  productName: string;
  productModel?: string;
  productSpec?: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  weight: number;
  amount: number;
  inboundType?: string;
  process?: string;
  material?: string;
  techRequirement?: string;
  urgent?: boolean;
}

// ======== 对账单 ========

export type ReconciliationStatus =
  | 'draft'        // 草稿 - 可编辑
  | 'confirmed'    // 已确认 - 待审核
  | 'audited'      // 已审核 - 待开票
  | 'invoiced'     // 已开票 - 待回款
  | 'partial_paid' // 部分回款
  | 'paid'         // 已回款 - 完成
  | 'cancelled'    // 已取消
  | 'voided';      // 已作废 - 反审核后状态

export interface Reconciliation {
  id: string;
  reconciliationNo: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  month: string;
  status: ReconciliationStatus;
  totalAmount: number;
  totalAmountCents: number;
  deductionAmount: number;
  deductionAmountCents: number;
  otherAmount: number;
  otherAmountCents: number;
  compensationAmount: number;
  compensationAmountCents: number;
  finalAmount: number;
  finalAmountCents: number;
  invoiceAmount: number;
  invoiceAmountCents: number;
  uninvoiceAmount: number;
  receiptAmount: number;
  receiptAmountCents: number;
  unreceivedAmount: number;
  auditor?: string | null;
  auditedAt?: string | null;
  details: ReconciliationDetail[];
  outboundOrderIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationDetail {
  id: string;
  reconciliationId: string;
  outboundNo: string;
  outboundDate: string;
  productName: string;
  workpieceNo?: string | null;
  material?: string | null;
  process?: string | null;
  quantity: number;
  weight: number;
  unitPrice: number;
  amount: number;
  unit: string;
  createdAt: string;
}

export interface CreateReconciliationDto {
  reconciliationNo: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  month: string;
  status?: string;
  totalAmount: number;
  deductionAmount?: number;
  otherAmount?: number;
  compensationAmount?: number;
  finalAmount: number;
  outboundOrderIds: string[];
  details: Array<{
    outboundNo: string;
    outboundDate: string;
    productName: string;
    workpieceNo?: string;
    material?: string;
    process?: string;
    quantity: number;
    weight: number;
    unitPrice?: number;
    amount: number;
    unit?: string;
  }>;
}

// ======== 撤销操作 ========

export interface UndoCheckResult {
  canUndo: boolean;
  reason?: string;
  remainingSeconds?: number;
  usedBatches?: { batchNo: string; usedQty: number }[];
}

export interface UndoLog {
  id: string;
  entityType: string;
  entityId: string;
  operator: string;
  reason?: string | null;
  undoTime: string;
  originalData?: string | null;
  createdAt: string;
}

// ======== 操作日志 ========

export interface OperationLog {
  id: string;
  entityType: string;
  entityId: string;
  operation: string;
  operator: string;
  beforeState?: string | null;
  afterState?: string | null;
  source: string;
  ipAddress?: string | null;
  createdAt: string;
}

// ======== 批次管理 ========

export interface ProductBatch {
  id: string;
  batchNo: string;
  productId: string;
  inboundOrderId?: string | null;
  quantity: number;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

// ======== API 响应类型 ========

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ======== 对账单操作校验 ========

export interface ReconciliationActionCheckResult {
  allowed: boolean;
  reason?: string;
  invoiceCount?: number;
  receiptCount?: number;
}

export interface ReconciliationCalculationDetail {
  baseAmount: number;
  deductionAmount: number;
  deductionReason?: string;
  otherAmount: number;
  otherReason?: string;
  compensationAmount: number;
  compensationReason?: string;
  finalAmount: number;
  invoiceAmount: number;
  uninvoiceAmount: number;
  receiptAmount: number;
  unreceivedAmount: number;
  invoiceCount: number;
  receiptCount: number;
  formula: string;
}

// ======== 客户活跃度 ========

export interface CustomerActivityStats {
  customerId: string;
  customerName: string;
  totalInboundCount: number;
  monthlyInboundCount: number;
  lastInboundDate?: string | null;
  status: 'active' | 'normal' | 'silent';
}

export interface CustomerDeactivateCheckResult {
  canDeactivate: boolean;
  pendingOutboundCount: number;
  pendingReconciliationAmount: number;
  reason?: string;
}

// ======== 批次库存 ========

export interface BatchStockInfo {
  batchId: string;
  batchNo: string;
  quantityAvailable: number;
  weightAvailable: number;
  lockedQuantity: number;
  lockedWeight: number;
  status: 'active' | 'locked' | 'depleted' | 'expired';
}

export interface OutboundBatchSelection {
  batchId: string;
  batchNo: string;
  quantity: number;
  weight: number;
  inboundDate: string;
}

// ======== 库存预警 ========

export interface InventoryWarningConfig {
  productId: string;
  warningThreshold: number;
  warningWeightThreshold?: number;
  maxStorageDays: number;  // 最大存放天数，超期预警
}

export interface InventoryOverdueWarning {
  productId: string;
  productName: string;
  batchNo: string;
  inboundDate: string;
  storageDays: number;
  maxStorageDays: number;
  severity: 'warning' | 'danger';
}

// ======== 审批流程 ========

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalType = 'stock_adjust' | 'inbound_undo' | 'outbound_undo' | 'reconciliation_cancel';

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  entityType: string;
  entityId: string;
  requester: string;
  approver?: string | null;
  status: ApprovalStatus;
  reason: string;
  requestedAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectReason?: string | null;
}

// ======== 金额校验结果 ========

export interface AmountValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  details: {
    receiptAmount: number;
    invoiceAmount: number;
    finalAmount: number;
    remainingInvoice: number;
    remainingReceipt: number;
  };
}

// ======== 材质默认阈值配置 ========

export interface ProductMaterialThreshold {
  id: string;
  material: string;
  defaultThreshold: number;
  createdAt: string;
  updatedAt: string;
}

// ======== 管理控制台 ========

export interface DashboardStats {
  period: 'today' | 'week' | 'month' | 'year';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  stats: {
    inbound: {
      count: number;
      quantity: number;
      weight: number;
      amount: number;
      growth: {
        count: number;
        quantity: number;
      };
    };
    outbound: {
      count: number;
      quantity: number;
      weight: number;
      amount: number;
      growth: {
        count: number;
        amount: number;
      };
    };
    inventory: {
      totalStock: number;
      totalWeight: number;
      productCount: number;
      lowStockCount: number;
      zeroStockCount: number;
    };
    customers: {
      total: number;
      active: number;
      new: number;
    };
    pending: {
      reconciliation: number;
      receiptOrders: number;
      receiptAmount: number;
    };
  };
}

export interface RealtimeStats {
  today: {
    inbound: {
      count: number;
      weight: number;
    };
    outbound: {
      count: number;
      weight: number;
    };
  };
  alerts: {
    lowStock: Array<{
      id: string;
      code: string;
      name: string;
      stock: number;
      warningThreshold: number;
      customerName: string;
    }>;
  };
}

export interface DashboardActivity {
  id: string;
  type: 'inbound' | 'outbound' | 'product' | 'customer' | 'inventory' | 'reconciliation' | 'system';
  user: string;
  action: string;
  time: string;
}

export interface DashboardAlerts {
  inventory: {
    lowStock: number;
    overdue: number;
  };
  finance: {
    pendingReconciliation: number;
    pendingReceiptOrders: number;
    pendingReceiptAmount: number;
  };
}

export interface DashboardTrends {
  date: string;
  inbound: {
    count: number;
    weight: number;
    amount: number;
  };
  outbound: {
    count: number;
    weight: number;
    amount: number;
  };
}

// ======== 权限管理 ========

/**
 * 权限码定义
 * 命名规范: [资源]:[操作]
 */
export type PermissionCode =
  | 'customer:view' | 'customer:create' | 'customer:update' | 'customer:delete'
  | 'product:view' | 'product:create' | 'product:update' | 'product:delete'
  | 'inbound:view' | 'inbound:create' | 'inbound:undo'
  | 'outbound:view' | 'outbound:create' | 'outbound:delete' | 'outbound:undo'
  | 'inventory:view' | 'inventory:adjust' | 'inventory:request-adjust' | 'inventory:approve'
  | 'reconciliation:view' | 'reconciliation:create' | 'reconciliation:audit' | 'reconciliation:unaudit'
  | 'statistics:view'
  | 'system:settings' | 'system:permission';

export interface UserPermissions {
  permissions: PermissionCode[];
  roles: string[];
}

// ======== 单据状态筛选（撤销可见性优化） ========

/**
 * 单据状态筛选类型
 * - 'active': 只返回正常单据
 * - 'cancelled': 只返回已撤销单据
 * - 'all': 返回全部单据（默认）
 */
export type OrderStatusFilter = 'active' | 'cancelled' | 'all';

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
  items: InboundOrder[];
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
  items: OutboundOrder[];
  stats: IOrderStatusStats;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { Customer, Product, PaginatedResponse } from '@shared/api.interface';

// 重试配置
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1秒
  retryStatusCodes: [502, 503, 504], // 网关错误
};

// 通用重试函数
async function withRetry<T>(
  fn: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const statusCode = error?.response?.status;

      // 检查是否需要重试
      if (
        attempt < RETRY_CONFIG.maxRetries &&
        RETRY_CONFIG.retryStatusCodes.includes(statusCode)
      ) {
        logger.warn(
          `${operationName} 失败 (状态码: ${statusCode})，第 ${attempt + 1} 次重试...`
        );
        // 延迟后重试
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_CONFIG.retryDelay * (attempt + 1))
        );
        continue;
      }

      // 不需要重试的错误直接抛出
      throw error;
    }
  }

  throw lastError;
}

// ======== 客户管理 API ========

export async function getCustomers(params?: { search?: string; status?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<Customer>> {
  return withRetry(async () => {
    const response = await axiosForBackend({
      url: '/api/customers',
      method: 'GET',
      params,
    });
    return response.data;
  }, '获取客户列表');
}

export async function getCustomerById(id: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/customers/${id}`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取客户详情失败', error);
    throw error;
  }
}

export interface AuthUserRecord {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'operator' | 'finance' | 'viewer';
  department?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  position?: string | null;
  location?: string | null;
  status?: 'active' | 'inactive';
  deviceLimit: number;
  lastLogin?: string | null;
  createdAt?: string | null;
}

export async function getMyProfile(): Promise<AuthUserRecord> {
  const response = await axiosForBackend({ url: '/api/auth/me', method: 'GET' });
  return response.data;
}

export async function updateMyProfile(data: {
  name?: string; email?: string; phone?: string; avatar?: string;
  department?: string; position?: string; location?: string;
}): Promise<AuthUserRecord> {
  const response = await axiosForBackend({ url: '/api/auth/me', method: 'PUT', data });
  return response.data;
}

export async function changeMyPassword(currentPassword: string, newPassword: string) {
  const response = await axiosForBackend({
    url: '/api/auth/me/password', method: 'PUT', data: { currentPassword, newPassword },
  });
  return response.data;
}

export async function getAuthUsers(): Promise<AuthUserRecord[]> {
  const response = await axiosForBackend({ url: '/api/auth/users', method: 'GET' });
  return response.data;
}

export async function createAuthUser(data: {
  username: string; password: string; name: string; role: string; department?: string; deviceLimit?: number;
}): Promise<AuthUserRecord> {
  const response = await axiosForBackend({ url: '/api/auth/users', method: 'POST', data });
  return response.data;
}

export async function updateAuthUser(id: string, data: {
  name?: string; role?: string; department?: string; status?: 'active' | 'inactive'; deviceLimit?: number;
}): Promise<AuthUserRecord> {
  const response = await axiosForBackend({ url: `/api/auth/users/${id}`, method: 'PUT', data });
  return response.data;
}

export async function resetAuthUserPassword(id: string, password: string) {
  const response = await axiosForBackend({ url: `/api/auth/users/${id}/password`, method: 'PUT', data: { password } });
  return response.data;
}

export async function createCustomer(data: {
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
}) {
  try {
    const response = await axiosForBackend({
      url: '/api/customers',
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('创建客户失败', error);
    throw error;
  }
}

export async function updateCustomer(
  id: string,
  data: {
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
) {
  try {
    const response = await axiosForBackend({
      url: `/api/customers/${id}`,
      method: 'PUT',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('更新客户失败', error);
    throw error;
  }
}

export async function deleteCustomer(id: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/customers/${id}`,
      method: 'DELETE',
    });
    return response.data;
  } catch (error) {
    logger.error('删除客户失败', error);
    throw error;
  }
}

// ======== 产品管理 API ========

export async function getProducts(params?: {
  search?: string;
  customerCode?: string;
  status?: string;
  material?: string;
  process?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<Product>> {
  try {
    const response = await axiosForBackend({
      url: '/api/products',
      method: 'GET',
      params,
    });
    return response.data;
  } catch (error) {
    logger.error('获取产品列表失败', error);
    throw error;
  }
}

export async function getProductById(id: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/products/${id}`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取产品详情失败', error);
    throw error;
  }
}

export async function createProduct(data: {
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
  status?: string;
}) {
  try {
    const response = await axiosForBackend({
      url: '/api/products',
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('创建产品失败', error);
    throw error;
  }
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    material?: string;
    process?: string;
    techRequirement?: string;
    workpieceNo?: string;
    unit?: string;
    unitPrice?: number;
    customerCode?: string;
    customerName?: string;
    status?: string;
    stock?: number;
    stockWeight?: number;
    inboundQuantity?: number;
    inboundWeight?: number;
  }
) {
  try {
    const response = await axiosForBackend({
      url: `/api/products/${id}`,
      method: 'PUT',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('更新产品失败', error);
    throw error;
  }
}

export async function deleteProduct(id: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/products/${id}`,
      method: 'DELETE',
    });
    return response.data;
  } catch (error) {
    logger.error('删除产品失败', error);
    throw error;
  }
}

// 批量删除产品
export async function batchDeleteProducts(ids: string[]) {
  try {
    const response = await axiosForBackend({
      url: '/api/products/batch-delete',
      method: 'POST',
      data: { ids },
    });
    return response.data;
  } catch (error) {
    logger.error('批量删除产品失败', error);
    throw error;
  }
}

// 批量更新产品预警阈值
export async function batchUpdateProductThreshold(productIds: string[], warningThreshold: number) {
  try {
    const response = await axiosForBackend({
      url: '/api/products/batch-update-threshold',
      method: 'POST',
      data: { productIds, warningThreshold },
    });
    return response.data;
  } catch (error) {
    logger.error('批量更新预警阈值失败', error);
    throw error;
  }
}

// 获取待完善产品列表
export async function getIncompleteProducts(limit?: number) {
  try {
    const response = await axiosForBackend({
      url: '/api/products/incomplete',
      method: 'GET',
      params: { limit },
    });
    return response.data;
  } catch (error) {
    logger.error('获取待完善产品失败', error);
    throw error;
  }
}

// 获取材质默认阈值配置
export async function getMaterialThresholds() {
  try {
    const response = await axiosForBackend({
      url: '/api/products/material-thresholds',
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取材质阈值配置失败', error);
    throw error;
  }
}

// 设置材质默认阈值
export async function setMaterialThreshold(material: string, threshold: number) {
  try {
    const response = await axiosForBackend({
      url: '/api/products/material-thresholds',
      method: 'PUT',
      data: { material, threshold },
    });
    return response.data;
  } catch (error) {
    logger.error('设置材质阈值失败', error);
    throw error;
  }
}

// ======== 撤销 API ========

export async function canUndoOutbound(orderId: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/undo/outbound/${orderId}/can-undo`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('检查出库单撤销状态失败', error);
    throw error;
  }
}

export async function canUndoInbound(orderId: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/undo/inbound/${orderId}/can-undo`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('检查入库单撤销状态失败', error);
    throw error;
  }
}

// ======== 库存管理 API ========

export async function getInventorySummary(params?: {
  search?: string;
  customerCode?: string;
  material?: string;
  minStock?: number;
  page?: number;
  pageSize?: number;
}) {
  try {
    const response = await axiosForBackend({
      url: '/api/inventory/summary',
      method: 'GET',
      params,
    });
    return response.data;
  } catch (error) {
    logger.error('获取库存汇总失败', error);
    throw error;
  }
}

export async function getInventoryRecords(params?: {
  productId?: string;
  changeType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const response = await axiosForBackend({
      url: '/api/inventory/records',
      method: 'GET',
      params,
    });
    return response.data;
  } catch (error) {
    logger.error('获取库存记录失败', error);
    throw error;
  }
}

export async function adjustStock(data: {
  productId: string;
  quantityChange: number;
  weightChange?: number;
  reason: 'inventory_profit' | 'inventory_loss' | 'damage' | 'quality_reject' | 'other';
  remark?: string;
}) {
  try {
    const response = await axiosForBackend({
      url: '/api/inventory/adjust',
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('调整库存失败', error);
    throw error;
  }
}

export type InventoryAdjustmentRequest = {
  id: string;
  entityId: string;
  requester: string;
  reason: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  payload?: {
    productId: string;
    quantityChange: number;
    weightChange: number;
    reason: string;
    remark?: string;
  };
  requestedAt: string;
  approver?: string;
  rejectReason?: string;
};

export async function requestInventoryAdjustment(data: {
  productId: string;
  quantityChange: number;
  weightChange?: number;
  reason: 'inventory_profit' | 'inventory_loss' | 'damage' | 'quality_reject' | 'other';
  remark?: string;
}) {
  const response = await axiosForBackend({ url: '/api/inventory/adjustment-requests', method: 'POST', data });
  return response.data;
}

export async function getInventoryAdjustmentRequests(status?: string): Promise<InventoryAdjustmentRequest[]> {
  const response = await axiosForBackend({ url: '/api/inventory/adjustment-requests', method: 'GET', params: { status } });
  return response.data;
}

export async function decideInventoryAdjustment(id: string, approved: boolean, rejectReason?: string): Promise<void> {
  await axiosForBackend({
    url: `/api/inventory/adjustment-requests/${id}`,
    method: 'PUT',
    data: { approved, rejectReason },
  });
}

export async function getSystemOperationLogs() {
  const response = await axiosForBackend({ url: '/api/permissions/logs', method: 'GET' });
  return response.data;
}

// ======== 出库单管理 API ========

export async function getOutboundOrders(params?: {
  customerId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const response = await axiosForBackend({
      url: '/api/outbound',
      method: 'GET',
      params,
    });
    return response.data;
  } catch (error) {
    logger.error('获取出库单列表失败', error);
    throw error;
  }
}

export async function getOutboundOrderById(id: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/outbound/${id}`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取出库单详情失败', error);
    throw error;
  }
}

export async function createOutboundOrder(data: {
  outboundNo?: string;
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
}) {
  try {
    const response = await axiosForBackend({
      url: '/api/outbound',
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('创建出库单失败', error);
    throw error;
  }
}

export async function getPendingReconciliationOrders(customerId: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/outbound/pending/${customerId}`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取待对账出库单失败', error);
    throw error;
  }
}

export async function updateOutboundOrderStatus(id: string, status: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/outbound/${id}/status`,
      method: 'PUT',
      data: { status },
    });
    return response.data;
  } catch (error) {
    logger.error('更新出库单状态失败', error);
    throw error;
  }
}

export async function cancelOutboundOrder(id: string, reason?: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/undo/outbound/${id}`,
      method: 'POST',
      data: { reason: reason || '用户撤销' },
    });
    return response.data;
  } catch (error) {
    logger.error('撤销出库单失败', error);
    throw error;
  }
}

// ======== 入库单管理 API ========

export async function getInboundOrders(params?: {
  customerId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const response = await axiosForBackend({
      url: '/api/inbound',
      method: 'GET',
      params,
    });
    return response.data;
  } catch (error) {
    logger.error('获取入库单列表失败', error);
    throw error;
  }
}

export async function getInboundOrderById(id: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/inbound/${id}`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取入库单详情失败', error);
    throw error;
  }
}

export async function createInboundOrder(data: {
  inboundNo?: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  inboundDate: string;
  inboundTime?: string;
  creator?: string;
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
    productModel?: string;
    productSpec?: string;
    unit?: string;
    unitPrice?: number;
    quantity: number;
    weight: number;
    amount: number;
    inboundType?: string;
    process?: string;
    material?: string;
    techRequirement?: string;
    urgent?: boolean;
  }>;
}) {
  try {
    const response = await axiosForBackend({
      url: '/api/inbound',
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('创建入库单失败', error);
    throw error;
  }
}

export async function cancelInboundOrder(id: string, reason?: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/undo/inbound/${id}`,
      method: 'POST',
      data: { reason: reason || '用户撤销' },
    });
    return response.data;
  } catch (error) {
    logger.error('撤销入库单失败', error);
    throw error;
  }
}

export async function checkInboundCanCancel(id: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/undo/inbound/${id}/can-undo`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('检查入库单可撤销状态失败', error);
    throw error;
  }
}

// ======== 对账单管理 API ========

export async function getReconciliations(params?: {
  search?: string;
  customerId?: string;
  status?: string;
  month?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const response = await axiosForBackend({
      url: '/api/reconciliations',
      method: 'GET',
      params,
    });
    return response.data;
  } catch (error) {
    logger.error('获取对账单列表失败', error);
    throw error;
  }
}

export async function getReconciliationById(id: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/reconciliations/${id}/amounts`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取对账单详情失败', error);
    throw error;
  }
}

export async function createReconciliation(data: {
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
}) {
  try {
    const response = await axiosForBackend({
      url: '/api/reconciliations',
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('创建对账单失败', error);
    throw error;
  }
}

export async function updateReconciliation(
  id: string,
  data: {
    deductionAmount?: number;
    otherAmount?: number;
    compensationAmount?: number;
    finalAmount?: number;
    unreceivedAmount?: number;
  }
) {
  try {
    const response = await axiosForBackend({
      url: `/api/reconciliations/${id}`,
      method: 'PUT',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('更新对账单失败', error);
    throw error;
  }
}

export async function deleteReconciliation(id: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/reconciliations/${id}`,
      method: 'DELETE',
    });
    return response.data;
  } catch (error) {
    logger.error('删除对账单失败', error);
    throw error;
  }
}

export async function recordInvoice(id: string, amount: number) {
  try {
    const response = await axiosForBackend({
      url: `/api/reconciliations/${id}/invoice`,
      method: 'PUT',
      data: { amount },
    });
    return response.data;
  } catch (error) {
    logger.error('记录开票失败', error);
    throw error;
  }
}

export async function recordReceipt(id: string, amount: number) {
  try {
    const response = await axiosForBackend({
      url: `/api/reconciliations/${id}/receipt`,
      method: 'PUT',
      data: { amount },
    });
    return response.data;
  } catch (error) {
    logger.error('记录回款失败', error);
    throw error;
  }
}

// 检查对账单可操作状态
export async function checkReconciliationAction(id: string, action: 'delete' | 'unaudit') {
  try {
    const response = await axiosForBackend({
      url: `/api/reconciliations/${id}/check-action`,
      method: 'GET',
      params: { action },
    });
    return response.data;
  } catch (error) {
    logger.error('检查对账单操作状态失败', error);
    throw error;
  }
}

// 获取对账单金额计算明细
export async function getReconciliationCalculation(id: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/reconciliations/${id}/calculation`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取对账单计算明细失败', error);
    throw error;
  }
}

// 审核对账单
export async function auditReconciliation(id: string, auditor: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/reconciliations/${id}/audit`,
      method: 'PUT',
      data: { auditor },
    });
    return response.data;
  } catch (error) {
    logger.error('审核对账单失败', error);
    throw error;
  }
}

export async function confirmReconciliation(id: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/reconciliations/${id}/confirm`,
      method: 'PUT',
    });
    return response.data;
  } catch (error) {
    logger.error('确认对账单失败', error);
    throw error;
  }
}

// 反审核对账单（原因必填，至少10个字）
export async function unauditReconciliation(id: string, reason: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/reconciliations/${id}/unaudit`,
      method: 'PUT',
      data: { reason },
    });
    return response.data;
  } catch (error) {
    logger.error('反审核对账单失败', error);
    throw error;
  }
}

// 获取对账单历史版本
export async function getReconciliationHistory(id: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/reconciliations/${id}/history`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取对账单历史版本失败', error);
    throw error;
  }
}

// ======== 客户活跃度 API ========

// 获取客户活跃度统计
export async function getCustomerActivity(id: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/customers/${id}/activity`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取客户活跃度失败', error);
    throw error;
  }
}

// 检查客户是否可以停用
export async function checkCanDeactivateCustomer(id: string) {
  try {
    const response = await axiosForBackend({
      url: `/api/customers/${id}/can-deactivate`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('检查客户停用状态失败', error);
    throw error;
  }
}

// ======== 系统设置 API ========

// 清空数据库 - 恢复初始化设置
export async function resetDatabase() {
  try {
    const response = await axiosForBackend({
      url: '/api/permissions/reset-database',
      method: 'POST',
    });
    return response.data;
  } catch (error) {
    logger.error('清空数据库失败', error);
    throw error;
  }
}

// ======== 语音录入 API ========

export interface VoiceParseResult {
  success: boolean;
  data?: {
    productName?: string;
    quantity?: number;
    weight?: number;
    unit?: string;
    unitPrice?: number;
    material?: string;
    process?: string;
    customerName?: string;
    remark?: string;
  };
  rawText: string;
  error?: string;
}

export async function parseVoiceInput(
  text: string,
  context: 'inbound' | 'outbound' | 'inventory' = 'inbound'
): Promise<VoiceParseResult> {
  try {
    const response = await axiosForBackend({
      url: '/api/voice/parse',
      method: 'POST',
      data: { text, context },
    });
    return response.data;
  } catch (error) {
    logger.error('语音解析失败', error);
    throw error;
  }
}

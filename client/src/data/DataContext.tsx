import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import * as api from '@/api';
import type { ICustomer, IProduct, IOperationLog, IFeatureConfig } from './mockData';
import { logger } from '@lark-apaas/client-toolkit/logger';

const PAGE_SIZE = 500;

async function loadAllPages<T>(loader: (page: number, pageSize: number) => Promise<any>): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; page <= 50; page++) {
    const response = await loader(page, PAGE_SIZE);
    const items: T[] = Array.isArray(response) ? response : (response?.items || []);
    all.push(...items);
    if (Array.isArray(response) || items.length < PAGE_SIZE) return all;
    const total = Number(response?.total ?? response?.stats?.total);
    if (Number.isFinite(total) && all.length >= total) return all;
    if (response?.hasMore === false) return all;
  }
  throw new Error('数据量超过25000条，请使用筛选条件缩小范围');
}

// 重新导出类型
export type { ICustomer, IProduct, ProductStatus, IOperationLog, IFeatureConfig } from './mockData';

// 实验功能配置类型
interface FeatureItem {
  enabled: boolean;
}

interface FeatureConfigMap {
  voiceInput: FeatureItem;
  aiRecognition: FeatureItem;
}

// ========== 入库单类型 ==========
export interface IInboundOrder {
  id: string;
  inboundNo: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  inboundDate: string;
  inboundTime: string;
  creator: string;
  internalCode: string;
  receiver: string;
  transporter: string;
  plateNumber: string;
  driver: string;
  selfCode: string;
  handler: string;
  handleTime: string;
  status: 'active' | 'cancelled';
  details: IInboundDetail[];
  totalQuantity: number;
  totalWeight: number;
  totalAmount: number;
  createdAt: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface IInboundDetail {
  id: string;
  productId: string;
  productName: string;
  productModel: string;
  productSpec: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  weight: number;
  amount: number;
  inboundType: string;
  process: string;
  material: string;
  techRequirement: string;
  urgent: boolean;
  attachments?: string[];
}

// ========== 撤销检查类型 ==========
export interface IUndoCheckResult {
  canUndo: boolean;
  reason?: string;
  timeRemaining?: number;
}

// ========== 库存变动记录类型 ==========
export interface IInventoryRecord {
  id: string;
  productId: string;
  productName: string;
  material: string;
  process: string;
  workpieceNo: string;
  unit: string;
  // 修复：使用完整的库存变动类型
  changeType: 
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
    | 'closed_balance';
  quantityChange: number;
  weightChange: number;
  beforeStock: number;
  afterStock: number;
  beforeStockWeight: number;
  afterStockWeight: number;
  referenceNo?: string;
  customerCode?: string;
  customerName?: string;
  operator: string;
  remark: string;
  // 修复：添加原入库单ID字段用于撤销关联
  originalInboundId?: string | null;
  createdAt: string;
}

// ========== 库存汇总项 ==========
export interface IInventorySummary {
  productId: string;
  productCode: string;
  productName: string;
  material: string;
  process: string;
  techRequirement: string;
  workpieceNo: string;
  unitPrice: number;
  unit: string;
  inboundQuantity: number;
  inboundWeight: number;
  currentStock: number;
  currentStockWeight: number;
  customerCode: string;
  customerName: string;
  warningThreshold: number; // 数量预警阈值
  warningWeightThreshold?: number; // 重量预警阈值(kg计价产品使用)
}

// ========== 出库单类型 ==========
export interface IOutboundOrder {
  id: string;
  outboundNo: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  outboundDate: string;
  creator: string;
  receiver: string;
  transporter: string;
  plateNumber: string;
  driver: string;
  totalAmount: number;
  totalQuantity: number;
  totalWeight: number;
  status: 'pending_reconciliation' | 'reconciled' | 'invoiced' | 'paid' | 'cancelled';
  details: IOutboundDetail[];
  createdAt: string;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  version?: number;
}

export interface IOutboundDetail {
  id: string;
  productId: string;
  productName: string;
  workpieceNo: string;
  material: string;
  process: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  weight: number;
  amount: number;
  batchNo: string;
  // 服务端按实际扣减批次回填；新建出库请求不应由前端猜测批次日期。
  inboundDate?: string;
}

// ========== 对账单类型 ==========
// 修复：添加partial_paid状态
export type ReconciliationStatus = 'draft' | 'confirmed' | 'audited' | 'invoiced' | 'partial_paid' | 'paid' | 'cancelled' | 'voided';

export interface IReconciliation {
  id: string;
  reconciliationNo: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  month: string;
  status: ReconciliationStatus;
  totalAmount: number;
  deductionAmount: number;
  otherAmount: number;
  compensationAmount: number;
  finalAmount: number;
  invoiceAmount: number;
  uninvoiceAmount: number;
  receiptAmount: number;
  unreceivedAmount: number;
  details: IReconciliationDetail[];
  outboundOrderIds: string[];
}

export interface IReconciliationDetail {
  id: string;
  reconciliationId?: string;
  outboundNo: string;
  outboundDate: string;
  productName: string;
  workpieceNo: string;
  material: string;
  process: string;
  quantity: number;
  weight: number;
  unitPrice: number;
  amount: number;
  unit: string;
}

// ========== Context 类型定义 ==========
interface DataContextType {
  // 客户数据
  customers: ICustomer[];
  setCustomers: React.Dispatch<React.SetStateAction<ICustomer[]>>;
  addCustomer: (customer: Omit<ICustomer, 'id'>) => Promise<ICustomer>;
  updateCustomer: (id: string, data: Partial<ICustomer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  refreshCustomers: () => Promise<void>;

  // 产品数据
  products: IProduct[];
  setProducts: React.Dispatch<React.SetStateAction<IProduct[]>>;
  addProduct: (product: Omit<IProduct, 'id' | 'stock' | 'inboundQuantity' | 'inboundWeight' | 'inboundDate' | 'batchNo'>) => Promise<IProduct>;
  updateProduct: (id: string, data: Partial<IProduct>) => Promise<IProduct>;
  deleteProduct: (id: string) => Promise<void>;
  batchDeleteProducts: (ids: string[]) => Promise<{ success: string[]; failed: { id: string; reason: string }[] }>;
  refreshProducts: () => Promise<void>;

  // 库存变动记录
  inventoryRecords: IInventoryRecord[];
  addInventoryRecord: (record: Omit<IInventoryRecord, 'id' | 'createdAt'>) => Promise<void>;
  deleteInventoryRecord: (id: string) => void;
  refreshInventoryRecords: () => Promise<void>;

  getInventorySummary: () => IInventorySummary[];

  // 出库单
  outboundOrders: IOutboundOrder[];
  addOutboundOrder: (order: Omit<IOutboundOrder, 'id' | 'createdAt' | 'status' | 'outboundNo'> & { outboundNo?: string }) => Promise<IOutboundOrder>;
  updateOutboundOrder: (id: string, data: Partial<IOutboundOrder>) => Promise<void>;
  cancelOutboundOrder: (id: string, reason?: string) => Promise<void>;
  getPendingReconciliationOrders: (customerId: string) => Promise<IOutboundOrder[]>;
  refreshOutboundOrders: () => Promise<void>;

  // 对账单
  reconciliations: IReconciliation[];
  addReconciliation: (reconciliation: Omit<IReconciliation, 'id'>) => Promise<IReconciliation>;
  updateReconciliation: (id: string, data: Partial<IReconciliation>) => Promise<void>;
  deleteReconciliation: (id: string, outboundOrderIds?: string[]) => Promise<void>;
  confirmReconciliation: (id: string) => Promise<void>;
  auditReconciliation: (id: string, auditorName: string) => Promise<void>;
  unauditReconciliation: (id: string, reason?: string) => Promise<void>;
  recordInvoice: (id: string, amount: number) => Promise<void>;
  recordReceipt: (id: string, amount: number) => Promise<void>;
  refreshReconciliations: () => Promise<void>;

  // 入库单
  inboundOrders: IInboundOrder[];
  addInboundOrder: (order: Omit<IInboundOrder, 'id' | 'createdAt' | 'status' | 'inboundNo'> & { inboundNo?: string }) => Promise<IInboundOrder>;
  cancelInboundOrder: (id: string, reason?: string) => Promise<boolean>;
  checkCanUndo: (inboundOrderId: string) => Promise<IUndoCheckResult>;
  refreshInboundOrders: () => Promise<void>;

  // 操作日志
  operationLogs: IOperationLog[];
  addOperationLog: (log: Omit<IOperationLog, 'id' | 'createdAt'>) => Promise<void>;
  getEntityLogs: (entityType: string, entityId: string) => IOperationLog[];
  refreshOperationLogs: () => Promise<void>;

  // 实验功能配置
  featureConfig: FeatureConfigMap;
  toggleFeature: (feature: 'voiceInput' | 'aiRecognition') => void;

  // 防抖缓存工具
  getCachedCustomerProducts: (customerCode: string) => IProduct[] | null;
  setCachedCustomerProducts: (customerCode: string, products: IProduct[]) => void;
  invalidateProductCache: (customerCode?: string) => void;

  // 加载状态
  loading: boolean;

  // ======== 新增方法 ========

  // 产品预警阈值
  batchUpdateProductThreshold: (productIds: string[], warningThreshold: number) => Promise<void>;
  getIncompleteProducts: (limit?: number) => Promise<IProduct[]>;
  getMaterialThresholds: () => Promise<Record<string, number>>;
  setMaterialThreshold: (material: string, threshold: number) => Promise<void>;

  // 对账单操作校验
  checkReconciliationAction: (id: string, action: 'delete' | 'unaudit') => Promise<{ allowed: boolean; reason?: string; invoiceCount?: number; receiptCount?: number }>;
  getReconciliationCalculation: (id: string) => Promise<{
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
  }>;

  // 客户活跃度
  getCustomerActivity: (id: string) => Promise<{
    customerId: string;
    customerName: string;
    totalInboundCount: number;
    monthlyInboundCount: number;
    lastInboundDate?: string | null;
    status: 'active' | 'normal' | 'silent';
  }>;
  checkCanDeactivateCustomer: (id: string) => Promise<{
    canDeactivate: boolean;
    pendingOutboundCount: number;
    pendingReconciliationAmount: number;
    reason?: string;
  }>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// 生成ID
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// 获取带随机数的唯一后缀 - 使用 crypto.randomUUID 和性能计时器确保唯一性
const getUniqueSuffix = (): string => {
  const timestamp = Date.now().toString(36).slice(-4);
  // 使用性能计时器微秒部分增加随机性
  const perf = typeof performance !== 'undefined' ? Math.floor(performance.now() % 1000).toString(36) : '';
  // 使用 crypto.randomUUID 的后8位作为随机部分
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  return `${timestamp}${perf}${random}`.toUpperCase();
};

// 生成出库单号 - CK + 年月日6位 + 时分4位 + 随机4位 + 计数2位
const generateOutboundNo = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
  const timeStr = date.toTimeString().slice(0, 5).replace(/:/g, ''); // HHMM
  const uniqueSuffix = getUniqueSuffix();
  return `CK${dateStr}${timeStr}${uniqueSuffix}`.toUpperCase();
};

// 生成对账单号 - DZ + 年月日6位 + 时分4位 + 随机4位 + 计数2位
const generateReconciliationNo = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
  const timeStr = date.toTimeString().slice(0, 5).replace(/:/g, ''); // HHMM
  const uniqueSuffix = getUniqueSuffix();
  return `DZ${dateStr}${timeStr}${uniqueSuffix}`.toUpperCase();
};

// 生成入库单号 - RK + 年月日6位 + 时分4位 + 随机4位 + 计数2位
const generateInboundNo = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
  const timeStr = date.toTimeString().slice(0, 5).replace(/:/g, ''); // HHMM
  const uniqueSuffix = getUniqueSuffix();
  return `RK${dateStr}${timeStr}${uniqueSuffix}`.toUpperCase();
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  
  // 基础数据
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);

  // 库存变动记录
  const [inventoryRecords, setInventoryRecords] = useState<IInventoryRecord[]>([]);

  // 出库单记录
  const [outboundOrders, setOutboundOrders] = useState<IOutboundOrder[]>([]);

  // 对账单记录
  const [reconciliations, setReconciliations] = useState<IReconciliation[]>([]);

  // 入库单记录
  const [inboundOrders, setInboundOrders] = useState<IInboundOrder[]>([]);

  // 操作日志记录
  const [operationLogs, setOperationLogs] = useState<IOperationLog[]>([]);

  // 实验功能配置
  const [featureConfig, setFeatureConfig] = useState<FeatureConfigMap>({
    voiceInput: { enabled: false },
    aiRecognition: { enabled: false },
  });

  // 客户产品缓存
  const productCache = useRef<Map<string, { products: IProduct[]; timestamp: number }>>(new Map());
  const CACHE_TTL = 60 * 60 * 1000; // 1小时过期

  // ========== 数据加载 ==========
  const refreshCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await loadAllPages<any>((page, pageSize) => api.getCustomers({ page, pageSize }));
      setCustomers(data.map(item => ({
        id: item.id,
        code: item.code,
        name: item.name,
        contact: item.contact || '',
        phone: item.phone || '',
        address: item.address || '',
        transport: item.transport || '',
        paymentTerm: item.paymentTerm || '',
        deliveryDirection: item.deliveryDirection || '',
        settlement: item.settlement || '',
        category: item.category || '',
        inboundCount: item.inboundCount || 0,
        status: item.status === 'inactive' ? 'inactive' : 'active',
      })));
    } catch (error) {
      logger.error('加载客户数据失败', error);
      toast.error('加载客户数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await loadAllPages<any>((page, pageSize) => api.getProducts({ page, pageSize }));
      setProducts(data.map(item => ({
        id: item.id,
        code: item.code,
        name: item.name,
        material: item.material || '',
        process: item.process || '',
        techRequirement: item.techRequirement || '',
        workpieceNo: item.workpieceNo || '',
        unit: item.unit || '件',
        unitPrice: item.unitPrice || 0,
        customerCode: item.customerCode,
        customerName: item.customerName,
        stock: item.stock || 0,
        stockWeight: item.stockWeight || 0,
        inboundQuantity: item.inboundQuantity || 0,
        inboundWeight: item.inboundWeight || 0,
        inboundDate: item.inboundDate || '',
        batchNo: item.batchNo || '',
        status: item.status === 'incomplete' ? 'incomplete' : 'complete',
        warningThreshold: item.warningThreshold,
        attachments: item.attachments,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })));
    } catch (error) {
      logger.error('加载产品数据失败', error);
      toast.error('加载产品数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshInventoryRecords = useCallback(async () => {
    try {
      const data = await loadAllPages<IInventoryRecord>((page, pageSize) => api.getInventoryRecords({ page, pageSize }));
      setInventoryRecords(data);
    } catch (error) {
      logger.error('加载库存记录失败', error);
    }
  }, []);

  const refreshOutboundOrders = useCallback(async () => {
    try {
      const data = await loadAllPages<IOutboundOrder>((page, pageSize) => api.getOutboundOrders({ page, pageSize }));
      setOutboundOrders(data);
    } catch (error) {
      logger.error('加载出库单失败', error);
    }
  }, []);

  const refreshInboundOrders = useCallback(async () => {
    try {
      const data = await loadAllPages<IInboundOrder>((page, pageSize) => api.getInboundOrders({ page, pageSize }));
      setInboundOrders(data);
    } catch (error) {
      logger.error('加载入库单失败', error);
    }
  }, []);

  const refreshReconciliations = useCallback(async () => {
    try {
      const data = await loadAllPages<IReconciliation>((page, pageSize) => api.getReconciliations({ page, pageSize }));
      setReconciliations(data);
    } catch (error) {
      logger.error('加载对账单失败', error);
    }
  }, []);

  // 初始化加载数据
  useEffect(() => {
    refreshCustomers();
    refreshProducts();
    refreshInboundOrders();
    refreshOutboundOrders();
    refreshReconciliations();
    refreshInventoryRecords();
  }, [refreshCustomers, refreshProducts, refreshInboundOrders, refreshOutboundOrders, refreshReconciliations, refreshInventoryRecords]);

  // ========== 客户管理 ==========
  const addCustomer = useCallback(async (customer: Omit<ICustomer, 'id'>) => {
    try {
      const newCustomer = await api.createCustomer(customer);
      setCustomers(prev => [...prev, newCustomer]);
      toast.success('客户创建成功');
      return newCustomer;
    } catch (error: any) {
      toast.error(error.message || '创建客户失败');
      throw error;
    }
  }, []);

  const updateCustomer = useCallback(async (id: string, data: Partial<ICustomer>) => {
    try {
      await api.updateCustomer(id, data);
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      toast.success('客户更新成功');
    } catch (error: any) {
      toast.error(error.message || '更新客户失败');
      throw error;
    }
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    try {
      await api.deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      toast.success('客户删除成功');
    } catch (error: any) {
      toast.error(error.message || '删除客户失败');
      throw error;
    }
  }, []);

  // ========== 产品管理 ==========
  const addProduct = useCallback(async (product: Omit<IProduct, 'id' | 'stock' | 'inboundQuantity' | 'inboundWeight' | 'inboundDate' | 'batchNo'>) => {
    try {
      const newProduct = await api.createProduct(product);
      setProducts(prev => [...prev, newProduct]);
      toast.success('产品创建成功');
      return newProduct;
    } catch (error: any) {
      toast.error(error.message || '创建产品失败');
      throw error;
    }
  }, []);

  const updateProduct = useCallback(async (id: string, data: Partial<IProduct>) => {
    try {
      const updatedProduct = await api.updateProduct(id, data);
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      toast.success('产品更新成功');
      return updatedProduct;
    } catch (error: any) {
      toast.error(error.message || '更新产品失败');
      throw error;
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('产品删除成功');
    } catch (error: any) {
      toast.error(error.message || '删除产品失败');
      throw error;
    }
  }, []);

  // 批量删除产品
  const batchDeleteProducts = useCallback(async (ids: string[]) => {
    try {
      const result = await api.batchDeleteProducts(ids);
      // 更新本地状态，移除已成功删除的产品
      setProducts(prev => prev.filter(p => !result.results.success.includes(p.id)));
      
      if (result.failedCount > 0) {
        toast.warning(`成功删除 ${result.successCount} 个产品，${result.failedCount} 个产品删除失败`);
      } else {
        toast.success(`成功删除 ${result.successCount} 个产品`);
      }
      
      return result.results;
    } catch (error: any) {
      toast.error(error.message || '批量删除产品失败');
      throw error;
    }
  }, []);

  // ========== 库存记录管理 ==========
  const addInventoryRecord = useCallback(async (record: Omit<IInventoryRecord, 'id' | 'createdAt'>) => {
    const newRecord: IInventoryRecord = {
      ...record,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setInventoryRecords(prev => [newRecord, ...prev]);
  }, []);

  const deleteInventoryRecord = useCallback((id: string) => {
    setInventoryRecords(prev => prev.filter(r => r.id !== id));
  }, []);

  // 获取库存汇总
  const getInventorySummary = useCallback((): IInventorySummary[] => {
    return products.map((product) => ({
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      material: product.material,
      process: product.process,
      techRequirement: product.techRequirement,
      workpieceNo: product.workpieceNo,
      unitPrice: product.unitPrice,
      unit: product.unit,
      inboundQuantity: product.inboundQuantity || 0,
      inboundWeight: product.inboundWeight || 0,
      currentStock: product.stock,
      currentStockWeight: product.stockWeight || 0,
      customerCode: product.customerCode,
      customerName: product.customerName,
      warningThreshold: product.warningThreshold ?? 50,
      warningWeightThreshold: product.unit === 'kg' ? (product.warningThreshold ?? 50) : undefined,
    }));
  }, [products]);

  // ========== 出库单管理 ==========
  const addOutboundOrder = useCallback(async (order: Omit<IOutboundOrder, 'id' | 'createdAt' | 'status' | 'outboundNo'> & { outboundNo?: string }) => {
    try {
      // 不再传 outboundNo，由后端自动生成
      const { outboundNo: _, ...orderWithoutNo } = order;
      const newOrder = await api.createOutboundOrder({
        ...orderWithoutNo,
        outboundDate: order.outboundDate,
      });
      
      setOutboundOrders(prev => [newOrder, ...prev]);
      
      // 刷新产品列表以获取最新库存
      await refreshProducts();
      
      // 刷新库存变动记录以显示最新的出库记录
      await refreshInventoryRecords();
      
      toast.success('出库单创建成功');
      return newOrder;
    } catch (error: any) {
      toast.error(error.message || '创建出库单失败');
      throw error;
    }
  }, [refreshInboundOrders, refreshProducts, refreshInventoryRecords]);

  const updateOutboundOrder = useCallback(async (id: string, data: Partial<IOutboundOrder>) => {
    setOutboundOrders(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));
  }, []);

  const cancelOutboundOrder = useCallback(async (id: string, reason?: string) => {
    try {
      await api.cancelOutboundOrder(id, reason);
      // 撤销后重新刷新列表（cancelled的单据已被过滤）
      await refreshOutboundOrders();
      await refreshProducts();
      await refreshInventoryRecords();
      // P3: 刷新对账单列表，撤销出库单可能影响关联对账单金额
      await refreshReconciliations();
      toast.success('出库单已撤销，库存已恢复');
    } catch (error: any) {
      toast.error(error.message || '撤销出库单失败');
      throw error;
    }
  }, [refreshOutboundOrders, refreshProducts, refreshInventoryRecords, refreshReconciliations]);

  const getPendingReconciliationOrders = useCallback(async (customerId: string) => {
    try {
      const data = await api.getPendingReconciliationOrders(customerId);
      return data;
    } catch (error) {
      logger.error('获取待对账出库单失败', error);
      return [];
    }
  }, []);

  // ========== 对账单管理 ==========
  const addReconciliation = useCallback(async (reconciliationData: Omit<IReconciliation, 'id'>) => {
    try {
      const newReconciliation = await api.createReconciliation({
        ...reconciliationData,
        reconciliationNo: reconciliationData.reconciliationNo || generateReconciliationNo(),
      });
      
      setReconciliations(prev => [newReconciliation, ...prev]);
      
      // 刷新出库单列表
      await refreshOutboundOrders();
      
      toast.success('对账单创建成功');
      return newReconciliation;
    } catch (error: any) {
      toast.error(error.message || '创建对账单失败');
      throw error;
    }
  }, [refreshOutboundOrders]);

  const updateReconciliation = useCallback(async (id: string, data: Partial<IReconciliation>) => {
    try {
      const updated = await api.updateReconciliation(id, data);
      setReconciliations(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
      toast.success('对账单更新成功');
    } catch (error: any) {
      toast.error(error.message || '更新对账单失败');
      throw error;
    }
  }, []);

  const deleteReconciliation = useCallback(async (id: string, _outboundOrderIds?: string[]) => {
    try {
      await api.deleteReconciliation(id);
      setReconciliations(prev => prev.filter(r => r.id !== id));
      // 后端在删除事务中统一解除关联和锁定，前端只读取权威结果，避免二次改状态。
      await refreshOutboundOrders();
      toast.success('对账单删除成功，关联出库单已回退到待对账列表');
    } catch (error: any) {
      toast.error(error.message || '删除对账单失败');
      throw error;
    }
  }, [refreshOutboundOrders]);

  const auditReconciliation = useCallback(async (id: string, auditorName: string) => {
    try {
      // 调用后端审核接口
      const updated = await api.auditReconciliation(id, auditorName);

      // 更新本地状态
      setReconciliations(prev => prev.map(r =>
        r.id === id ? { ...r, ...updated, status: 'audited' as const } : r
      ));

      toast.success('审核成功');
    } catch (error: any) {
      toast.error(error.message || '审核失败');
      throw error;
    }
  }, []);

  const confirmReconciliation = useCallback(async (id: string) => {
    try {
      const updated = await api.confirmReconciliation(id);
      setReconciliations(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
      toast.success('对账单已确认');
    } catch (error: any) {
      toast.error(error.message || '确认失败');
      throw error;
    }
  }, []);

  const unauditReconciliation = useCallback(async (id: string, reason?: string) => {
    const reconciliation = reconciliations.find(r => r.id === id);
    if (!reconciliation) return;

    try {
      // 调用后端反审核接口
      await api.unauditReconciliation(id, reason || '');
      
      // 反审核回到草稿，保留关联与版本历史，可修改后再次确认、审核。
      await refreshReconciliations();
      
      // 刷新出库单列表（关联出库单已解除锁定）
      await refreshOutboundOrders();
      
      toast.success('反审核成功，对账单已回到草稿');
    } catch (error: any) {
      toast.error(error.message || '反审核失败');
      throw error;
    }
  }, [reconciliations, refreshReconciliations, refreshOutboundOrders]);

  // 记录开票
  const recordInvoice = useCallback(async (id: string, amount: number) => {
    try {
      const updated = await api.recordInvoice(id, amount);
      setReconciliations(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
      toast.success('开票记录成功');
    } catch (error: any) {
      toast.error(error.message || '记录开票失败');
      throw error;
    }
  }, []);

  // 记录回款
  const recordReceipt = useCallback(async (id: string, amount: number) => {
    try {
      const updated = await api.recordReceipt(id, amount);
      setReconciliations(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
      toast.success('回款记录成功');
    } catch (error: any) {
      toast.error(error.message || '记录回款失败');
      throw error;
    }
  }, []);

  // ========== 入库单相关 ==========
  const addInboundOrder = useCallback(async (order: Omit<IInboundOrder, 'id' | 'createdAt' | 'status' | 'inboundNo'> & { inboundNo?: string }) => {
    try {
      // 调用后端API创建入库单（后端自动生成单号）
      const result = await api.createInboundOrder({
        ...order,
        inboundDate: order.inboundDate,
      });

      // 刷新入库单列表
      await refreshInboundOrders();

      // 刷新产品列表以获取最新库存
      await refreshProducts();

      // 刷新库存变动记录，确保库存管理页面能立即看到最新记录
      await refreshInventoryRecords();

      toast.success('入库单创建成功');
      // 从后端返回的数据中构造返回对象
      const orderData = result?.data || result;
      return {
        ...order,
        ...orderData,
        id: orderData?.id || '',
        inboundNo: orderData?.inboundNo || '',
        status: orderData?.status || 'active',
        details: orderData?.details || order.details,
        createdAt: orderData?.createdAt || new Date().toISOString(),
      } as IInboundOrder;
    } catch (error: any) {
      toast.error(error.message || '创建入库单失败');
      throw error;
    }
  }, [refreshInboundOrders, refreshProducts, refreshInventoryRecords]);

  const checkCanUndo = useCallback(async (inboundOrderId: string): Promise<IUndoCheckResult> => {
    try {
      const result = await api.checkInboundCanCancel(inboundOrderId);
      return {
        canUndo: result.canUndo,
        reason: result.reason,
        timeRemaining: result.timeRemaining,
      };
    } catch (error: any) {
      return { canUndo: false, reason: error.message || '检查失败' };
    }
  }, []);

  const cancelInboundOrder = useCallback(async (id: string, reason?: string): Promise<boolean> => {
    try {
      // 调用后端撤销API
      await api.cancelInboundOrder(id, reason);

      // 刷新入库单列表、产品列表和库存记录
      await refreshInboundOrders();
      await refreshProducts();
      await refreshInventoryRecords();

      toast.success('入库单已撤销，库存已回滚');
      return true;
    } catch (error: any) {
      toast.error(error.message || '撤销失败');
      return false;
    }
  }, [refreshInboundOrders, refreshProducts, refreshInventoryRecords]);

  // ========== 操作日志相关 ==========
  const addOperationLog = useCallback(async (log: Omit<IOperationLog, 'id' | 'createdAt'>) => {
    const newLog: IOperationLog = {
      ...log,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setOperationLogs(prev => [newLog, ...prev]);
  }, []);

  const getEntityLogs = useCallback((entityType: string, entityId: string): IOperationLog[] => {
    return operationLogs.filter(log => log.entityType === entityType && log.entityId === entityId);
  }, [operationLogs]);

  const refreshOperationLogs = useCallback(async () => {
    // 实际项目中从API获取
  }, []);

  // ========== 实验功能配置 ==========
  const toggleFeature = useCallback((feature: 'voiceInput' | 'aiRecognition') => {
    setFeatureConfig(prev => ({
      ...prev,
      [feature]: {
        enabled: !prev[feature].enabled,
      },
    }));
  }, []);

  // ========== 缓存工具 ==========
  const getCachedCustomerProducts = useCallback((customerCode: string): IProduct[] | null => {
    const cached = productCache.current.get(customerCode);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > CACHE_TTL) {
      productCache.current.delete(customerCode);
      return null;
    }
    
    return cached.products;
  }, []);

  const setCachedCustomerProducts = useCallback((customerCode: string, products: IProduct[]) => {
    productCache.current.set(customerCode, {
      products,
      timestamp: Date.now(),
    });
  }, []);

  const invalidateProductCache = useCallback((customerCode?: string) => {
    if (customerCode) {
      productCache.current.delete(customerCode);
    } else {
      productCache.current.clear();
    }
  }, []);

  // ========== 新增方法实现 ==========

  // 批量更新产品预警阈值
  const batchUpdateProductThreshold = useCallback(async (productIds: string[], warningThreshold: number) => {
    try {
      await api.batchUpdateProductThreshold(productIds, warningThreshold);
      await refreshProducts();
      toast.success(`已批量更新 ${productIds.length} 个产品的预警阈值`);
    } catch (error: any) {
      toast.error(error.message || '批量更新失败');
      throw error;
    }
  }, [refreshProducts]);

  // 获取待完善产品列表
  const getIncompleteProducts = useCallback(async (limit?: number) => {
    try {
      return await api.getIncompleteProducts(limit);
    } catch (error: any) {
      toast.error(error.message || '获取待完善产品失败');
      return [];
    }
  }, []);

  // 获取材质默认阈值配置
  const getMaterialThresholds = useCallback(async () => {
    try {
      const thresholds = await api.getMaterialThresholds();
      const result: Record<string, number> = {};
      thresholds.forEach((t: { material: string; defaultThreshold: number }) => {
        result[t.material] = t.defaultThreshold;
      });
      return result;
    } catch (error: any) {
      toast.error(error.message || '获取材质阈值配置失败');
      return {};
    }
  }, []);

  // 设置材质默认阈值
  const setMaterialThreshold = useCallback(async (material: string, threshold: number) => {
    try {
      await api.setMaterialThreshold(material, threshold);
      toast.success(`已设置 ${material} 的默认阈值为 ${threshold}`);
    } catch (error: any) {
      toast.error(error.message || '设置材质阈值失败');
      throw error;
    }
  }, []);

  // 检查对账单可操作状态
  const checkReconciliationAction = useCallback(async (id: string, action: 'delete' | 'unaudit') => {
    try {
      return await api.checkReconciliationAction(id, action);
    } catch (error: any) {
      toast.error(error.message || '检查操作状态失败');
      return { allowed: false, reason: error.message };
    }
  }, []);

  // 获取对账单金额计算明细
  const getReconciliationCalculation = useCallback(async (id: string) => {
    try {
      return await api.getReconciliationCalculation(id);
    } catch (error: any) {
      toast.error(error.message || '获取计算明细失败');
      throw error;
    }
  }, []);

  // 获取客户活跃度统计
  const getCustomerActivity = useCallback(async (id: string) => {
    try {
      return await api.getCustomerActivity(id);
    } catch (error: any) {
      toast.error(error.message || '获取客户活跃度失败');
      throw error;
    }
  }, []);

  // 检查客户是否可以停用
  const checkCanDeactivateCustomer = useCallback(async (id: string) => {
    try {
      return await api.checkCanDeactivateCustomer(id);
    } catch (error: any) {
      toast.error(error.message || '检查停用状态失败');
      return { canDeactivate: false, pendingOutboundCount: 0, pendingReconciliationAmount: 0, reason: error.message };
    }
  }, []);

  return (
    <DataContext.Provider
      value={{
        // 客户
        customers,
        setCustomers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        refreshCustomers,
        
        // 产品
        products,
        setProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        batchDeleteProducts,
        refreshProducts,
        
        // 库存记录
        inventoryRecords,
        addInventoryRecord,
        deleteInventoryRecord,
        refreshInventoryRecords,
        
        // 库存操作
        getInventorySummary,
        
        // 出库单
        outboundOrders,
        addOutboundOrder,
        updateOutboundOrder,
        cancelOutboundOrder,
        getPendingReconciliationOrders,
        refreshOutboundOrders,
        
        // 对账单
        reconciliations,
        addReconciliation,
        updateReconciliation,
        deleteReconciliation,
        confirmReconciliation,
        auditReconciliation,
        unauditReconciliation,
        recordInvoice,
        recordReceipt,
        refreshReconciliations,
        
        // 入库单
        inboundOrders,
        addInboundOrder,
        cancelInboundOrder,
        checkCanUndo,
        refreshInboundOrders,
        
        // 操作日志
        operationLogs,
        addOperationLog,
        getEntityLogs,
        refreshOperationLogs,
        
        // 实验功能配置
        featureConfig,
        toggleFeature,
        
        // 缓存工具
        getCachedCustomerProducts,
        setCachedCustomerProducts,
        invalidateProductCache,
        
        // 加载状态
        loading,

        // 新增方法
        batchUpdateProductThreshold,
        getIncompleteProducts,
        getMaterialThresholds,
        setMaterialThreshold,
        checkReconciliationAction,
        getReconciliationCalculation,
        getCustomerActivity,
        checkCanDeactivateCustomer,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

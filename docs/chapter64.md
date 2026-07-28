

---

## 第64章 Shared 类型定义完整参考

### 64.1 概述

`shared/api.interface.ts` 是前后端共享的类型定义文件，所有接口的请求和响应类型必须在此文件中定义。

### 64.2 通用类型

```typescript
// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 游标分页响应
export interface CursorPaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

// 统一错误响应
export interface ErrorResponse {
  success: false;
  code: string;
  message: string;
  timestamp: string;
  path: string;
}

// 操作结果
export interface OperationResult {
  id: string;
  success: boolean;
}

// 排序参数
export type SortOrder = 'asc' | 'desc';

export interface SortParam {
  field: string;
  order: SortOrder;
}

// 日期范围参数
export interface DateRangeParam {
  startDate?: string;
  endDate?: string;
}
```

### 64.3 组织相关类型

```typescript
export interface Organization {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'inactive';
  memberCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  userId: string;
  userName: string;
  role: string;
  joinedAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  code: string;
}

export interface CurrentOrganization extends Organization {
  role: string;
  permissions: string[];
}
```

### 64.4 客户相关类型

```typescript
export interface Customer {
  id: string;
  orgId: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  bankName?: string;
  bankAccount?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  bankName?: string;
  bankAccount?: string;
  remark?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

export interface CustomerListParams {
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: SortOrder;
}

export interface CustomerSearchItem {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
}

export interface CustomerHistory {
  inboundCount: number;
  outboundCount: number;
  totalAmount: number;
  paymentRate: number;
  inboundRecords: InboundRecord[];
  outboundRecords: OutboundRecord[];
  reconciliationRecords: ReconciliationRecord[];
}
```

### 64.5 产品相关类型

```typescript
export type MaterialType = 'steel' | 'aluminum' | 'copper' | 'other';
export type ProcessType = 'quench' | 'temper' | 'anneal' | 'normalize' | 'carburize' | 'nitride';
export type PricingMethod = 'weight' | 'piece';

export interface Product {
  id: string;
  orgId: string;
  name: string;
  material?: MaterialType;
  process?: ProcessType;
  specification?: string;
  unit: string;
  pricingMethod: PricingMethod;
  unitPrice?: string;
  minOrderQty?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail extends Product {
  inventory?: InventoryItem;
  records?: ProductRecord[];
}

export interface CreateProductRequest {
  name: string;
  material?: MaterialType;
  process?: ProcessType;
  specification?: string;
  unit: string;
  pricingMethod: PricingMethod;
  unitPrice?: string;
  minOrderQty?: string;
  remark?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface ProductListParams {
  search?: string;
  material?: string;
  process?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductSearchItem {
  id: string;
  name: string;
  material?: string;
  process?: string;
  specification?: string;
  unit: string;
  pricingMethod: PricingMethod;
  unitPrice?: string;
}

export interface ProductRecord {
  id: string;
  type: 'inbound' | 'outbound';
  refNo: string;
  date: string;
  qty: string;
  weight: string;
  unit: string;
  customerName?: string;
  status: string;
}
```

### 64.6 入库相关类型

```typescript
export type InboundStatus = 'draft' | 'pending' | 'completed' | 'cancelled';

export interface InboundItem {
  id: string;
  inboundId: string;
  productId?: string;
  productName: string;
  material?: string;
  process?: string;
  specification?: string;
  qty: string;
  weight: string;
  unit: string;
  unitPrice?: string;
  amount?: string;
  location?: string;
  remark?: string;
}

export interface InboundRecord {
  id: string;
  orgId: string;
  batchNo?: string;
  customerId?: string;
  customerName?: string;
  inboundDate: string;
  status: InboundStatus;
  totalQty: string;
  totalWeight: string;
  photos?: string;
  remark?: string;
  items?: InboundItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInboundItemRequest {
  productId?: string;
  productName: string;
  material?: string;
  process?: string;
  specification?: string;
  qty: string;
  weight: string;
  unit: string;
  unitPrice?: string;
  location?: string;
  remark?: string;
}

export interface CreateInboundRequest {
  batchNo?: string;
  customerId?: string;
  customerName?: string;
  inboundDate: string;
  items: CreateInboundItemRequest[];
  photos?: string[];
  remark?: string;
}

export interface UpdateInboundRequest extends Partial<CreateInboundRequest> {}

export interface InboundListParams {
  search?: string;
  customerId?: string;
  status?: InboundStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: SortOrder;
}

export interface InboundImportResult {
  total: number;
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}
```

### 64.7 出库相关类型

```typescript
export type OutboundStatus = 'pending' | 'partial' | 'completed' | 'cancelled';

export interface OutboundItem {
  id: string;
  outboundId: string;
  productId?: string;
  productName: string;
  material?: string;
  process?: string;
  specification?: string;
  qty: string;
  weight: string;
  unit: string;
  unitPrice?: string;
  amount?: string;
  remark?: string;
}

export interface OutboundRecord {
  id: string;
  orgId: string;
  outboundNo?: string;
  inboundId?: string;
  customerId?: string;
  customerName?: string;
  outboundDate: string;
  status: OutboundStatus;
  totalQty: string;
  totalWeight: string;
  totalAmount: string;
  deliveredQty: string;
  remark?: string;
  items?: OutboundItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOutboundItemRequest {
  productId?: string;
  productName: string;
  qty: string;
  weight: string;
  unit: string;
  unitPrice?: string;
  remark?: string;
}

export interface CreateOutboundRequest {
  inboundId?: string;
  customerId?: string;
  customerName?: string;
  outboundDate: string;
  items: CreateOutboundItemRequest[];
  remark?: string;
}

export interface UpdateOutboundRequest extends Partial<CreateOutboundRequest> {}

export interface OutboundListParams {
  search?: string;
  customerId?: string;
  inboundId?: string;
  status?: OutboundStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface CloseOutboundRequest {
  reason?: string;
}
```

### 64.8 库存相关类型

```typescript
export type InventoryStatus = 'normal' | 'expired' | 'low_stock';

export interface InventoryItem {
  id: string;
  orgId: string;
  productId: string;
  productName: string;
  material?: string;
  specification?: string;
  currentQty: string;
  currentWeight: string;
  unit: string;
  location?: string;
  batchNo?: string;
  inboundDate?: string;
  status: InventoryStatus;
  updatedAt: string;
}

export interface InventoryOverview {
  totalTypes: number;
  totalQty: number;
  expiredCount: number;
  lowStockCount: number;
}

export interface InventoryListParams {
  search?: string;
  material?: string;
  batchNo?: string;
  status?: InventoryStatus;
  page?: number;
  pageSize?: number;
}

export interface AdjustInventoryRequest {
  productId: string;
  adjustType: 'in' | 'out';
  qty: number;
  reason: string;
}

export interface InventoryHistoryRecord {
  id: string;
  type: 'inbound' | 'outbound' | 'adjust_in' | 'adjust_out';
  qty: string;
  afterQty: string;
  source: string;
  operator: string;
  createdAt: string;
}
```

### 64.9 对账相关类型

```typescript
export type ReconciliationStatus = 'draft' | 'pending' | 'confirmed' | 'rejected' | 'settled';

export interface ReconciliationItem {
  id: string;
  type: 'inbound' | 'outbound';
  refId: string;
  refNo: string;
  date: string;
  productName?: string;
  qty?: string;
  weight?: string;
  amount: string;
}

export interface ReconciliationRecord {
  id: string;
  orgId: string;
  reconNo?: string;
  customerId: string;
  customerName: string;
  periodYear: number;
  periodMonth: number;
  status: ReconciliationStatus;
  totalInbound: string;
  totalOutbound: string;
  totalAmount: string;
  paidAmount: string;
  unpaidAmount: string;
  remark?: string;
  items?: ReconciliationItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  confirmedBy?: string;
}

export interface CreateReconciliationRequest {
  customerId: string;
  periodYear: number;
  periodMonth: number;
  remark?: string;
}

export interface UpdateReconciliationRequest {
  remark?: string;
  paidAmount?: string;
}

export interface ReconciliationListParams {
  search?: string;
  customerId?: string;
  status?: ReconciliationStatus;
  periodYear?: number;
  periodMonth?: number;
  page?: number;
  pageSize?: number;
}

export interface ReconciliationPreview {
  customerId: string;
  customerName: string;
  periodYear: number;
  periodMonth: number;
  totalInbound: string;
  totalOutbound: string;
  totalAmount: string;
  items: ReconciliationItem[];
}
```

### 64.10 统计相关类型

```typescript
export interface StatisticsOverview {
  totalInboundQty: number;
  totalInboundWeight: number;
  totalOutboundQty: number;
  totalOutboundWeight: number;
  totalInventoryQty: number;
  totalInventoryWeight: number;
  totalCustomers: number;
  totalProducts: number;
  pendingReconciliation: number;
  expiredInventory: number;
  lowStockCount: number;
}

export interface InboundStatistics {
  date: string;
  count: number;
  totalQty: number;
  totalWeight: number;
  totalAmount: number;
}

export interface OutboundStatistics {
  date: string;
  count: number;
  totalQty: number;
  totalWeight: number;
  totalAmount: number;
}

export interface InventoryStatistics {
  productName: string;
  material?: string;
  currentQty: number;
  currentWeight: number;
  unit: string;
  status: string;
  percentage: number;
}

export interface CustomerStatistics {
  customerId: string;
  customerName: string;
  inboundCount: number;
  outboundCount: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  paymentRate: number;
}

export interface ReconciliationStatistics {
  status: string;
  count: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}

export interface StatisticsParams {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}
```

### 64.11 打印模板相关类型

```typescript
export type TemplateType = 'tag' | 'delivery' | 'reconciliation';

export interface PrintTemplate {
  id: string;
  orgId: string;
  name: string;
  type: TemplateType;
  description?: string;
  config: TemplateConfig;
  enabled: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateConfig {
  pageSize?: string;
  orientation?: 'portrait' | 'landscape';
  title?: string;
  fields?: TemplateField[];
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  fontFamily?: string;
  titleFontSize?: number;
  bodyFontSize?: number;
  tableStyle?: 'bordered' | 'striped' | 'minimal';
  showQRCode?: boolean;
  showPageNumber?: boolean;
}

export interface TemplateField {
  key: string;
  label: string;
}

export interface CreateTemplateRequest {
  name: string;
  type: TemplateType;
  description?: string;
  config: TemplateConfig;
  enabled?: boolean;
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {}

export interface PrintPreviewResult {
  html: string;
}
```

### 64.12 工作台相关类型

```typescript
export interface DashboardOverview {
  todayInboundCount: number;
  todayInboundWeight: number;
  todayOutboundCount: number;
  todayOutboundWeight: number;
  totalInventoryTypes: number;
  totalInventoryQty: number;
  pendingReconciliation: number;
  expiredInventory: number;
  lowStockCount: number;
  weeklyInbound: { date: string; count: number; weight: number }[];
  weeklyOutbound: { date: string; count: number; weight: number }[];
  topCustomers: { customerId: string; customerName: string; totalAmount: number }[];
  inventoryDistribution: { material: string; count: number; percentage: number }[];
}

export interface DashboardPendingItem {
  id: string;
  type: 'inbound' | 'outbound' | 'reconciliation' | 'inventory';
  title: string;
  description: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface DashboardChartData {
  inboundTrend: { date: string; count: number; weight: number; amount: number }[];
  outboundTrend: { date: string; count: number; weight: number; amount: number }[];
  customerRanking: { customerId: string; customerName: string; totalAmount: number }[];
  materialDistribution: { material: string; count: number; percentage: number }[];
}

export interface DashboardRecentAction {
  id: string;
  module: string;
  action: string;
  description: string;
  operator: string;
  createdAt: string;
}
```

### 64.13 权限相关类型

```typescript
export interface Role {
  id: string;
  bizId: string;
  name: string;
  description: string;
  type: 'system' | 'custom';
  enabled: boolean;
  permissions: Permission[];
  memberCount: number;
}

export interface Permission {
  id: string;
  name: string;
  code: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface CreateRoleRequest {
  bizId: string;
  name: string;
  description: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}
```

### 64.14 文件相关类型

```typescript
export interface FileMeta {
  id: string;
  orgId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  refId?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface FileUploadResult {
  file_path: string;
  file_name: string;
  file_size: number;
}
```

### 64.15 审计日志类型

```typescript
export interface AuditLog {
  id: string;
  orgId: string;
  module: string;
  action: string;
  targetId?: string;
  targetType?: string;
  changes?: Record<string, unknown>;
  operator: string;
  ipAddress?: string;
  createdAt: string;
}
```

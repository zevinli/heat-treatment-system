

---

## 第62章 系统配置与常量定义

### 62.1 系统常量

#### 应用信息

```typescript
const APP_CONFIG = {
  name: '热处理收发货管理系统',
  version: '1.0.0',
  description: '专业热处理行业收发货管理平台',
} as const;
```

#### 存储键名

```typescript
const STORAGE_KEYS = {
  ORG_CODE: 'org_code',
  ORG_INFO: 'org_info',
  USER_INFO: 'user_info',
  THEME: 'theme',
  LANGUAGE: 'lang',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  LAST_PAGE_SIZE: 'last_page_size',
  RECENT_CUSTOMERS: 'recent_customers',
  RECENT_PRODUCTS: 'recent_products',
  CUSTOMER_LIST: 'customer_list_cache',
  PRODUCT_LIST: 'product_list_cache',
  DRAFT_INBOUND: 'draft_inbound',
} as const;
```

#### 分页默认值

```typescript
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;
```

#### 日期常量

```typescript
const DATE_CONSTANTS = {
  TIMEZONE: 'Asia/Shanghai',
  EXPIRY_DAYS: 90,
  RECENT_DAYS: 7,
  MONTH_DAYS: 30,
  QUARTER_DAYS: 90,
  YEAR_DAYS: 365,
} as const;
```

#### 库存阈值

```typescript
const INVENTORY_THRESHOLDS = {
  LOW_STOCK_QTY: 10,
  EXPIRY_DAYS: 90,
  WARNING_DAYS: 60,
  CRITICAL_DAYS: 80,
} as const;
```

### 62.2 业务常量

#### 入库状态

```typescript
const INBOUND_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

const INBOUND_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  pending: '待审核',
  completed: '已完成',
  cancelled: '已取消',
};

const INBOUND_STATUS_COLORS: Record<string, string> = {
  draft: 'secondary',
  pending: 'warning',
  completed: 'success',
  cancelled: 'error',
};
```

#### 出库状态

```typescript
const OUTBOUND_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

const OUTBOUND_STATUS_LABELS: Record<string, string> = {
  pending: '待发货',
  partial: '部分发货',
  completed: '已完成',
  cancelled: '已取消',
};
```

#### 对账状态

```typescript
const RECON_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  SETTLED: 'settled',
} as const;

const RECON_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  pending: '待确认',
  confirmed: '已确认',
  rejected: '已驳回',
  settled: '已结清',
};
```

#### 库存状态

```typescript
const INVENTORY_STATUS = {
  NORMAL: 'normal',
  EXPIRED: 'expired',
  LOW_STOCK: 'low_stock',
} as const;
```

### 62.3 产品常量

#### 材质

```typescript
const MATERIALS = [
  { value: 'steel', label: '钢材' },
  { value: 'aluminum', label: '铝材' },
  { value: 'copper', label: '铜材' },
  { value: 'other', label: '其他' },
] as const;
```

#### 工艺

```typescript
const PROCESSES = [
  { value: 'quench', label: '淬火' },
  { value: 'temper', label: '回火' },
  { value: 'anneal', label: '退火' },
  { value: 'normalize', label: '正火' },
  { value: 'carburize', label: '渗碳' },
  { value: 'nitride', label: '渗氮' },
] as const;
```

#### 计价方式

```typescript
const PRICING_METHODS = [
  { value: 'weight', label: '按重量' },
  { value: 'piece', label: '按件数' },
] as const;
```

#### 单位

```typescript
const UNITS = [
  { value: 'kg', label: 'kg' },
  { value: 'piece', label: '件' },
  { value: 'm', label: 'm' },
  { value: 'batch', label: '批' },
] as const;
```

### 62.4 角色常量

```typescript
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  FINANCE: 'finance',
  INBOUND_OPERATOR: 'inbound_operator',
  OUTBOUND_OPERATOR: 'outbound_operator',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;

const ROLE_LABELS: Record<string, string> = {
  super_admin: '超级管理员',
  admin: '管理员',
  finance: '财务',
  inbound_operator: '入库操作员',
  outbound_operator: '出库操作员',
  member: '普通成员',
  viewer: '只读用户',
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],
  admin: [
    'inbound:*', 'outbound:*', 'inventory:*',
    'recon:*', 'stats:*', 'customer:*', 'product:*',
    'system:templates',
  ],
  finance: [
    'recon:*', 'stats:view', 'stats:export',
    'inbound:view', 'outbound:view', 'inventory:view',
  ],
  inbound_operator: [
    'inbound:*', 'inventory:view',
  ],
  outbound_operator: [
    'outbound:*', 'inventory:view',
  ],
  member: [
    'inbound:view', 'outbound:view', 'inventory:view',
  ],
  viewer: [
    'inbound:view', 'outbound:view', 'inventory:view',
    'stats:view', 'customer:view', 'product:view',
  ],
};
```

### 62.5 API 路径常量

```typescript
const API_PATHS = {
  // 客户
  CUSTOMERS: '/api/customers',
  CUSTOMER_DETAIL: (id: string) => `/api/customers/${id}`,
  CUSTOMER_SEARCH: '/api/customers/search',
  CUSTOMER_HISTORY: (id: string) => `/api/customers/${id}/history`,

  // 产品
  PRODUCTS: '/api/products',
  PRODUCT_DETAIL: (id: string) => `/api/products/${id}`,
  PRODUCT_SEARCH: '/api/products/search',
  PRODUCT_RECORDS: (id: string) => `/api/products/${id}/records`,

  // 入库
  INBOUND: '/api/inbound',
  INBOUND_DETAIL: (id: string) => `/api/inbound/${id}`,
  INBOUND_IMPORT: '/api/inbound/import',
  INBOUND_PRINT: (id: string) => `/api/inbound/${id}/print`,
  INBOUND_STATUS: (id: string) => `/api/inbound/${id}/status`,

  // 出库
  OUTBOUND: '/api/outbound',
  OUTBOUND_DETAIL: (id: string) => `/api/outbound/${id}`,
  OUTBOUND_PRINT: (id: string) => `/api/outbound/${id}/print`,
  OUTBOUND_STATUS: (id: string) => `/api/outbound/${id}/status`,
  OUTBOUND_CLOSE: (id: string) => `/api/outbound/${id}/close`,

  // 库存
  INVENTORY: '/api/inventory',
  INVENTORY_OVERVIEW: '/api/inventory/overview',
  INVENTORY_BY_PRODUCT: (id: string) => `/api/inventory/product/${id}`,
  INVENTORY_ADJUST: '/api/inventory/adjust',
  INVENTORY_HISTORY: (id: string) => `/api/inventory/${id}/history`,

  // 对账
  RECONCILIATION: '/api/reconciliation',
  RECONCILIATION_DETAIL: (id: string) => `/api/reconciliation/${id}`,
  RECONCILIATION_STATUS: (id: string) => `/api/reconciliation/${id}/status`,
  RECONCILIATION_PRINT: (id: string) => `/api/reconciliation/${id}/print`,
  RECONCILIATION_PREVIEW: '/api/reconciliation/preview',

  // 统计
  STATS_OVERVIEW: '/api/statistics/overview',
  STATS_INBOUND: '/api/statistics/inbound',
  STATS_OUTBOUND: '/api/statistics/outbound',
  STATS_INVENTORY: '/api/statistics/inventory',
  STATS_CUSTOMER: '/api/statistics/customer',
  STATS_RECON: '/api/statistics/reconciliation',

  // 组织
  ORGS_MY: '/api/organizations/my',
  ORGS_CURRENT: '/api/organizations/current',
  ORG_SELECT: (code: string) => `/api/organizations/${code}/select`,
  ORG_MEMBERS: (id: string) => `/api/organizations/${id}/members`,

  // 权限
  RBAC_ROLES: '/api/rbac/roles',
  RBAC_ROLE_DETAIL: (id: string) => `/api/rbac/roles/${id}`,
  RBAC_PERMISSIONS: '/api/rbac/permissions/tree',
  RBAC_ROLE_PERMISSIONS: (id: string) => `/api/rbac/roles/${id}/permissions`,
  RBAC_ROLE_MEMBERS: (id: string) => `/api/rbac/roles/${id}/members`,
  RBAC_MOCK: '/api/rbac/mock',

  // 打印模板
  TEMPLATES: '/api/print-templates',
  TEMPLATE_DETAIL: (id: string) => `/api/print-templates/${id}`,
  TEMPLATE_TOGGLE: (id: string) => `/api/print-templates/${id}/toggle`,
  TEMPLATE_PREVIEW: (id: string) => `/api/print-templates/${id}/preview`,

  // 工作台
  DASHBOARD_OVERVIEW: '/api/dashboard/overview',
  DASHBOARD_PENDING: '/api/dashboard/pending',
  DASHBOARD_CHARTS: '/api/dashboard/charts',
  DASHBOARD_RECENT: '/api/dashboard/recent',

  // 健康
  HEALTH: '/api/health',
} as const;
```

### 62.6 路由路径常量

```typescript
const ROUTES = {
  HOME: '/',
  INBOUND: '/inbound',
  OUTBOUND: '/outbound',
  INVENTORY: '/inventory',
  RECONCILIATION: '/reconciliation',
  STATISTICS: '/statistics',
  CUSTOMERS: '/customers',
  CUSTOMER_DETAIL: (id: string) => `/customers/${id}`,
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id: string) => `/products/${id}`,
  TEMPLATES: '/settings/templates',
  PERMISSIONS: '/settings/permissions',
  ORGANIZATIONS: '/organizations',
} as const;
```

### 62.7 导航菜单常量

```typescript
const NAV_SECTIONS = [
  {
    key: 'dashboard',
    label: '工作台',
    icon: 'Dashboard',
    path: '/',
    roles: ['super_admin', 'admin', 'finance', 'inbound_operator', 'outbound_operator', 'member', 'viewer'],
  },
  {
    key: 'inbound',
    label: '来货登记',
    icon: 'Inbox',
    path: '/inbound',
    roles: ['super_admin', 'admin', 'inbound_operator'],
  },
  {
    key: 'outbound',
    label: '快速发货',
    icon: 'Outbox',
    path: '/outbound',
    roles: ['super_admin', 'admin', 'outbound_operator'],
  },
  {
    key: 'inventory',
    label: '库存管理',
    icon: 'Package',
    path: '/inventory',
    roles: ['super_admin', 'admin', 'inbound_operator', 'outbound_operator'],
  },
  {
    key: 'reconciliation',
    label: '智能对账',
    icon: 'FileText',
    path: '/reconciliation',
    roles: ['super_admin', 'admin', 'finance'],
  },
  {
    key: 'statistics',
    label: '数据统计',
    icon: 'BarChart',
    path: '/statistics',
    roles: ['super_admin', 'admin', 'finance', 'viewer'],
  },
  {
    key: 'master_data',
    label: '基础数据',
    icon: 'Database',
    roles: ['super_admin', 'admin'],
    children: [
      { key: 'customers', label: '客户管理', path: '/customers' },
      { key: 'products', label: '产品管理', path: '/products' },
    ],
  },
  {
    key: 'settings',
    label: '系统设置',
    icon: 'Settings',
    roles: ['super_admin', 'admin'],
    children: [
      { key: 'templates', label: '打印模板', path: '/settings/templates' },
      { key: 'permissions', label: '权限管理', path: '/settings/permissions', roles: ['super_admin'] },
    ],
  },
] as const;
```

### 62.8 图表颜色常量

```typescript
const CHART_COLORS = {
  primary: '#2563eb',
  success: '#16a34a',
  warning: '#f59e0b',
  error: '#dc2626',
  info: '#06b6d4',
  purple: '#9333ea',
  orange: '#ea580c',
  teal: '#14b8a6',
} as const;

const CHART_COLOR_LIST = [
  '#2563eb', '#16a34a', '#f59e0b', '#dc2626',
  '#06b6d4', '#9333ea', '#ea580c', '#14b8a6',
  '#6366f1', '#84cc16', '#f97316', '#ec4899',
] as const;
```

### 62.9 文件上传限制

```typescript
const FILE_LIMITS = {
  IMAGE: {
    maxSize: 5 * 1024 * 1024,
    accept: 'image/jpeg,image/png,image/gif,image/webp',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  },
  EXCEL: {
    maxSize: 10 * 1024 * 1024,
    accept: '.xlsx,.xls',
    extensions: ['.xlsx', '.xls'],
  },
  PDF: {
    maxSize: 20 * 1024 * 1024,
    accept: '.pdf',
    extensions: ['.pdf'],
  },
} as const;
```

### 62.10 正则表达式

```typescript
const REGEX = {
  PHONE: /^1[3-9]\d{9}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/[^\s]+$/,
  BATCH_NO: /^[A-Za-z0-9\-_]+$/,
  ORG_CODE: /^[A-Za-z0-9]{3,20}$/,
  POSITIVE_NUMBER: /^\d+(\.\d+)?$/,
  INTEGER: /^\d+$/,
} as const;
```

### 62.11 消息提示

```typescript
const TOAST_MESSAGES = {
  // 成功
  CREATE_SUCCESS: '创建成功',
  UPDATE_SUCCESS: '更新成功',
  DELETE_SUCCESS: '删除成功',
  SAVE_SUCCESS: '保存成功',
  IMPORT_SUCCESS: '导入成功',
  EXPORT_SUCCESS: '导出成功',
  PRINT_SUCCESS: '打印成功',
  APPROVE_SUCCESS: '审批成功',
  REJECT_SUCCESS: '驳回成功',
  SEND_SUCCESS: '发送成功',

  // 错误
  CREATE_FAILED: '创建失败',
  UPDATE_FAILED: '更新失败',
  DELETE_FAILED: '删除失败',
  SAVE_FAILED: '保存失败',
  IMPORT_FAILED: '导入失败',
  EXPORT_FAILED: '导出失败',
  PRINT_FAILED: '打印失败',

  // 确认
  DELETE_CONFIRM: '确定要删除吗？此操作不可撤销。',
  CANCEL_CONFIRM: '确定要取消吗？已填写的数据将丢失。',
  CLOSE_CONFIRM: '确定要关单吗？关单后将无法修改。',

  // 提示
  NO_DATA: '暂无数据',
  LOADING: '加载中...',
  SAVING: '保存中...',
  UPLOADING: '上传中...',
  EXPORTING: '导出中...',
} as const;
```

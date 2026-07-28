

---

## 第59章 国际化与多语言规范

### 59.1 概述

系统当前仅支持中文（zh-CN），但代码架构预留了多语言扩展能力。

### 59.2 当前语言配置

```typescript
// 语言常量
const SUPPORTED_LANGUAGES = ['zh-CN'] as const;
const DEFAULT_LANGUAGE = 'zh-CN';
const FALLBACK_LANGUAGE = 'zh-CN';

// 语言检测
function detectLanguage(): string {
  const stored = localStorage.getItem('lang');
  if (stored && SUPPORTED_LANGUAGES.includes(stored as any)) {
    return stored;
  }
  return DEFAULT_LANGUAGE;
}
```

### 59.3 文案规范

#### 统一文案管理

```typescript
// src/i18n/zh-CN.ts
const messages = {
  // 通用
  common: {
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    create: '新建',
    search: '搜索',
    filter: '筛选',
    reset: '重置',
    export: '导出',
    import: '导入',
    print: '打印',
    preview: '预览',
    loading: '加载中...',
    noData: '暂无数据',
    success: '操作成功',
    error: '操作失败',
    required: '必填',
    optional: '选填',
  },

  // 模块
  inbound: {
    title: '来货登记',
    create: '新增入库',
    edit: '编辑入库',
    batchNo: '批次号',
    customer: '客户',
    inboundDate: '入库日期',
    photos: '现场照片',
    items: '入库明细',
    status: {
      draft: '草稿',
      pending: '待审核',
      completed: '已完成',
      cancelled: '已取消',
    },
  },
  outbound: {
    title: '快速发货',
    create: '新增发货',
    edit: '编辑发货',
    deliveryNo: '送货单号',
    customer: '客户',
    outboundDate: '发货日期',
    items: '发货明细',
    status: {
      pending: '待发货',
      partial: '部分发货',
      completed: '已完成',
      cancelled: '已取消',
    },
  },
  inventory: {
    title: '库存管理',
    currentQty: '当前库存',
    location: '库位',
    batchNo: '批次号',
    status: {
      normal: '正常',
      expired: '超期',
      low_stock: '低库存',
    },
  },
  reconciliation: {
    title: '智能对账',
    create: '创建对账单',
    period: '对账期间',
    totalAmount: '应收总额',
    paidAmount: '已收金额',
    unpaidAmount: '未收金额',
    status: {
      draft: '草稿',
      pending: '待确认',
      confirmed: '已确认',
      rejected: '已驳回',
      settled: '已结清',
    },
  },
} as const;
```

### 59.4 日期格式

```typescript
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn');

// 统一日期格式
const DATE_FORMATS = {
  date: 'YYYY-MM-DD',
  dateTime: 'YYYY-MM-DD HH:mm',
  time: 'HH:mm',
  fullDateTime: 'YYYY-MM-DD HH:mm:ss',
  month: 'YYYY-MM',
  year: 'YYYY',
  friendly: 'M月D日',
  friendlyDateTime: 'M月D日 HH:mm',
} as const;

// 格式化函数
function formatDate(date: string | Date, format = DATE_FORMATS.date): string {
  return dayjs(date).format(format);
}

function formatFriendlyDate(date: string | Date): string {
  const d = dayjs(date);
  const now = dayjs();
  const diffDays = now.diff(d, 'day');

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays === 2) return '前天';
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  return d.format(DATE_FORMATS.date);
}
```

### 59.5 数字格式

```typescript
// 金额格式
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// 重量格式
function formatWeight(weight: number): string {
  if (weight >= 1000) {
    return `${(weight / 1000).toFixed(2)} 吨`;
  }
  return `${weight.toFixed(2)} kg`;
}

// 数量格式
function formatQty(qty: number, unit: string): string {
  return `${qty} ${unit}`;
}

// 百分比
function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
```

### 59.6 错误消息

```typescript
const ERROR_MESSAGES = {
  // 网络
  NETWORK_ERROR: '网络连接失败，请检查网络',
  TIMEOUT: '请求超时，请稍后重试',
  SERVER_ERROR: '服务器错误，请稍后重试',

  // 认证
  UNAUTHORIZED: '登录已过期，请重新登录',
  FORBIDDEN: '您没有权限执行此操作',

  // 业务
  NOT_FOUND: '请求的资源不存在',
  VALIDATION_ERROR: '数据验证失败',
  CONFLICT: '操作冲突，请刷新后重试',

  // 入库
  CUSTOMER_NOT_FOUND: '客户不存在',
  PRODUCT_NOT_FOUND: '产品不存在',
  BATCH_NO_DUPLICATE: '批次号已存在',

  // 出库
  INSUFFICIENT_STOCK: '库存不足',
  INBOUND_NOT_COMPLETED: '入库记录未完成',

  // 对账
  PERIOD_DUPLICATE: '对账期间已存在',
} as const;

function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || '操作失败';
}
```

### 59.7 表单验证消息

```typescript
const VALIDATION_MESSAGES = {
  required: (field: string) => `${field}不能为空`,
  minLength: (field: string, min: number) => `${field}至少${min}个字符`,
  maxLength: (field: string, max: number) => `${field}最多${max}个字符`,
  pattern: (field: string, pattern: string) => `${field}格式不正确`,
  min: (field: string, min: number) => `${field}不能小于${min}`,
  max: (field: string, max: number) => `${field}不能大于${max}`,
  email: '请输入正确的邮箱地址',
  phone: '请输入正确的手机号',
  url: '请输入正确的URL',
} as const;
```

### 59.8 枚举标签

```typescript
const LABELS = {
  material: {
    steel: '钢材',
    aluminum: '铝材',
    copper: '铜材',
    other: '其他',
  },
  process: {
    quench: '淬火',
    temper: '回火',
    anneal: '退火',
    normalize: '正火',
    carburize: '渗碳',
    nitride: '渗氮',
  },
  pricingMethod: {
    weight: '按重量',
    piece: '按件数',
  },
  inboundStatus: {
    draft: '草稿',
    pending: '待审核',
    completed: '已完成',
    cancelled: '已取消',
  },
  outboundStatus: {
    pending: '待发货',
    partial: '部分发货',
    completed: '已完成',
    cancelled: '已取消',
  },
  inventoryStatus: {
    normal: '正常',
    expired: '超期',
    low_stock: '低库存',
  },
  reconciliationStatus: {
    draft: '草稿',
    pending: '待确认',
    confirmed: '已确认',
    rejected: '已驳回',
    settled: '已结清',
  },
  roleType: {
    super_admin: '超级管理员',
    admin: '管理员',
    finance: '财务',
    inbound_operator: '入库操作员',
    outbound_operator: '出库操作员',
    member: '普通成员',
    viewer: '只读用户',
  },
} as const;

function getLabel(category: string, key: string): string {
  return LABELS[category]?.[key] || key;
}
```

/**
 * 飞书多维表格集成 — 常量定义
 */

// ====== API 端点 ======
export const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';
export const FEISHU_AUTH_URL = `${FEISHU_API_BASE}/auth/v3/tenant_access_token/internal`;
export const BITABLE_V1 = `${FEISHU_API_BASE}/bitable/v1/apps`;

// ====== 多维表格 App Token 由租户配置动态提供 ======


// ====== 数据表 ID 由租户配置动态提供，不再硬编码 ======


// ====== 字段名映射 ======
export const FIELD_NAMES = {
  inbound: {
    orderId: '来货单号',
    customerName: '客户名称',
    productName: '产品名称',
    quantity: '来货数量',
    weight: '来货重量(kg)',
    createdAt: '登记时间',
    createdBy: '登记人',
    status: '状态',
  },
  outbound: {
    orderId: '发货单号',
    customerName: '客户名称',
    productName: '产品名称',
    quantity: '发货数量',
    weight: '发货重量(kg)',
    batchNo: '批次号',
    createdAt: '发货时间',
    status: '状态',
  },
  inventory: {
    productName: '产品名称',
    material: '材质',
    currentStock: '当前库存',
    unit: '单位',
    location: '库位',
    batchNo: '批次号',
    inboundDate: '入库日期',
  },
  customer: {
    name: '客户名称',
    contact: '联系人',
    phone: '联系电话',
    address: '地址',
    totalInbound: '累计来货次数',
    totalOutbound: '累计发货次数',
    paymentRate: '回款率',
    lastTradeDate: '最近交易日期',
  },
  reconciliation: {
    date: '日期',
    customerName: '客户名称',
    outboundAmount: '出库金额',
    invoicedAmount: '已开票金额',
    receivedAmount: '已回款金额',
    paymentStatus: '回款状态',
  },
  quality: {
    batchNo: '批次号',
    productName: '产品名称',
    customerName: '客户名称',
    inspectDate: '检测日期',
    inspectItem: '检测项目',
    inspectResult: '检测结果',
    verdict: '判定',
    inspector: '检测人',
    remark: '备注',
  },
  process: {
    batchNo: '批次号',
    productName: '产品名称',
    customerName: '客户名称',
    processType: '工艺类型',
    heatTemp: '加热温度℃',
    holdTime: '保温时间min',
    coolMethod: '冷却方式',
    chargeWeight: '装炉量kg',
    operator: '操作人',
    operateTime: '操作时间',
    remark: '备注',
  },
} as const;

// ====== 同步配置 ======
export const SYNC_CONFIG = {
  INVENTORY_SYNC_INTERVAL_MS: Number(process.env.FEISHU_INVENTORY_SYNC_INTERVAL) || 5 * 60 * 1000,
  RATE_LIMIT_PER_SECOND: 5,
  TOKEN_REFRESH_BUFFER_MS: 60 * 1000,
  REQUEST_TIMEOUT_MS: 15_000,
  BATCH_CREATE_MAX: 500,
  RETRY: {
    maxAttempts: 3,
    baseDelayMs: 1000,
  },
} as const;

// ====== 飞书云空间上传 ======
export const FEISHU_DRIVE_UPLOAD_URL = `${FEISHU_API_BASE}/drive/v1/medias/upload_all`;

// ====== 回款状态枚举 ======
export const PAYMENT_STATUS = {
  SETTLED: '已结清',
  PARTIAL: '部分回款',
  UNPAID: '未回款',
} as const;

// ====== 来货/发货状态枚举 ======
export const ORDER_STATUS = {
  INBOUND_PENDING: '待处理',
  INBOUND_RECEIVED: '已入库',
  INBOUND_CANCELLED: '已取消',
  OUTBOUND_PARTIAL: '部分发货',
  OUTBOUND_CLOSED: '已完结',
} as const;

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
    attachments: '附件',
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
    code: '客户编号',
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
    orderId: '对账单号',
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

/**
 * 同步字段的飞书字段类型。校验和“补齐缺失字段”共用这份定义，防止只按名称
 * 校验后，把数字/日期错误写入文本字段而让任务反复失败。
 * 1=文本，2=数字，3=单选，5=日期，6=进度，17=附件。
 */
export const FEISHU_FIELD_TYPES = {
  inbound: {
    [FIELD_NAMES.inbound.orderId]: 1,
    [FIELD_NAMES.inbound.customerName]: 1,
    [FIELD_NAMES.inbound.productName]: 1,
    [FIELD_NAMES.inbound.quantity]: 2,
    [FIELD_NAMES.inbound.weight]: 2,
    [FIELD_NAMES.inbound.createdAt]: 5,
    [FIELD_NAMES.inbound.createdBy]: 1,
    [FIELD_NAMES.inbound.status]: 3,
    [FIELD_NAMES.inbound.attachments]: 17,
  },
  outbound: {
    [FIELD_NAMES.outbound.orderId]: 1,
    [FIELD_NAMES.outbound.customerName]: 1,
    [FIELD_NAMES.outbound.productName]: 1,
    [FIELD_NAMES.outbound.quantity]: 2,
    [FIELD_NAMES.outbound.weight]: 2,
    [FIELD_NAMES.outbound.batchNo]: 1,
    [FIELD_NAMES.outbound.createdAt]: 5,
    [FIELD_NAMES.outbound.status]: 3,
  },
  inventory: {
    [FIELD_NAMES.inventory.productName]: 1,
    [FIELD_NAMES.inventory.material]: 1,
    [FIELD_NAMES.inventory.currentStock]: 2,
    [FIELD_NAMES.inventory.unit]: 1,
    [FIELD_NAMES.inventory.location]: 1,
    [FIELD_NAMES.inventory.batchNo]: 1,
    [FIELD_NAMES.inventory.inboundDate]: 5,
  },
  customer: {
    [FIELD_NAMES.customer.code]: 1,
    [FIELD_NAMES.customer.name]: 1,
    [FIELD_NAMES.customer.contact]: 1,
    [FIELD_NAMES.customer.phone]: 1,
    [FIELD_NAMES.customer.address]: 1,
    [FIELD_NAMES.customer.totalInbound]: 2,
    [FIELD_NAMES.customer.totalOutbound]: 2,
    [FIELD_NAMES.customer.paymentRate]: 6,
    [FIELD_NAMES.customer.lastTradeDate]: 5,
  },
  reconciliation: {
    [FIELD_NAMES.reconciliation.orderId]: 1,
    [FIELD_NAMES.reconciliation.date]: 5,
    [FIELD_NAMES.reconciliation.customerName]: 1,
    [FIELD_NAMES.reconciliation.outboundAmount]: 2,
    [FIELD_NAMES.reconciliation.invoicedAmount]: 2,
    [FIELD_NAMES.reconciliation.receivedAmount]: 2,
    [FIELD_NAMES.reconciliation.paymentStatus]: 3,
  },
  quality: {
    [FIELD_NAMES.quality.batchNo]: 1,
    [FIELD_NAMES.quality.productName]: 1,
    [FIELD_NAMES.quality.customerName]: 1,
    [FIELD_NAMES.quality.inspectDate]: 5,
    [FIELD_NAMES.quality.inspectItem]: 3,
    [FIELD_NAMES.quality.inspectResult]: 1,
    [FIELD_NAMES.quality.verdict]: 3,
    [FIELD_NAMES.quality.inspector]: 1,
    [FIELD_NAMES.quality.remark]: 1,
  },
  process: {
    [FIELD_NAMES.process.batchNo]: 1,
    [FIELD_NAMES.process.productName]: 1,
    [FIELD_NAMES.process.customerName]: 1,
    [FIELD_NAMES.process.processType]: 3,
    [FIELD_NAMES.process.heatTemp]: 2,
    [FIELD_NAMES.process.holdTime]: 2,
    [FIELD_NAMES.process.coolMethod]: 1,
    [FIELD_NAMES.process.chargeWeight]: 2,
    [FIELD_NAMES.process.operator]: 1,
    [FIELD_NAMES.process.operateTime]: 5,
    [FIELD_NAMES.process.remark]: 1,
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

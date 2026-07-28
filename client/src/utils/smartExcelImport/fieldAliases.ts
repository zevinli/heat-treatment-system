/**
 * 字段别名配置 - 智能列识别库
 */
import type { FieldAliasConfig } from './types';

export const productFieldAliases: FieldAliasConfig[] = [
  {
    field: 'code',
    exact: ['编码', '编号', '产品编码', '产品编号', 'code', 'productCode', '编号'],
    fuzzy: ['码', '号', '编号', '编码', '代号', 'SKU', '货号'],
    patterns: [/^编[码号]?/, /code/i, /编号?/, /sku/i, /货号?/],
    dataPatterns: [/^[A-Za-z0-9\-]+$/],
  },
  {
    field: 'name',
    exact: ['产品名称', '产品名', '品名', 'name', 'productName', '货物名称', '货品名称'],
    fuzzy: ['产品', '名称', '品名', '货品', '货物'],
    patterns: [/^产品(名|名称)?$/, /品名/, /^name$/i, /^product(name)?$/i],
    dataPatterns: [/.{2,50}/], // 产品名称通常是2-50个字符
  },
  {
    field: 'material',
    exact: ['材质', '材料', '材质规格', 'material', '钢种', '牌号'],
    fuzzy: ['钢', '材质', '材料', '钢种', '钢号', '材质类型', '材料规格'],
    patterns: [/材质?/, /材料?/, /钢号?/, /钢种?/, /牌号?/, /\d{2,}#/],
    dataPatterns: [/[#钢铁铝铜合金]/, /^(Q\d|\d{2,}#|20Cr|40Cr|42CrMo)/i],
  },
  {
    field: 'process',
    exact: ['工艺', '加工工艺', '处理工艺', 'process', '加工方式', '热处理'],
    fuzzy: ['处理', '工艺', '加工', '热处理方式', '表面工艺'],
    patterns: [/工艺?/, /process/i, /处理/, /加工/, /淬火|回火|正火|退火|调质|渗碳|氮化/],
  },
  {
    field: 'techRequirement',
    exact: ['技术要求', '技术条件', '质量要求', 'techRequirement', '验收标准'],
    fuzzy: ['要求', '技术', '质量', '标准', '规范'],
    patterns: [/技术(要求|条件|标准)?/, /质量(要求|标准)?/, /验收/, /规范/, /HRC|HB|HV/],
  },
  {
    field: 'workpieceNo',
    exact: ['图号', '工件号', '零件号', 'workpieceNo', 'drawingNo', '件号'],
    fuzzy: ['图号', '工件', '零件', '图纸', 'drawing'],
    patterns: [/图号?/, /工件号?/, /零件号?/, /drawing/i, /件号?/],
  },
  {
    field: 'unit',
    exact: ['单位', '计量单位', 'unit', '计量单位'],
    fuzzy: ['单位', '件', '个', 'kg', '套'],
    patterns: [/单位?/, /unit/i],
    dataPatterns: [/^(件|个|kg|套|只|支|根|片|块|套|组)$/],
  },
  {
    field: 'unitPrice',
    exact: ['单价', '价格', '单价(元)', 'unitPrice', 'price', '报价'],
    fuzzy: ['价', '金额', '单价', '价格', '成本', '费用', '元', '钱'],
    patterns: [/^单价?/, /price/i, /cost/i, /金额?/, /元/, /报价/],
    dataPatterns: [/^\d+\.?\d*$/, /[¥￥]\s*\d+/, /\d+\s*[元块]/],
  },
  {
    field: 'customerCode',
    exact: ['客户编码', '客户编号', 'customerCode', '客户代码'],
    fuzzy: ['客户', '编码', '编号', '代码'],
    patterns: [/客户(编码|编号|代码)?/, /customer( code| id)?/i],
  },
  {
    field: 'customerName',
    exact: ['客户名称', '客户名', 'customerName', '客户单位', '客户公司名称'],
    fuzzy: ['客户名称', '客户名', '客户单位', '公司名称', '客户公司'],
    patterns: [/客户(名|名称|单位)$/, /^customer( name)?$/i, /客户公司/],
    dataPatterns: [/^[^\d]{2,20}$/], // 客户名称通常是2-20个字符的非数字文本
  },
  {
    field: 'stock',
    exact: ['库存', '库存数量', 'stock', '库存量', '现有库存'],
    fuzzy: ['库存', '数量', '存量', '现有', '剩余'],
    patterns: [/库存?/, /stock/i, /数量/, /存量/],
    dataPatterns: [/^\d+$/, /^\d+\.?\d*$/],
  },
  {
    field: 'warningThreshold',
    exact: ['预警值', '阈值', '库存预警', 'warningThreshold', '预警数量'],
    fuzzy: ['预警', '阈值', '告警', '提醒值', '安全库存'],
    patterns: [/预警/, /阈值/, /告警/, /warning/i, /threshold/i, /安全库存/],
    dataPatterns: [/^\d+$/],
  },
];

// 复合字段模式 - 用于检测材质+工艺混合列
export const compositeFieldPatterns = {
  // 分隔符模式
  delimiters: ['/', '、', ',', '，', ';', '；', '|', ' ', '，', '／'],
  
  // 材质指示词
  materialIndicators: [
    '钢', '铁', '铝', '铜', '合金', '#', 'Q', 'CR', 'MO', 'MN', 'NI', 'TI',
    '45', '40', '42', '20', '35', '304', '316', '201', 'Q235', 'Q345'
  ],
  
  // 工艺指示词
  processIndicators: [
    '淬火', '回火', '正火', '退火', '调质', '渗碳', '氮化', '碳氮共渗',
    '高频', '中频', '感应', '表面', '喷砂', '抛光', '镀铬', '镀锌',
    '发黑', '磷化', '氧化'
  ],
  
  // 要求指示词
  requirementIndicators: [
    '硬度', 'HRC', 'HB', 'HV', '强度', '精度', '粗糙度', 'Ra', '公差',
    '尺寸', '规格', '范围', '-', '~', '至'
  ],
  
  // 键值对模式
  keyValuePatterns: [
    { regex: /材质[：:]?\s*([^工艺要求\s]+)/i, field: 'material' },
    { regex: /材料[：:]?\s*([^工艺要求\s]+)/i, field: 'material' },
    { regex: /工艺[：:]?\s*([^要求\s]+)/i, field: 'process' },
    { regex: /处理[：:]?\s*([^要求\s]+)/i, field: 'process' },
    { regex: /要求[：:]?\s*(.+)/i, field: 'techRequirement' },
    { regex: /技术[：:]?\s*(.+)/i, field: 'techRequirement' },
  ],
};

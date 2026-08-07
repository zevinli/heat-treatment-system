/**
 * 飞书多维表格路由映射配置
 * 
 * 设计原则：
 * 1. 每个业务页面自动匹配对应的飞书多维表格
 * 2. 页面路由 → 飞书表格 → 一键跳转
 * 3. 无匹配时显示全局入口（所有表格列表）
 */

// 飞书多维表格 APP_TOKEN
const FEISHU_BITABLE_APP_TOKEN = import.meta.env.VITE_FEISHU_BITABLE_APP_TOKEN || 'Zm8hbsb2qauVpRsFqewcsPvXn9e';

// 生成飞书多维表格链接
export function buildFeishuTableUrl(tableId: string): string {
  return `https://mijjdnrzbcr.feishu.cn/base/${FEISHU_BITABLE_APP_TOKEN}?table=${tableId}`;
}

// 表格类型定义
export interface FeishuTableLink {
  tableId: string;
  tableName: string;
  description: string;
  icon: string;
}

// 7 张多维表格定义
export const FEISHU_TABLES: Record<string, FeishuTableLink> = {
  inbound: {
    tableId: import.meta.env.VITE_FEISHU_TABLE_INBOUND || 'tblGvFn8ZAvclv2Z',
    tableName: '来货登记表',
    description: '查看所有来货记录与状态',
    icon: '📥',
  },
  outbound: {
    tableId: import.meta.env.VITE_FEISHU_TABLE_OUTBOUND || 'tblvKvBeCyVZ9RJb',
    tableName: '发货记录表',
    description: '查看所有发货记录与物流',
    icon: '📤',
  },
  inventory: {
    tableId: import.meta.env.VITE_FEISHU_TABLE_INVENTORY || 'tblcVl8qF8ouL7Nq',
    tableName: '库存总表',
    description: '实时库存数据与预警',
    icon: '📦',
  },
  customer: {
    tableId: import.meta.env.VITE_FEISHU_TABLE_CUSTOMER || 'tblRPvUVpGdeJqHw',
    tableName: '客户信息表',
    description: '客户档案与历史记录',
    icon: '🏢',
  },
  reconciliation: {
    tableId: import.meta.env.VITE_FEISHU_TABLE_RECONCILIATION || 'tblfHe4BYFeeFMe0',
    tableName: '对账单表',
    description: '财务对账与回款追踪',
    icon: '💰',
  },
  quality: {
    tableId: import.meta.env.VITE_FEISHU_TABLE_QUALITY || 'tbl313ocjP60NDor',
    tableName: '质检记录表',
    description: '产品质量检测记录',
    icon: '🔍',
  },
  process: {
    tableId: import.meta.env.VITE_FEISHU_TABLE_PROCESS || 'tblnqyZ03gNRPi6l',
    tableName: '工艺参数表',
    description: '热处理工艺参数配置',
    icon: '⚙️',
  },
};

// 页面路由 → 飞书表格 Key 的映射
export const PAGE_TO_FEISHU_TABLE: Record<string, keyof typeof FEISHU_TABLES> = {
  '/inbound': 'inbound',
  '/outbound': 'outbound',
  '/inventory': 'inventory',
  '/customers': 'customer',
  '/reconciliation': 'reconciliation',
};

// 根据当前路由获取对应的飞书表格链接（用于上下文按钮）
export function getFeishuTableForPage(pathname: string): { tableKey: string; table: FeishuTableLink; url: string } | null {
  if (PAGE_TO_FEISHU_TABLE[pathname]) {
    const tableKey = PAGE_TO_FEISHU_TABLE[pathname];
    const table = FEISHU_TABLES[tableKey];
    return { tableKey, table, url: buildFeishuTableUrl(table.tableId) };
  }
  
  for (const [route, tableKey] of Object.entries(PAGE_TO_FEISHU_TABLE)) {
    if (pathname.startsWith(route + '/') || pathname === route) {
      const table = FEISHU_TABLES[tableKey];
      return { tableKey, table, url: buildFeishuTableUrl(table.tableId) };
    }
  }
  
  return null;
}

// 获取所有表格链接（用于全局下拉菜单）
export function getAllFeishuTableLinks(): Array<{ key: string; table: FeishuTableLink; url: string }> {
  return Object.entries(FEISHU_TABLES).map(([key, table]) => ({
    key,
    table,
    url: buildFeishuTableUrl(table.tableId),
  }));
}

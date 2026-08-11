/**
 * 飞书多维表格路由映射配置
 * 
 * 设计原则：
 * 1. 每个业务页面自动匹配对应的飞书多维表格
 * 2. 页面路由 → 飞书表格 → 一键跳转
 * 3. 无匹配时显示全局入口（所有表格列表）
 */

export interface FeishuRuntimeConfig {
  configured: boolean;
  orgCode: string;
  baseUrl?: string;
  tables: Partial<Record<keyof typeof FEISHU_TABLES, string>>;
  syncQueue?: Record<'pending' | 'processing' | 'failed' | 'completed', number>;
  lastSyncedAt?: string | null;
}

export function buildFeishuTableUrl(baseUrl: string, tableId: string): string {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}table=${encodeURIComponent(tableId)}`;
}

// 表格类型定义
export interface FeishuTableLink {
  tableId: string;
  tableName: string;
  description: string;
  icon: string;
}

// 7 张多维表格定义
export const FEISHU_TABLES: Record<string, Omit<FeishuTableLink, 'tableId'>> = {
  inbound: {
    tableName: '来货登记表',
    description: '查看所有来货记录与状态',
    icon: '📥',
  },
  outbound: {
    tableName: '发货记录表',
    description: '查看所有发货记录与物流',
    icon: '📤',
  },
  inventory: {
    tableName: '库存总表',
    description: '实时库存数据与预警',
    icon: '📦',
  },
  customer: {
    tableName: '客户信息表',
    description: '客户档案与历史记录',
    icon: '🏢',
  },
  reconciliation: {
    tableName: '对账单表',
    description: '财务对账与回款追踪',
    icon: '💰',
  },
  quality: {
    tableName: '质检记录表',
    description: '产品质量检测记录',
    icon: '🔍',
  },
  process: {
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
export function getFeishuTableForPage(pathname: string, config?: FeishuRuntimeConfig): { tableKey: string; table: FeishuTableLink; url: string } | null {
  if (!config?.configured || !config.baseUrl) return null;
  if (PAGE_TO_FEISHU_TABLE[pathname]) {
    const tableKey = PAGE_TO_FEISHU_TABLE[pathname];
    const tableId = config.tables[tableKey];
    if (!tableId) return null;
    const table = { ...FEISHU_TABLES[tableKey], tableId };
    return { tableKey, table, url: buildFeishuTableUrl(config.baseUrl, tableId) };
  }
  
  for (const [route, tableKey] of Object.entries(PAGE_TO_FEISHU_TABLE)) {
    if (pathname.startsWith(route + '/') || pathname === route) {
      const tableId = config.tables[tableKey];
      if (!tableId) return null;
      const table = { ...FEISHU_TABLES[tableKey], tableId };
      return { tableKey, table, url: buildFeishuTableUrl(config.baseUrl, tableId) };
    }
  }
  
  return null;
}

// 获取所有表格链接（用于全局下拉菜单）
export function getAllFeishuTableLinks(config?: FeishuRuntimeConfig): Array<{ key: string; table: FeishuTableLink; url: string }> {
  if (!config?.configured || !config.baseUrl) return [];
  return Object.entries(FEISHU_TABLES).flatMap(([key, metadata]) => {
    const tableId = config.tables[key as keyof typeof FEISHU_TABLES];
    if (!tableId) return [];
    const table = { ...metadata, tableId };
    return [{ key, table, url: buildFeishuTableUrl(config.baseUrl!, tableId) }];
  });
}

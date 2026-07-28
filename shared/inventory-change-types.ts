/**
 * 库存变动类型配置
 * 中央化管理所有库存变动类型的展示配置
 */

import type { InventoryChangeType } from './api.interface';

/**
 * 变动方向
 */
export type ChangeDirection = 'up' | 'down' | 'neutral';

/**
 * 业务分类
 */
export type ChangeCategory = 
  | 'inbound'      // 入库类
  | 'outbound'     // 出库类
  | 'adjustment'   // 调整类
  | 'inventory'    // 盘点类
  | 'disposal'     // 处置类
  | 'manual'       // 手动类
  | 'system';      // 系统类

/**
 * 主题配色配置
 */
export interface ChangeTypeTheme {
  bg: string;
  text: string;
  border: string;
  icon: string;
  directionIcon: string;
}

/**
 * 变动类型完整配置
 */
export interface ChangeTypeConfig {
  /** 显示名称 */
  label: string;
  /** 业务分类 */
  category: ChangeCategory;
  /** 图标名称 (Lucide icon name) */
  icon: string;
  /** 主题配色 */
  theme: ChangeDirection;
  /** 变动方向 */
  direction: ChangeDirection;
  /** 是否为撤销类操作 */
  isRollback?: boolean;
  /** 业务描述 */
  description: string;
  /** 排序权重 */
  sortOrder: number;
}

/**
 * 颜色主题映射
 */
export const directionThemes: Record<ChangeDirection, ChangeTypeTheme> = {
  up: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: 'text-emerald-600',
    directionIcon: 'text-emerald-600',
  },
  down: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: 'text-rose-600',
    directionIcon: 'text-rose-600',
  },
  neutral: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: 'text-slate-600',
    directionIcon: 'text-slate-600',
  },
};

/**
 * 撤销类特殊主题（黄色系）
 */
export const rollbackTheme: ChangeTypeTheme = {
  bg: 'bg-amber-50',
  text: 'text-amber-800',
  border: 'border-amber-300',
  icon: 'text-amber-600',
  directionIcon: 'text-amber-600',
};

/**
 * 盘点类特殊主题（紫色系）
 */
export const inventoryTheme: ChangeTypeTheme = {
  bg: 'bg-violet-50',
  text: 'text-violet-700',
  border: 'border-violet-200',
  icon: 'text-violet-600',
  directionIcon: 'text-violet-600',
};

/**
 * 处置类特殊主题（深红色系）
 */
export const disposalTheme: ChangeTypeTheme = {
  bg: 'bg-red-50',
  text: 'text-red-800',
  border: 'border-red-300',
  icon: 'text-red-600',
  directionIcon: 'text-red-600',
};

/**
 * 调整类特殊主题（蓝色系）
 */
export const adjustmentTheme: ChangeTypeTheme = {
  bg: 'bg-blue-50',
  text: 'text-blue-700',
  border: 'border-blue-200',
  icon: 'text-blue-600',
  directionIcon: 'text-blue-600',
};

/**
 * 所有库存变动类型配置
 */
export const INVENTORY_CHANGE_TYPE_CONFIG: Record<InventoryChangeType, ChangeTypeConfig> = {
  // 入库类 - 绿色系
  inbound: {
    label: '入库',
    category: 'inbound',
    icon: 'Package',
    theme: 'up',
    direction: 'up',
    description: '正常入库单入库',
    sortOrder: 10,
  },
  return: {
    label: '退货入库',
    category: 'inbound',
    icon: 'RotateCcw',
    theme: 'up',
    direction: 'up',
    description: '客户退货入库',
    sortOrder: 11,
  },
  inbound_rollback: {
    label: '入库撤销',
    category: 'inbound',
    icon: 'Undo2',
    theme: 'down',
    direction: 'down',
    isRollback: true,
    description: '入库单被撤销，库存回滚',
    sortOrder: 12,
  },

  // 出库类 - 红色系
  outbound: {
    label: '出库',
    category: 'outbound',
    icon: 'Truck',
    theme: 'down',
    direction: 'down',
    description: '正常出库单出库',
    sortOrder: 20,
  },
  outbound_rollback: {
    label: '出库撤销',
    category: 'outbound',
    icon: 'Undo2',
    theme: 'up',
    direction: 'up',
    isRollback: true,
    description: '出库单被撤销，库存恢复',
    sortOrder: 21,
  },

  // 盘点类 - 紫色系
  inventory_profit: {
    label: '盘点盘盈',
    category: 'inventory',
    icon: 'TrendingUp',
    theme: 'up',
    direction: 'up',
    description: '盘点发现实际库存多于账面',
    sortOrder: 30,
  },
  inventory_loss: {
    label: '盘点盘亏',
    category: 'inventory',
    icon: 'TrendingDown',
    theme: 'down',
    direction: 'down',
    description: '盘点发现实际库存少于账面',
    sortOrder: 31,
  },

  // 处置类 - 深红色系
  damage: {
    label: '损坏报废',
    category: 'disposal',
    icon: 'AlertTriangle',
    theme: 'down',
    direction: 'down',
    description: '产品损坏报废',
    sortOrder: 40,
  },
  quality_reject: {
    label: '质检不合格',
    category: 'disposal',
    icon: 'XCircle',
    theme: 'down',
    direction: 'down',
    description: '质检不合格扣减',
    sortOrder: 41,
  },
  scrap: {
    label: '报废处理',
    category: 'disposal',
    icon: 'Trash2',
    theme: 'down',
    direction: 'down',
    description: '批次报废处理',
    sortOrder: 42,
  },

  // 调整类 - 蓝色系
  adjustment_increase: {
    label: '调整增加',
    category: 'adjustment',
    icon: 'Settings',
    theme: 'up',
    direction: 'up',
    description: '系统调整增加库存',
    sortOrder: 50,
  },
  adjustment_decrease: {
    label: '调整减少',
    category: 'adjustment',
    icon: 'Settings',
    theme: 'down',
    direction: 'down',
    description: '系统调整减少库存',
    sortOrder: 51,
  },

  // 手动类 - 天蓝色系
  manual_increase: {
    label: '手动增加',
    category: 'manual',
    icon: 'PlusCircle',
    theme: 'up',
    direction: 'up',
    description: '人工手动增加库存',
    sortOrder: 60,
  },
  manual_decrease: {
    label: '手动减少',
    category: 'manual',
    icon: 'MinusCircle',
    theme: 'down',
    direction: 'down',
    description: '人工手动减少库存',
    sortOrder: 61,
  },

  // 系统类 - 灰色系
  closed_balance: {
    label: '关账结算',
    category: 'system',
    icon: 'FileCheck',
    theme: 'neutral',
    direction: 'neutral',
    description: '月度/年度关账结算',
    sortOrder: 70,
  },
  rework: {
    label: '返工处理',
    category: 'system',
    icon: 'Hammer',
    theme: 'neutral',
    direction: 'neutral',
    description: '批次返工处理',
    sortOrder: 71,
  },
};

/**
 * 获取变动类型配置
 */
export function getChangeTypeConfig(type: InventoryChangeType): ChangeTypeConfig {
  return INVENTORY_CHANGE_TYPE_CONFIG[type] || INVENTORY_CHANGE_TYPE_CONFIG.closed_balance;
}

/**
 * 获取变动类型的主题样式
 */
export function getChangeTypeTheme(type: InventoryChangeType): ChangeTypeTheme {
  const config = getChangeTypeConfig(type);
  
  // 撤销类使用特殊主题
  if (config.isRollback) {
    return rollbackTheme;
  }
  
  // 盘点类使用特殊主题
  if (config.category === 'inventory') {
    return inventoryTheme;
  }
  
  // 处置类使用特殊主题
  if (config.category === 'disposal') {
    return disposalTheme;
  }
  
  // 调整类使用特殊主题
  if (config.category === 'adjustment') {
    return adjustmentTheme;
  }
  
  // 其他使用方向主题
  return directionThemes[config.theme];
}

/**
 * 按业务分类获取类型列表
 */
export function getChangeTypesByCategory(category: ChangeCategory): InventoryChangeType[] {
  return (Object.entries(INVENTORY_CHANGE_TYPE_CONFIG) as [InventoryChangeType, ChangeTypeConfig][])
    .filter(([, config]) => config.category === category)
    .map(([type]) => type);
}

/**
 * 分类标签映射
 */
export const categoryLabels: Record<ChangeCategory, string> = {
  inbound: '入库类',
  outbound: '出库类',
  adjustment: '调整类',
  inventory: '盘点类',
  disposal: '处置类',
  manual: '手动类',
  system: '系统类',
};

/**
 * 获取所有分类及下属类型
 * 用于筛选器分组展示
 */
export function getCategoryGroups(): { category: ChangeCategory; label: string; types: InventoryChangeType[] }[] {
  const categories: ChangeCategory[] = ['inbound', 'outbound', 'inventory', 'disposal', 'adjustment', 'manual', 'system'];
  
  return categories.map(category => ({
    category,
    label: categoryLabels[category],
    types: getChangeTypesByCategory(category),
  }));
}

/**
 * 方向标签映射
 */
export const directionLabels: Record<ChangeDirection, string> = {
  up: '增加',
  down: '减少',
  neutral: '不变',
};

/**
 * 获取变动类型的显示标签
 */
export function getChangeTypeLabel(type: InventoryChangeType): string {
  return getChangeTypeConfig(type).label;
}

/**
 * 检查是否为库存增加类型
 */
export function isStockIncrease(type: InventoryChangeType): boolean {
  return getChangeTypeConfig(type).direction === 'up';
}

/**
 * 检查是否为库存减少类型
 */
export function isStockDecrease(type: InventoryChangeType): boolean {
  return getChangeTypeConfig(type).direction === 'down';
}

/**
 * 检查是否为撤销类操作
 */
export function isRollbackType(type: InventoryChangeType): boolean {
  return getChangeTypeConfig(type).isRollback === true;
}

/**
 * 前端配置常量
 * 与服务端 server/config/constants.ts 保持一致
 */

// ======== 分页配置 ========
export const PAGINATION = {
  /** 默认每页条数 */
  DEFAULT_PAGE_SIZE: 100,
  /** 最大每页条数 */
  MAX_PAGE_SIZE: 500,
  /** 默认页码 */
  DEFAULT_PAGE: 1,
};

// ======== 撤销窗口配置（毫秒）=======
export const UNDO_WINDOW = {
  /** 出库单撤销窗口时间（毫秒） */
  OUTBOUND: 30 * 60 * 1000, // 30分钟
  /** 入库单撤销窗口时间（毫秒） */
  INBOUND: 30 * 60 * 1000, // 30分钟
};

// ======== 状态枚举 ========
export const ORDER_STATUS = {
  /** 出库单状态 */
  OUTBOUND: {
    PENDING_RECONCILIATION: 'pending_reconciliation',
    RECONCILED: 'reconciled',
    INVOICED: 'invoiced',
    PAID: 'paid',
    CANCELLED: 'cancelled',
  },
  /** 对账单状态 */
  RECONCILIATION: {
    DRAFT: 'draft',
    CONFIRMED: 'confirmed',
    AUDITED: 'audited',
    INVOICED: 'invoiced',
    PAID: 'paid',
  },
  /** 锁状态 */
  LOCK: {
    UNLOCKED: 'unlocked',
    LOCKED: 'locked',
  },
};

// ======== 库存变动类型 ========
export const INVENTORY_CHANGE_TYPE = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
  OUTBOUND_ROLLBACK: 'outbound_rollback',
  ADJUSTMENT: 'adjustment',
  MANUAL_INCREASE: 'manual_increase',
  MANUAL_DECREASE: 'manual_decrease',
};

// ======== 状态显示文本 ========
export const STATUS_TEXT: Record<string, string> = {
  // 出库单状态
  pending_reconciliation: '待对账',
  reconciled: '已关联对账',
  invoiced: '已开票',
  paid: '已付款',
  cancelled: '已取消',
  // 对账单状态
  draft: '草稿',
  confirmed: '已确认',
  audited: '已审核',
  // 锁状态
  unlocked: '未锁定',
  locked: '已锁定',
};

// ======== 库存变动类型显示文本 ========
export const INVENTORY_CHANGE_TYPE_TEXT: Record<string, string> = {
  inbound: '入库',
  outbound: '出库',
  outbound_rollback: '出库撤销',
  adjustment: '库存调整',
  manual_increase: '手动增加',
  manual_decrease: '手动减少',
};

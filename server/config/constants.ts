/**
 * 系统配置常量
 * 集中管理所有业务相关的配置参数
 */

// ======== 撤销窗口配置 ========
export const UNDO_WINDOW = {
  /** 出库单撤销窗口时间（毫秒） */
  OUTBOUND: 30 * 60 * 1000, // 30分钟
  /** 入库单撤销窗口时间（毫秒） */
  INBOUND: 30 * 60 * 1000, // 30分钟
};

// ======== 分页配置 ========
export const PAGINATION = {
  /** 默认每页条数 */
  DEFAULT_PAGE_SIZE: 100,
  /** 最大每页条数 */
  MAX_PAGE_SIZE: 500,
  /** 默认页码 */
  DEFAULT_PAGE: 1,
};

// ======== 乐观锁配置 ========
export const OPTIMISTIC_LOCK = {
  /** 最大重试次数 */
  MAX_RETRIES: 3,
  /** 基础重试延迟（毫秒） */
  BASE_DELAY_MS: 100,
};

// ======== 批次号配置 ========
export const BATCH_CONFIG = {
  /** UUID前缀长度 */
  UUID_PREFIX_LENGTH: 8,
  /** 批次号格式: ${customerCode}-${YYMMDD}-${UUID_PREFIX} */
};

// ======== 金额精度配置 ========
export const CURRENCY = {
  /** 元转分倍数 */
  CENTS_PER_YUAN: 100,
  /** 小数位数 */
  DECIMAL_PLACES: 2,
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

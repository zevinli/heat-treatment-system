/**
 * 撤销检查工具函数
 * 统一处理各类单据的撤销时限检查
 */

export const UNDO_TIME_WINDOW = 30 * 60 * 1000; // 30分钟（毫秒）

export interface IUndoCheckResult {
  canUndo: boolean;
  reason?: string;
  timeRemaining?: number; // 剩余时间（毫秒）
}

/**
 * 统一检查是否可撤销
 * @param createdAt 创建时间
 * @param hasApprovedUndo 是否有审批通过的撤销申请（默认为false）
 * @returns 撤销检查结果
 */
export function checkUndoable(
  createdAt: Date | string,
  hasApprovedUndo: boolean = false,
): IUndoCheckResult {
  const now = Date.now();
  const orderTime = new Date(createdAt).getTime();
  const elapsed = now - orderTime;
  const remaining = UNDO_TIME_WINDOW - elapsed;

  // 有审批通过的撤销申请，不受时间限制
  if (hasApprovedUndo) {
    return { canUndo: true, timeRemaining: Math.max(0, remaining) };
  }

  // 超过时限，不允许撤销
  if (remaining <= 0) {
    return {
      canUndo: false,
      reason: `已超过${UNDO_TIME_WINDOW / 60000}分钟撤销时限`,
      timeRemaining: 0,
    };
  }

  return {
    canUndo: true,
    timeRemaining: remaining,
  };
}

/**
 * 格式化剩余时间显示
 * @param ms 毫秒数
 * @returns 格式化后的时间字符串
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '已过期';

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}分${seconds}秒`;
  }
  return `${seconds}秒`;
}

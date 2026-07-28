/**
 * 金额转换工具
 * 冲突解决：#4(金额转分精度问题)
 */

/**
 * 将元转换为分（整数）
 * @param yuan 金额（元）
 * @returns 金额（分）
 */
export function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100);
}

/**
 * 将分转换为元（浮点数）
 * @param cents 金额（分）
 * @returns 金额（元）
 */
export function centsToYuan(cents: number): number {
  return cents / 100;
}

/**
 * 格式化金额为显示字符串
 * @param cents 金额（分）
 * @returns 格式化后的金额字符串
 */
export function formatCurrency(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

/**
 * 计算金额（根据数量和单价）
 * @param quantity 数量
 * @param unitPriceCents 单价（分）
 * @returns 金额（分）
 */
export function calculateAmount(quantity: number, unitPriceCents: number): number {
  return Math.round(quantity * unitPriceCents);
}

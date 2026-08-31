import { BadRequestException } from '@nestjs/common';

export function parseRangeStart(value: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    // JavaScript 会把 2026-02-30 自动滚动到三月，筛选接口不能静默接受这种日期。
    if (
      parsed.getUTCFullYear() !== year
      || parsed.getUTCMonth() !== month - 1
      || parsed.getUTCDate() !== day
    ) {
      throw new BadRequestException(`无效日期：${value}`);
    }
    return parsed;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new BadRequestException(`无效日期：${value}`);
  return parsed;
}

/**
 * Convert an inclusive UI end date into an exclusive database boundary.
 * A plain YYYY-MM-DD means the whole selected day, not only 00:00:00.
 */
export function parseRangeEndExclusive(value: string): Date {
  const parsed = parseRangeStart(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    parsed.setUTCDate(parsed.getUTCDate() + 1);
    return parsed;
  }
  // Timestamp inputs are treated as an inclusive instant.
  return new Date(parsed.getTime() + 1);
}

import { BadRequestException } from '@nestjs/common';

export function parseRangeStart(value: string): Date {
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

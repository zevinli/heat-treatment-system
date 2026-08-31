import { parseRangeEndExclusive, parseRangeStart } from '../../server/common/utils/date-range';

describe('date range boundaries', () => {
  test('plain end date includes the entire selected day', () => {
    expect(parseRangeEndExclusive('2026-08-10').toISOString()).toBe('2026-08-11T00:00:00.000Z');
  });

  test('timestamp end boundary remains inclusive by one millisecond', () => {
    expect(parseRangeEndExclusive('2026-08-10T12:30:00.000Z').toISOString())
      .toBe('2026-08-10T12:30:00.001Z');
  });

  test('invalid dates are rejected before reaching SQL', () => {
    expect(() => parseRangeStart('not-a-date')).toThrow('无效日期');
    expect(() => parseRangeStart('2026-02-30')).toThrow('无效日期');
    expect(() => parseRangeStart('2026-13-01')).toThrow('无效日期');
  });
});

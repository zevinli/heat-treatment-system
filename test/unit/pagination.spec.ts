import { parsePagination, parsePositiveInt } from '../../server/common/utils/pagination';

describe('pagination utilities', () => {
  const defaults = { page: 1, pageSize: 20, maxPageSize: 100 };

  test.each([undefined, '', 'abc', '0', '-3', 1.2])('invalid page %p falls back safely', value => {
    expect(parsePagination(value, value, defaults)).toEqual({ page: 1, pageSize: 20 });
  });

  test('oversized page size is capped while a valid page is preserved', () => {
    expect(parsePagination('3', '999999', defaults)).toEqual({ page: 3, pageSize: 100 });
  });

  test('generic positive integer parser applies its own cap', () => {
    expect(parsePositiveInt('500', 10, 50)).toBe(50);
  });
});

export function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

export function parsePagination(
  page: unknown,
  pageSize: unknown,
  defaults: { page: number; pageSize: number; maxPageSize: number },
) {
  return {
    page: parsePositiveInt(page, defaults.page, Number.MAX_SAFE_INTEGER),
    pageSize: parsePositiveInt(pageSize, defaults.pageSize, defaults.maxPageSize),
  };
}

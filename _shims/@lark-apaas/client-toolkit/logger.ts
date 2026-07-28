export const logger = {
  debug: (...args: unknown[]) => console.debug('[HeatFlow]', ...args),
  info: (...args: unknown[]) => console.info('[HeatFlow]', ...args),
  warn: (...args: unknown[]) => console.warn('[HeatFlow]', ...args),
  error: (...args: unknown[]) => console.error('[HeatFlow]', ...args),
  log: (...args: unknown[]) => console.log('[HeatFlow]', ...args),
};

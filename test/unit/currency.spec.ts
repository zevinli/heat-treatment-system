import { calculateAmount, centsToYuan, formatCurrency, yuanToCents } from '../../server/common/utils/currency';

describe('currency utilities', () => {
  it('converts decimal yuan without floating point residue', () => {
    expect(yuanToCents(397.01)).toBe(39701);
    expect(yuanToCents(0.1 + 0.2)).toBe(30);
    expect(centsToYuan(39701)).toBe(397.01);
  });

  it('formats and calculates amounts in cents', () => {
    expect(calculateAmount(40, 1000)).toBe(40000);
    expect(formatCurrency(40000)).toBe('¥400.00');
  });
});

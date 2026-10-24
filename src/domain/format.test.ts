import { formatDate, formatMoney, formatValue } from './format';

describe('format', () => {
  it('formats money from the decimal string without float rounding', () => {
    expect(formatMoney({ amount: '4415.30', currency: 'EUR' })).toBe('€4,415.30');
    expect(formatMoney({ amount: '0.10', currency: 'EUR' })).toBe('€0.10');
  });

  it('never shifts a calendar date, whatever the time zone', () => {
    const original = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
    expect(formatDate('2026-09-13')).toBe('13 Sept 2026');
    process.env.TZ = original;
  });

  it('shows times exactly as given and null as "Nothing found"', () => {
    expect(formatValue('23:40', 'time')).toBe('23:40');
    expect(formatValue(null, 'text')).toBe('Nothing found');
    expect(formatValue(false, 'boolean')).toBe('No');
  });
});

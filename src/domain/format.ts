import type { FieldValue, Money, ValueType } from './types';

const LOCALE = 'en-IE';

/** Intl formats the decimal string directly, so the amount never becomes a float. */
export function formatMoney(money: Money): string {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: money.currency }).format(
    money.amount as Intl.StringNumericLiteral,
  );
}

/**
 * "2026-09-13" is a calendar date with no time zone. new Date("2026-09-13")
 * would parse it as UTC midnight and show the 12th west of Greenwich, so we
 * build it in UTC and format it in UTC.
 */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(LOCALE, {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

/** Times are local to the incident: shown exactly as given, never converted. */
export function formatValue(value: FieldValue, valueType: ValueType): string {
  if (value === null) return 'Nothing found';
  if (valueType === 'money' && typeof value === 'object') return formatMoney(value);
  if (valueType === 'date' && typeof value === 'string') return formatDate(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return new Intl.NumberFormat(LOCALE).format(value);
  return String(value);
}

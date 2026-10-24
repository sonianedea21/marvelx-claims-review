import type { FieldValue, ValueType } from './types';

export type ValueResult = { ok: true; value: FieldValue } | { ok: false; message: string };

const MAX_TEXT_LENGTH = 5000;

/**
 * Validates a reviewer-supplied value against the field's value_type and
 * returns it normalised (money amounts always get two decimals, as strings).
 * Used by the edit inputs in the browser and by the decisions endpoint.
 */
export function validateValue(valueType: ValueType, input: unknown): ValueResult {
  switch (valueType) {
    case 'text':
    case 'long_text': {
      if (typeof input !== 'string') return fail('Enter some text.');
      const text = input.trim();
      if (text.length === 0) return fail('Enter some text.');
      if (text.length > MAX_TEXT_LENGTH) return fail(`Keep it under ${MAX_TEXT_LENGTH} characters.`);
      return { ok: true, value: text };
    }
    case 'money':
      return validateMoney(input);
    case 'date':
      return typeof input === 'string' && isCalendarDate(input)
        ? { ok: true, value: input }
        : fail('Enter a real date as YYYY-MM-DD.');
    case 'time':
      return typeof input === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(input)
        ? { ok: true, value: input }
        : fail('Enter a time as HH:MM, 24-hour.');
    case 'number':
      return typeof input === 'number' && Number.isFinite(input) ? { ok: true, value: input } : fail('Enter a number.');
    case 'boolean':
      return typeof input === 'boolean' ? { ok: true, value: input } : fail('Choose yes or no.');
  }
}

function validateMoney(input: unknown): ValueResult {
  if (typeof input !== 'object' || input === null) return fail('Enter an amount.');
  const { amount, currency } = input as Record<string, unknown>;
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return fail('Currency must be a 3-letter code.');
  if (typeof amount !== 'string' || !/^\d+(\.\d{1,2})?$/.test(amount.trim())) {
    return fail('Enter an amount like 1234.50, without a currency sign.');
  }
  return { ok: true, value: { amount: toTwoDecimals(amount.trim()), currency } };
}

/** "4415" → "4415.00", "4415.3" → "4415.30". String work only: no floats. */
function toTwoDecimals(amount: string): string {
  const [whole, fraction = ''] = amount.split('.');
  return `${whole}.${fraction.padEnd(2, '0')}`;
}

function isCalendarDate(text: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return false;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function fail(message: string): ValueResult {
  return { ok: false, message };
}

export function sameValue(a: FieldValue, b: FieldValue): boolean {
  if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object') {
    return a.amount === b.amount && a.currency === b.currency;
  }
  return a === b;
}

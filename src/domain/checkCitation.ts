import type { CitationCheck, FieldValue, ValueType } from './types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Does the value appear in the text it cites? A cheap, deterministic check that
 * catches values the agent misread with high confidence (004817 incident_time
 * "22:40" cites "23:40"). Only date, time, money and number are checked; text
 * is paraphrased too often to compare. When the cited text can't settle it,
 * the answer is 'not_checked', never a guess.
 */
export function checkCitation(value: FieldValue, valueType: ValueType, citedText: string | null): CitationCheck {
  if (value === null || citedText === null) return 'not_checked';

  switch (valueType) {
    case 'time':
      return typeof value === 'string' && citedText.includes(value) ? 'match' : 'mismatch';
    case 'date':
      return typeof value === 'string' ? checkDate(value, citedText) : 'not_checked';
    case 'money':
      return typeof value === 'object' ? checkMoney(value.amount, citedText) : 'not_checked';
    case 'number':
      return typeof value === 'number' ? checkNumber(value, citedText) : 'not_checked';
    default:
      return 'not_checked';
  }
}

function checkDate(isoDate: string, cited: string): CitationCheck {
  if (cited.includes(isoDate)) return 'match';
  const [year, month, day] = isoDate.split('-').map(Number);
  const dayMonth = `${day} ${MONTHS[(month ?? 0) - 1]}`;
  if (cited.includes(`${dayMonth} ${year}`)) return 'match';
  // "On Sunday 20 September at about 22:30": no year cited at all.
  if (cited.includes(dayMonth) && !/\b\d{4}\b/.test(cited)) return 'match';
  return 'mismatch';
}

function checkMoney(amount: string, cited: string): CitationCheck {
  const amounts = new Set(withoutThousandsSeparators(cited).match(/\d+\.\d{2}/g) ?? []);
  // A span listing several amounts may be a sum (parts_total cites three lines).
  if (amounts.size !== 1) return 'not_checked';
  return amounts.has(amount) ? 'match' : 'mismatch';
}

function checkNumber(value: number, cited: string): CitationCheck {
  const numbers = (withoutThousandsSeparators(cited).match(/\d+(\.\d+)?/g) ?? []).map(Number);
  if (numbers.length === 0) return 'not_checked';
  return numbers.includes(value) ? 'match' : 'mismatch';
}

function withoutThousandsSeparators(text: string): string {
  return text.replace(/(\d),(?=\d{3}\b)/g, '$1');
}

import { record } from '../../server/testFixtures';
import { buildClaimDetail } from './buildClaimDetail';
import { checkCitation } from './checkCitation';

describe('checkCitation', () => {
  it('flags 004817 incident_time: the AI says 22:40, the police report says 23:40', () => {
    expect(checkCitation('22:40', 'time', '23:40')).toBe('mismatch');
  });

  it('flags only that field across every fixture claim', () => {
    const mismatches = ['clm_4809', 'clm_4817', 'clm_4822', 'clm_4830'].flatMap((id) =>
      buildClaimDetail(record(id))
        .fields.filter((f) => f.citation_check === 'mismatch')
        .map((f) => `${id}:${f.field_id}`),
    );
    expect(mismatches).toEqual(['clm_4817:incident_time']);
  });

  it('matches written-out dates, with or without a year', () => {
    expect(checkCitation('2026-09-13', 'date', 'Date of incident: 13 September 2026')).toBe('match');
    expect(checkCitation('2026-09-20', 'date', 'On Sunday 20 September at about 22:30')).toBe('match');
    expect(checkCitation('2026-09-14', 'date', 'Date of incident: 13 September 2026')).toBe('mismatch');
  });

  it('reads money with thousands separators and skips spans that list several amounts', () => {
    expect(checkCitation({ amount: '4415.30', currency: 'EUR' }, 'money', 'Total incl. VAT: € 4,415.30')).toBe('match');
    expect(checkCitation({ amount: '989.00', currency: 'EUR' }, 'money', '€ 899.00')).toBe('mismatch');
    expect(checkCitation({ amount: '1252.00', currency: 'EUR' }, 'money', '€ 612.40 € 298.60 € 341.00')).toBe(
      'not_checked',
    );
  });

  it('does not check null values, missing citations or text', () => {
    expect(checkCitation(null, 'text', 'Policy number: not provided')).toBe('not_checked');
    expect(checkCitation({ amount: '4165.30', currency: 'EUR' }, 'money', null)).toBe('not_checked');
    expect(checkCitation('Third party at fault', 'text', 'something else')).toBe('not_checked');
  });
});

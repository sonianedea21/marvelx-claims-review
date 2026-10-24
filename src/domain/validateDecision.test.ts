import { record } from '../../server/testFixtures';
import { buildClaimDetail } from './buildClaimDetail';
import { bulkAcceptBlockers, validateDecision } from './validateDecision';
import { validateValue } from './validateValue';
import type { ClaimDetail } from './types';

function ctx(detail: ClaimDetail, fieldId: string) {
  return { claimStatus: detail.claim.status, field: detail.fields.find((f) => f.field_id === fieldId) };
}

const finished4817 = buildClaimDetail(record('clm_4817'));

describe('validateDecision', () => {
  it('accepts the value the reviewer was shown (happy path)', () => {
    const result = validateDecision(
      { field_id: 'policy_number', action: 'accept', agent_version: 1 },
      ctx(finished4817, 'policy_number'),
    );
    expect(result).toMatchObject({ ok: true, action: 'accept', value: 'MP-2024-118903', agent_version: 1 });
  });

  it('lets the reviewer act while the run is still going', () => {
    const running = buildClaimDetail(record('clm_4817', 30000));
    expect(running.claim.status).toBe('running');
    expect(validateDecision({ field_id: 'incident_date', action: 'accept', agent_version: 1 }, ctx(running, 'incident_date')).ok).toBe(true);
  });

  it('rejects a decision made against an older agent version with 409', () => {
    const result = validateDecision(
      { field_id: 'total_incl_vat', action: 'accept', agent_version: 1 },
      ctx(finished4817, 'total_incl_vat'),
    );
    expect(result).toMatchObject({ ok: false, status: 409, code: 'agent_value_changed' });
  });

  it('validates corrections by value type with 422', () => {
    const bad = validateDecision(
      { field_id: 'incident_time', action: 'correct', value: '25:99', agent_version: 1 },
      ctx(finished4817, 'incident_time'),
    );
    expect(bad).toMatchObject({ ok: false, status: 422, code: 'invalid_value' });

    const good = validateDecision(
      { field_id: 'incident_time', action: 'correct', value: '23:40', agent_version: 1 },
      ctx(finished4817, 'incident_time'),
    );
    expect(good).toMatchObject({ ok: true, action: 'correct', value: '23:40' });
  });

  it('keeps money corrections as decimal strings', () => {
    const result = validateDecision(
      { field_id: 'estimated_payable', action: 'correct', value: { amount: '4165.3', currency: 'EUR' }, agent_version: 1 },
      ctx(finished4817, 'estimated_payable'),
    );
    expect(result).toMatchObject({ ok: false, code: 'unchanged_value' });

    const changed = validateDecision(
      { field_id: 'estimated_payable', action: 'correct', value: { amount: '3915', currency: 'EUR' }, agent_version: 1 },
      ctx(finished4817, 'estimated_payable'),
    );
    expect(changed).toMatchObject({ ok: true, value: { amount: '3915.00', currency: 'EUR' } });
  });

  it('cannot correct a value the AI did not find, but can override it', () => {
    const c = ctx(finished4817, 'third_party_policy_number');
    expect(validateDecision({ field_id: 'third_party_policy_number', action: 'correct', value: 'X', agent_version: 1 }, c))
      .toMatchObject({ ok: false, status: 422, code: 'nothing_to_correct' });
    expect(validateDecision({ field_id: 'third_party_policy_number', action: 'override', value: 'NZ-1', agent_version: 1 }, c))
      .toMatchObject({ ok: true, action: 'override', value: 'NZ-1' });
  });

  it('allows confirming "nothing found" one field at a time', () => {
    expect(
      validateDecision({ field_id: 'witness_phone', action: 'accept', agent_version: 1 }, ctx(finished4817, 'witness_phone')),
    ).toMatchObject({ ok: true, value: null });
  });

  it('rejects malformed input with 400 and unknown fields with 404', () => {
    expect(validateDecision({ action: 'accept' }, ctx(finished4817, 'x'))).toMatchObject({ status: 400 });
    expect(validateDecision({ field_id: 'x', action: 'approve', agent_version: 1 }, ctx(finished4817, 'x'))).toMatchObject({ status: 400 });
    expect(validateDecision({ field_id: 'x', action: 'accept', agent_version: 1 }, ctx(finished4817, 'x'))).toMatchObject({ status: 404 });
  });
});

describe('validateValue', () => {
  it.each([
    ['date', '2026-02-30', false],
    ['date', '2026-09-13', true],
    ['time', '23:40', true],
    ['time', '9:40', false],
    ['number', 48213, true],
    ['number', '48213', false],
    ['boolean', false, true],
    ['text', '   ', false],
    ['money', { amount: '1,240.00', currency: 'EUR' }, false],
    ['money', { amount: '1240', currency: 'eur' }, false],
  ] as const)('%s %j → %s', (type, value, ok) => {
    expect(validateValue(type, value).ok).toBe(ok);
  });
});

describe('bulk accept rules (next ticket)', () => {
  const running4817 = buildClaimDetail(record('clm_4817', 30000));
  const done4830 = buildClaimDetail(record('clm_4830'));
  const failed4822 = buildClaimDetail(record('clm_4822'));
  const field = (d: ClaimDetail, id: string) => d.fields.find((f) => f.field_id === id)!;

  it('never accepts on running or failed claims', () => {
    expect(bulkAcceptBlockers(field(running4817, 'incident_date'), running4817.claim, 1)).toContain('claim_not_ready');
    expect(bulkAcceptBlockers(field(failed4822, 'repair_cost'), failed4822.claim, 1)).toContain('claim_not_ready');
  });

  it('never accepts a field whose agent value changed since it was shown', () => {
    expect(bulkAcceptBlockers(field(finished4817, 'total_incl_vat'), finished4817.claim, 1)).toContain('agent_value_changed');
  });

  it('never accepts null values or values without a citation', () => {
    expect(bulkAcceptBlockers(field(finished4817, 'witness_phone'), finished4817.claim, 1)).toContain('no_value');
    expect(bulkAcceptBlockers(field(finished4817, 'estimated_payable'), finished4817.claim, 1)).toContain('no_citation');
  });

  it('never accepts on claims flagged for suspicious instructions', () => {
    expect(bulkAcceptBlockers(field(finished4817, 'policy_number'), finished4817.claim, 1)).toEqual(['claim_flagged']);
  });

  it('never accepts a value that contradicts its citation, however confident', () => {
    expect(bulkAcceptBlockers(field(finished4817, 'incident_time'), finished4817.claim, 1)).toContain('citation_mismatch');
  });

  it('allows a clean, cited, high-confidence field on a finished, unflagged claim', () => {
    expect(bulkAcceptBlockers(field(done4830, 'frame_number'), done4830.claim, 1)).toEqual([]);
  });
});

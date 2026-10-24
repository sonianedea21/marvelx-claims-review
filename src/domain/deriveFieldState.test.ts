import { fixture, record, runState } from '../../server/testFixtures';
import { applyEvents } from './applyEvent';
import { buildClaimDetail } from './buildClaimDetail';
import { deriveFieldState, latestDecisions, sliceCitation } from './deriveFieldState';
import type { ReviewerDecision } from './types';

const docs = (id: string) => (docId: string) => fixture(id).documents.find((d) => d.document_id === docId)?.text;

function decision(overrides: Partial<ReviewerDecision>): ReviewerDecision {
  return {
    id: 'dec_1', claim_id: 'CLM-2026-004817', field_id: 'total_incl_vat', action: 'accept',
    value: null, agent_version: 1, agent_confidence: 0.88, at: '2026-10-24T10:00:00Z', reviewer: 'reviewer',
    ...overrides,
  };
}

describe('citations', () => {
  it('slices every fixture citation by UTF-16 offsets within its document', () => {
    for (const id of ['clm_4809', 'clm_4817', 'clm_4822', 'clm_4830']) {
      for (const field of buildClaimDetail(record(id)).fields) {
        if (field.agent.source) expect(field.cited_text, `${id}:${field.field_id}`).not.toBeNull();
      }
    }
  });

  it('reads the exact span the agent cited', () => {
    const run = runState('clm_4817');
    const field = deriveFieldState(run.fields.incident_location!, null, docs('clm_4817'));
    expect(field.cited_text).toBe('Wibautstraat at Ringdijk, 1093 Amsterdam');
  });

  it('still lands on the right text after emoji, where UTF-16, code points and bytes all differ', () => {
    const text = fixture('clm_9001').documents[0]!.text;
    const field = deriveFieldState(runState('clm_9001').fields.frame_number!, null, docs('clm_9001'));
    expect(field.cited_text).toBe('XY-12345');
    // Slicing by code points would land 3 characters early (three emoji are two UTF-16 units each).
    expect([...text].slice(79, 87).join('')).not.toBe('XY-12345');
  });

  it('returns null rather than a wrong slice for an out-of-range span', () => {
    expect(sliceCitation('short', { start: 2, end: 99 })).toBeNull();
  });
});

describe('deriveFieldState', () => {
  it('marks a decision outdated when the agent revises the value afterwards', () => {
    // The reviewer accepts the page-1 total at 50 s; the agent revises it at 53.8 s.
    const before = runState('clm_4817', 50000);
    const accepted = decision({ value: before.fields.total_incl_vat!.versions[0]!.value, agent_version: 1 });

    const after = runState('clm_4817');
    const field = deriveFieldState(after.fields.total_incl_vat!, accepted, docs('clm_4817'));

    expect(field.outdated).toBe(true);
    expect(field.status).toBe('accepted');
    expect(field.final_value).toEqual({ amount: '3605.80', currency: 'EUR' }); // never silently overwritten
    expect(field.agent.value).toEqual({ amount: '4415.30', currency: 'EUR' });
    expect(field.history.map((v) => v.reason)).toEqual([
      null,
      'Page 2 adds supplements of € 669.01 excl. VAT; the page 1 figure was an estimate.',
    ]);
    expect(field.attention).toContain('decision_outdated');
    expect(field.attention).toContain('revised_by_agent');
  });

  it('notes, but does not flag as outdated, a confidence-only change after a decision', () => {
    // incident_location: 0.72 at extraction, raised to 0.93 at 64 s.
    const accepted = decision({ field_id: 'incident_location', agent_version: 1, agent_confidence: 0.72 });
    const field = deriveFieldState(runState('clm_4817').fields.incident_location!, accepted, docs('clm_4817'));
    expect(field.outdated).toBe(false);
    expect(field.confidence_changed_since_decision).toBe(true);
    expect(field.attention).not.toContain('decision_outdated');
  });

  it('tells "found nothing" (null) apart from "not extracted yet" (absent)', () => {
    const early = runState('clm_4817', 10000);
    expect(early.fields.third_party_policy_number).toBeUndefined();

    const field = deriveFieldState(runState('clm_4817').fields.third_party_policy_number!, null, docs('clm_4817'));
    expect(field.agent.value).toBeNull();
    expect(field.cited_text).toBe('Policy number: not provided');
    expect(field.attention).toEqual(['low_confidence', 'no_value']);
  });

  it('flags a value with no citation', () => {
    const field = deriveFieldState(runState('clm_4817').fields.estimated_payable!, null, docs('clm_4817'));
    expect(field.agent.source).toBeNull();
    expect(field.cited_text).toBeNull();
    expect(field.attention).toEqual(['low_confidence', 'no_citation']);
  });

  it('keeps the latest of several decisions on a field', () => {
    const latest = latestDecisions([
      decision({ id: 'dec_1', action: 'accept' }),
      decision({ id: 'dec_2', action: 'override', value: { amount: '4000.00', currency: 'EUR' } }),
    ]);
    expect(latest.get('total_incl_vat')!.id).toBe('dec_2');
  });

  it('distinguishes correct from override in the field status', () => {
    const run = applyEvents(runState('clm_4817'), []);
    const corrected = deriveFieldState(run.fields.incident_time!, decision({ field_id: 'incident_time', action: 'correct', value: '23:40', agent_version: 1 }), docs('clm_4817'));
    const overridden = deriveFieldState(run.fields.incident_time!, decision({ field_id: 'incident_time', action: 'override', value: '23:40', agent_version: 1 }), docs('clm_4817'));
    expect(corrected.status).toBe('corrected');
    expect(overridden.status).toBe('overridden');
  });
});

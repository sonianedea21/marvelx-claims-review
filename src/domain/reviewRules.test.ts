import { deliveredEvents, fixture, record, runState } from '../../server/testFixtures';
import { applyEvents, emptyRunState } from './applyEvent';
import { buildClaimDetail } from './buildClaimDetail';
import { confidenceChanges } from './confidence';
import { deriveFieldState } from './deriveFieldState';
import { missingChecks } from './missingChecks';
import { needsALook } from './needsALook';
import type { ClaimDetail, ReviewerDecision } from './types';

const field = (detail: ClaimDetail, id: string) => detail.fields.find((f) => f.field_id === id)!;

function decision(overrides: Partial<ReviewerDecision>): ReviewerDecision {
  return {
    id: 'dec_1', claim_id: 'CLM-2026-004817', field_id: 'x', action: 'accept', value: null,
    agent_run: 1, agent_version: 1, agent_value: null, agent_confidence: 0.9,
    at: '2026-10-24T10:00:00.000Z', reviewer: 'reviewer',
    ...overrides,
  };
}

describe('needs a look stays put when the AI grows surer', () => {
  it('keeps 004817 incident_location in "Needs a look" after its confidence rises from 72% to 93%', () => {
    const before = field(buildClaimDetail(record('clm_4817', 60000)), 'incident_location');
    const after = field(buildClaimDetail(record('clm_4817')), 'incident_location');
    expect(after.agent.confidence).toBe(0.93);
    expect(needsALook(before)).toBe(true);
    expect(needsALook(after)).toBe(true);
  });

  it('shows the confidence change with its reason, and a held change after the extraction it waited for', () => {
    expect(confidenceChanges(field(buildClaimDetail(record('clm_4817')), 'incident_location'))).toEqual([
      { from: 0.72, to: 0.93, reason: 'Claimant statement names the same junction.' },
    ]);
    // 009001 delivers the change (seq 4) before the field (seq 5); it applies on top of the extraction.
    expect(confidenceChanges(field(buildClaimDetail(record('clm_9001')), 'bike_value'))).toEqual([
      { from: 0.6, to: 0.8, reason: 'Delivered before the field it refers to.' },
    ]);
  });
});

describe('a value the AI worked out from fields the reviewer changed (004817 estimated_payable)', () => {
  const correctTotal = decision({
    id: 'dec_2', field_id: 'total_incl_vat', action: 'correct', value: { amount: '3900.00', currency: 'EUR' },
    agent_version: 2, agent_value: { amount: '4415.30', currency: 'EUR' }, at: '2026-10-24T10:05:00.000Z',
  });
  const acceptPayable = decision({
    id: 'dec_1', field_id: 'estimated_payable', action: 'accept', value: { amount: '4165.30', currency: 'EUR' },
    agent_value: { amount: '4165.30', currency: 'EUR' }, at: '2026-10-24T10:00:00.000Z',
  });
  const withDecisions = (decisions: ReviewerDecision[]) => buildClaimDetail({ ...record('clm_4817'), decisions });

  it('is not flagged while the inputs stand as the AI read them', () => {
    expect(field(withDecisions([acceptPayable]), 'estimated_payable').changed_inputs).toEqual([]);
  });

  it('is flagged once the reviewer corrects an input', () => {
    const payable = field(withDecisions([correctTotal]), 'estimated_payable');
    expect(payable.changed_inputs).toEqual(['Total incl. VAT']);
    expect(payable.attention).toContain('inputs_changed');
  });

  it('reopens and blocks completion when it was decided before the input changed', () => {
    const detail = withDecisions([acceptPayable, correctTotal]);
    expect(field(detail, 'estimated_payable').inputs_changed_since_decision).toBe(true);
    expect(detail.review.blockers).toContain('derived_inputs_changed');
  });

  it('settles once the reviewer decides it again after the change', () => {
    const again = { ...acceptPayable, id: 'dec_3', at: '2026-10-24T10:06:00.000Z' };
    const detail = withDecisions([acceptPayable, correctTotal, again]);
    expect(field(detail, 'estimated_payable').inputs_changed_since_decision).toBe(false);
    expect(detail.review.blockers).not.toContain('derived_inputs_changed');
  });
});

describe('"finished" is not "complete"', () => {
  it('reports that 004830 never looked up the policy', () => {
    expect(missingChecks(runState('clm_4830'))).toEqual([{ step_id: 'lookup_policy', what: 'the policy' }]);
    expect(buildClaimDetail(record('clm_4830')).claim.missing_checks).toHaveLength(1);
  });

  it('reports nothing for a run that did look it up, one still running, or one that failed', () => {
    expect(missingChecks(runState('clm_4817'))).toEqual([]);
    expect(missingChecks(runState('clm_4830', 5000))).toEqual([]);
    expect(missingChecks(runState('clm_4822'))).toEqual([]);
  });
});

describe('decisions across runs of the AI', () => {
  // "Run the AI again" on 004822: run 2 starts its versions at 1 again.
  const run2 = applyEvents(emptyRunState(2), deliveredEvents('clm_4822'));
  const docs = (docId: string) => fixture('clm_4822').documents.find((d) => d.document_id === docId)?.text;
  const repairCost = { amount: '685.00', currency: 'EUR' };

  it('stamps every version with the run that produced it', () => {
    expect(run2.fields.repair_cost!.versions[0]).toMatchObject({ run: 2, version: 1 });
  });

  it('keeps a decision from run 1 when run 2 says the same thing', () => {
    const accepted = decision({ field_id: 'repair_cost', value: repairCost, agent_value: repairCost });
    expect(deriveFieldState(run2.fields.repair_cost!, accepted, docs).outdated).toBe(false);
  });

  it('marks a decision from run 1 outdated when run 2 says something else, even at the same version number', () => {
    const seen = { amount: '600.00', currency: 'EUR' };
    const accepted = decision({ field_id: 'repair_cost', value: seen, agent_value: seen });
    expect(deriveFieldState(run2.fields.repair_cost!, accepted, docs).outdated).toBe(true);
  });
});

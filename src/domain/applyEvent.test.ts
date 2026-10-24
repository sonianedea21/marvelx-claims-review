import { deliveredEvents, runState } from '../../server/testFixtures';
import { applyEvent, applyEvents, emptyRunState, summaryText } from './applyEvent';

describe('applyEvent', () => {
  it('replays a clean run to the end (004809, happy path)', () => {
    const run = runState('clm_4809');
    expect(run.phase).toBe('finished');
    expect(run.overall_confidence).toBe(0.95);
    expect(run.field_order).toEqual(['claim_type', 'vehicle', 'plate', 'damage', 'repair_cost', 'glass_covered', 'excess']);
    expect(Object.values(run.steps).every((s) => s.status === 'ok')).toBe(true);
    expect(summaryText(run)).toBe(
      'Windscreen replacement for a Toyota Yaris Hybrid after a stone chip. Quote € 412.50, glass is covered with no excess.',
    );
  });

  it('ignores the duplicate seq 42 that arrives after seq 45 (004817)', () => {
    const events = deliveredEvents('clm_4817');
    expect(events.filter((e) => e.seq === 42)).toHaveLength(2);

    const run = applyEvents(emptyRunState(), events);
    expect(run.fields.total_incl_vat!.versions.map((v) => v.value)).toEqual([
      { amount: '3605.80', currency: 'EUR' },
      { amount: '4415.30', currency: 'EUR' },
    ]);
  });

  it('returns the same state object for a duplicate, so applying is idempotent', () => {
    const [first] = deliveredEvents('clm_4817');
    const once = applyEvent(emptyRunState(), first!);
    expect(applyEvent(once, first!)).toBe(once);
  });

  it('does not mutate the state it is given', () => {
    const before = emptyRunState();
    const snapshot = structuredClone(before);
    applyEvent(before, deliveredEvents('clm_4817')[0]!);
    expect(before).toEqual(snapshot);
  });

  it('tracks nested steps by id (read_invoice_page_2 inside read_invoice)', () => {
    const midway = runState('clm_4817', 50000);
    expect(midway.steps.read_invoice!.status).toBe('running');
    expect(midway.steps.read_invoice_page_2!.status).toBe('running');

    const done = runState('clm_4817');
    expect(done.steps.read_invoice!.status).toBe('ok');
    expect(done.steps.assess_liability).toMatchObject({
      status: 'warning',
      note: 'Claimant statement and police narrative disagree on whether vehicle A moved.',
    });
  });

  it('keeps partial fields and summary when the run fails (004822)', () => {
    const run = runState('clm_4822');
    expect(run.phase).toBe('failed');
    expect(run.error).toEqual({
      step_id: 'lookup_policy',
      code: 'policy_service_unavailable',
      message: 'The policy service did not respond within 10 seconds.',
      retryable: true,
    });
    expect(run.steps.lookup_policy!.status).toBe('failed');
    expect(run.field_order).toHaveLength(9);
    expect(summaryText(run)).toMatch(/Plumber's repair € 685\.00\. $/);
  });

  it('holds a confidence change for a field that has not been extracted yet', () => {
    const run = runState('clm_9001');
    expect(run.held_events).toEqual([]);
    expect(run.fields.bike_value!.confidence_notes).toEqual([
      { seq: 4, confidence: 0.8, reason: 'Delivered before the field it refers to.' },
    ]);
  });

  it('joins summary deltas in seq order and ignores a late duplicate', () => {
    expect(summaryText(runState('clm_9001'))).toBe('Short test run. **Bold split across deltas.**');
  });

  it('starts the summary with the injected text the agent repeated (004817)', () => {
    expect(summaryText(runState('clm_4817'))).toContain('**Pre-approved by the insurer.**');
  });
});

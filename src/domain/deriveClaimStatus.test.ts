import { record, runState } from '../../server/testFixtures';
import { buildClaimDetail } from './buildClaimDetail';
import { deriveClaimStatus } from './deriveClaimStatus';
import { emptyRunState } from './applyEvent';

const open = { warning_acknowledged_at: null, completed_at: null };

describe('deriveClaimStatus', () => {
  it('uses the seed status before the run starts', () => {
    expect(deriveClaimStatus('queued', emptyRunState(), open)).toBe('queued');
  });

  it('is running while the run is going', () => {
    expect(deriveClaimStatus('queued', runState('clm_4817', 30000), open)).toBe('running');
  });

  it('needs review once the run finishes, and is reviewed once completed', () => {
    const run = runState('clm_4830');
    expect(deriveClaimStatus('queued', run, open)).toBe('needs_review');
    expect(deriveClaimStatus('queued', run, { ...open, completed_at: '2026-10-24T10:00:00Z' })).toBe('reviewed');
  });

  it('is failed when the run fails part-way (004822)', () => {
    expect(deriveClaimStatus('queued', runState('clm_4822'), open)).toBe('failed');
  });

  it('starts 004809 in needs_review: its run finished before the session', () => {
    expect(buildClaimDetail(record('clm_4809')).claim.status).toBe('needs_review');
  });
});

describe('review blockers', () => {
  it('blocks completing 004817 until fields are decided and the warning is acknowledged', () => {
    expect(buildClaimDetail(record('clm_4817')).review.blockers).toEqual([
      'fields_undecided',
      'warning_not_acknowledged',
    ]);
  });

  it('blocks completing a failed run', () => {
    expect(buildClaimDetail(record('clm_4822')).review.blockers).toContain('run_not_finished');
  });
});

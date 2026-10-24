import type { ClaimStatus, FieldState, ReviewBlocker, ReviewState, RunState, SuspiciousInstruction } from './types';

/**
 * The one place a claim's status is decided.
 * 1. The run failed                     → failed
 * 2. The run hasn't started              → the seed's initial_status (queued)
 * 3. The run is going                    → running
 * 4. The run finished, review completed  → reviewed
 * 5. The run finished                    → needs_review
 */
export function deriveClaimStatus(initialStatus: ClaimStatus, run: RunState, review: ReviewState): ClaimStatus {
  if (run.phase === 'failed') return 'failed';
  if (run.phase === 'not_started') return initialStatus;
  if (run.phase === 'running') return 'running';
  return review.completed_at ? 'reviewed' : 'needs_review';
}

/** Why "Complete review" is not allowed yet. Empty means it is. */
export function reviewBlockers(
  run: RunState,
  fields: FieldState[],
  suspicious: SuspiciousInstruction[],
  review: ReviewState,
): ReviewBlocker[] {
  const blockers: ReviewBlocker[] = [];
  if (run.phase !== 'finished') blockers.push('run_not_finished');
  if (fields.length === 0 || fields.some((f) => f.status === 'pending')) blockers.push('fields_undecided');
  if (fields.some((f) => f.outdated)) blockers.push('decisions_outdated');
  if (suspicious.length > 0 && !review.warning_acknowledged_at) blockers.push('warning_not_acknowledged');
  return blockers;
}

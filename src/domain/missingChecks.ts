import type { MissingCheck, RunState } from './types';

/**
 * Steps a run must complete before its fields can be taken as the whole picture.
 * "Finished" only means the AI stopped without an error: 004830 finishes without
 * ever looking up the policy. Add steps here as the agent team defines them.
 */
export const REQUIRED_STEPS: MissingCheck[] = [{ step_id: 'lookup_policy', what: 'the policy' }];

/** Required steps a finished run never completed. Empty while running (not known yet) and on failure (the failure says so). */
export function missingChecks(run: RunState): MissingCheck[] {
  if (run.phase !== 'finished') return [];
  return REQUIRED_STEPS.filter(({ step_id }) => {
    const step = run.steps[step_id];
    return !step || step.status === 'running' || step.status === 'failed';
  });
}

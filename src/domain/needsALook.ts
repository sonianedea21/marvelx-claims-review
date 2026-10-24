import { HIGH_CONFIDENCE } from './confidence';
import type { FieldState } from './types';

/**
 * Whether a field belongs in "Needs a look". It depends only on what the AI said,
 * never on the reviewer's decision, so fields don't move when the reviewer acts:
 * anything flagged, or anything the AI is less than "likely right" about.
 * Used by the queue count and the review screen, so they always agree.
 */
export function needsALook(field: FieldState): boolean {
  return field.attention.some((r) => r !== 'decision_outdated') || field.agent.confidence < HIGH_CONFIDENCE;
}

/** Still waiting for the reviewer: undecided, or decided against a value the AI has since changed. */
export function isOpen(field: FieldState): boolean {
  return field.status === 'pending' || field.outdated;
}

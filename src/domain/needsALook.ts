import { HIGH_CONFIDENCE } from './confidence';
import type { AttentionReason, FieldState } from './types';

/** Reasons the reviewer caused. They never move a field between sections. */
const REVIEWER_CAUSED: AttentionReason[] = ['decision_outdated', 'inputs_changed'];

/**
 * Whether a field belongs in "Needs a look". It depends only on what the AI said,
 * never on the reviewer's decision, so fields don't move when the reviewer acts.
 * It uses the lowest confidence the AI ever gave the field, so a field never leaves
 * "Needs a look" when the AI grows surer (004817 incident_location: 72% → 93%):
 * moving it would pull it out from under a reviewer who is editing it.
 * Used by the queue count and the review screen, so they always agree.
 */
export function needsALook(field: FieldState): boolean {
  return (
    field.attention.some((r) => !REVIEWER_CAUSED.includes(r)) || lowestConfidence(field) < HIGH_CONFIDENCE
  );
}

/** The lowest confidence the AI gave this field at any point in the run. */
export function lowestConfidence(field: FieldState): number {
  return Math.min(
    field.agent.confidence,
    ...field.history.map((v) => v.confidence),
    ...field.confidence_notes.map((n) => n.confidence),
  );
}

/** Still waiting for the reviewer: undecided, or decided against values that have since changed. */
export function isOpen(field: FieldState): boolean {
  return field.status === 'pending' || field.outdated || field.inputs_changed_since_decision;
}

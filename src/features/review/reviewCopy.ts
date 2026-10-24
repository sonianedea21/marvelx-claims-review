import type { AttentionReason, DecisionAction, FieldState, ReviewBlocker } from '../../domain/types';
import type { IconName } from '../../ui';
import { confidenceCopy } from '../shared/confidenceCopy';

/** Why a field needs a look, in plain words. Order matches how serious it is. */
export const ATTENTION_COPY: Record<AttentionReason, { label: string; icon: IconName; tone: 'attention' | 'danger' }> = {
  decision_outdated: { label: 'AI changed this after you decided', icon: 'history', tone: 'attention' },
  citation_mismatch: { label: "Doesn't match the source", icon: 'x_circle', tone: 'danger' },
  low_confidence: { label: 'AI is unsure', icon: 'eye', tone: 'attention' },
  revised_by_agent: { label: 'AI changed this', icon: 'history', tone: 'attention' },
  no_citation: { label: 'No source: the AI worked this out itself', icon: 'link_off', tone: 'attention' },
  no_value: { label: 'AI found nothing', icon: 'search_off', tone: 'attention' },
};

export const DECISION_COPY: Record<DecisionAction, { done: string; icon: IconName }> = {
  accept: { done: 'You accepted this', icon: 'check' },
  correct: { done: 'You corrected this', icon: 'pencil' },
  override: { done: 'You overrode this', icon: 'swap' },
};

export function blockerCopy(blocker: ReviewBlocker, counts: { undecided: number; outdated: number }, failed: boolean) {
  switch (blocker) {
    case 'run_not_finished':
      return failed ? 'The AI run stopped part-way, so this review cannot be completed yet' : 'Wait for the AI to finish';
    case 'fields_undecided':
      return `Decide the remaining ${counts.undecided} ${counts.undecided === 1 ? 'field' : 'fields'}`;
    case 'decisions_outdated':
      return `Re-check ${counts.outdated} ${counts.outdated === 1 ? 'field' : 'fields'} the AI changed after you decided`;
    case 'warning_not_acknowledged':
      return 'Read the suspicious-instruction warning';
  }
}

/** The trust label for a field: a source mismatch outranks any confidence score. */
export function fieldTrust(field: FieldState) {
  if (field.citation_check === 'mismatch') {
    return { label: "Doesn't match the source", detail: `AI said ${Math.round(field.agent.confidence * 100)}% sure`, tone: 'danger' as const };
  }
  const c = confidenceCopy(field.agent.confidence);
  const tone = c.band === 'likely' ? ('neutral' as const) : c.band === 'check' ? ('attention' as const) : ('danger' as const);
  return { label: c.label, detail: c.percent, tone };
}

/** A field needs the reviewer's attention if anything is flagged and it isn't settled yet. */
export function needsAttention(field: FieldState): boolean {
  if (field.outdated) return true;
  return field.status === 'pending' && (field.attention.length > 0 || field.agent.confidence < 0.9);
}

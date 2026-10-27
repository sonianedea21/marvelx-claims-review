import type { FieldState } from './types';

/** Below this the reviewer is told the AI is unsure. Also used for the low_confidence attention reason. */
export const LOW_CONFIDENCE = 0.7;
/** At or above this the reviewer is told the value is likely right. */
export const HIGH_CONFIDENCE = 0.9;

export type ConfidenceBand = 'likely' | 'check' | 'unsure';

export type ConfidenceChange = { from: number; to: number; reason: string };

/**
 * The AI's confidence changes that came without a new value (confidence_changed),
 * oldest first, each with the confidence it replaced. A change held until its field
 * was extracted counts as coming straight after the extraction.
 */
export function confidenceChanges(field: Pick<FieldState, 'history' | 'confidence_notes'>): ConfidenceChange[] {
  const extractedAt = field.history[0]?.seq ?? 0;
  // Versions first, so a held note sorts after the extraction it was waiting for (the sort is stable).
  const steps = [
    ...field.history.map((v) => ({ seq: v.seq, confidence: v.confidence, reason: null as string | null })),
    ...field.confidence_notes.map((n) => ({ seq: Math.max(n.seq, extractedAt), confidence: n.confidence, reason: n.reason })),
  ].sort((a, b) => a.seq - b.seq);

  const changes: ConfidenceChange[] = [];
  let current: number | null = null;
  for (const step of steps) {
    if (step.reason !== null && current !== null) changes.push({ from: current, to: step.confidence, reason: step.reason });
    current = step.confidence;
  }
  return changes;
}

export function confidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= HIGH_CONFIDENCE) return 'likely';
  if (confidence >= LOW_CONFIDENCE) return 'check';
  return 'unsure';
}

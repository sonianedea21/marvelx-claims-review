/** Below this the reviewer is told the AI is unsure. Also used for the low_confidence attention reason. */
export const LOW_CONFIDENCE = 0.7;
/** At or above this the reviewer is told the value is likely right. */
export const HIGH_CONFIDENCE = 0.9;

export type ConfidenceBand = 'likely' | 'check' | 'unsure';

export function confidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= HIGH_CONFIDENCE) return 'likely';
  if (confidence >= LOW_CONFIDENCE) return 'check';
  return 'unsure';
}

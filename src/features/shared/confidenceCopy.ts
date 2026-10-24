import { confidenceBand, type ConfidenceBand } from '../../domain/confidence';
import type { BadgeTone } from '../../ui';

const COPY: Record<ConfidenceBand, { label: string; tone: BadgeTone }> = {
  likely: { label: 'Likely right', tone: 'neutral' },
  check: { label: 'Check this', tone: 'attention' },
  unsure: { label: 'AI is unsure', tone: 'danger' },
};

/** Confidence in words a reviewer can act on, with the percentage as secondary text. */
export function confidenceCopy(confidence: number) {
  const band = confidenceBand(confidence);
  return { band, ...COPY[band], percent: `${Math.round(confidence * 100)}%` };
}

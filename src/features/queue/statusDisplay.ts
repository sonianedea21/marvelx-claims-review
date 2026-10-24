import type { ClaimStatus } from '../../domain/types';
import type { BadgeTone, IconName } from '../../ui';

/** How each claim status reads to a reviewer. */
export const STATUS_DISPLAY: Record<ClaimStatus, { label: string; tone: BadgeTone; icon: IconName }> = {
  queued: { label: 'Waiting for AI', tone: 'neutral', icon: 'history' },
  running: { label: 'AI is working', tone: 'ai', icon: 'sparkle' },
  needs_review: { label: 'Ready for review', tone: 'info', icon: 'user' },
  reviewed: { label: 'Reviewed', tone: 'success', icon: 'check' },
  failed: { label: 'AI run failed', tone: 'danger', icon: 'alert' },
};

export const PRIORITY_LABEL = { high: 'High priority', normal: 'Normal priority', low: 'Low priority' } as const;

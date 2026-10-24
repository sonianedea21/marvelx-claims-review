import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon, type IconName } from './Icon';

export type BadgeTone = 'neutral' | 'ai' | 'human' | 'attention' | 'danger' | 'success' | 'info';

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-sunken text-ink-muted',
  ai: 'bg-ai-tint text-ai-strong',
  human: 'bg-human-tint text-human',
  attention: 'bg-attention-tint text-attention',
  danger: 'bg-danger-tint text-danger',
  success: 'bg-success-tint text-success',
  info: 'bg-info-tint text-info',
};

type BadgeProps = {
  tone?: BadgeTone;
  icon?: IconName;
  /** solid: filled with the tone colour, for the one thing that must stand out. */
  emphasis?: 'soft' | 'solid';
  className?: string;
  children: ReactNode;
};

const SOLID: Record<BadgeTone, string> = {
  neutral: 'bg-ink text-ink-inverse',
  ai: 'bg-ai text-ink-inverse',
  human: 'bg-human text-ink-inverse',
  attention: 'bg-attention text-ink-inverse',
  danger: 'bg-danger text-ink-inverse',
  success: 'bg-success text-ink-inverse',
  info: 'bg-info text-ink-inverse',
};

export function Badge({ tone = 'neutral', icon, emphasis = 'soft', className, children }: BadgeProps) {
  return (
    <span
      className={cx(
        // Square tags, not pills: status should never look like a button you can press.
        'inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        emphasis === 'solid' ? SOLID[tone] : TONE[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} size="sm" />}
      {children}
    </span>
  );
}

import type { ReactNode } from 'react';
import { cx } from './cx';

type LiveIndicatorProps = { children: ReactNode; tone?: 'ai' | 'neutral'; className?: string };

/** A pulsing dot with text: "something is still happening". The text carries the meaning. */
export function LiveIndicator({ children, tone = 'ai', className }: LiveIndicatorProps) {
  return (
    <span className={cx('inline-flex items-center gap-2 text-sm', className)}>
      <span
        className={cx('size-2 shrink-0 animate-pulse-dot rounded-full', tone === 'ai' ? 'bg-ai' : 'bg-ink-subtle')}
        aria-hidden
      />
      <span>{children}</span>
    </span>
  );
}

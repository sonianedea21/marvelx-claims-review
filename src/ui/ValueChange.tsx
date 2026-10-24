import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

type ValueChangeProps = {
  from: string;
  to: string;
  /** Who made the change, e.g. "AI changed this". */
  byline: ReactNode;
  reason?: string | null;
  tone?: 'ai' | 'human';
  className?: string;
};

/** Old value struck through → new value, with who changed it and why. */
export function ValueChange({ from, to, byline, reason, tone = 'ai', className }: ValueChangeProps) {
  return (
    <div className={cx('space-y-1 rounded-md border-l-4 bg-surface py-1 pl-3 text-sm', tone === 'ai' ? 'border-ai' : 'border-human', className)}>
      <p className={cx('flex items-center gap-1 text-xs font-medium', tone === 'ai' ? 'text-ai-strong' : 'text-human')}>
        <Icon name={tone === 'ai' ? 'sparkle' : 'user'} size="sm" />
        {byline}
      </p>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-ink-subtle line-through">
          <span className="sr-only">Was </span>
          {from}
        </span>
        <Icon name="chevron_right" size="sm" className="self-center text-ink-subtle" />
        <span className="font-medium text-ink">
          <span className="sr-only">now </span>
          {to}
        </span>
      </p>
      {reason && <p className="text-ink-muted">“{reason}”</p>}
    </div>
  );
}

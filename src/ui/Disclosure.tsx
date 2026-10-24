import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

type DisclosureProps = { summary: ReactNode; children: ReactNode; defaultOpen?: boolean; className?: string };

/** Native <details>: keyboard and screen-reader support for free. */
export function Disclosure({ summary, children, defaultOpen = false, className }: DisclosureProps) {
  return (
    <details open={defaultOpen} className={cx('group rounded-lg border border-line bg-surface', className)}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 py-2 font-medium focus-visible:focus-ring">
        <Icon name="chevron_right" size="sm" className="transition-transform duration-150 group-open:rotate-90" />
        {summary}
      </summary>
      <div className="border-t border-line px-4 py-3">{children}</div>
    </details>
  );
}

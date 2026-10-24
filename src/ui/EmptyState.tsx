import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type EmptyStateProps = { icon?: IconName; title: string; children?: ReactNode; action?: ReactNode };

export function EmptyState({ icon = 'search_off', title, children, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong px-6 py-10 text-center">
      <Icon name={icon} className="text-ink-subtle" />
      <p className="font-medium">{title}</p>
      {children && <p className="max-w-reading text-sm text-ink-muted">{children}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon, type IconName } from './Icon';

type DecisionStampProps = {
  /** e.g. "You accepted this", "You corrected this". */
  title: string;
  icon: IconName;
  detail?: ReactNode;
  /** The AI changed the value after this decision: the stamp turns into a warning. */
  stale?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/** The reviewer's own decision, in their colour (teal). A stale decision says so and offers what to do. */
export function DecisionStamp({ title, icon, detail, stale, actions, className }: DecisionStampProps) {
  return (
    <div
      className={cx(
        'space-y-2 rounded-md border-l-4 p-3 text-sm',
        stale ? 'border-attention bg-attention-tint' : 'border-human bg-human-tint',
        className,
      )}
    >
      <p className={cx('flex items-center gap-1.5 font-medium', stale ? 'text-attention' : 'text-human')}>
        <Icon name={stale ? 'history' : icon} size="sm" />
        {stale ? `${title}, but the AI changed it since` : title}
      </p>
      {detail && <div className="text-ink">{detail}</div>}
      {stale && <div className="text-ink">{stale}</div>}
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

import { formatValue } from '../../domain/format';
import type { FieldState } from '../../domain/types';
import { cx, Icon } from '../../ui';
import { DECISION_COPY } from './reviewCopy';

type Props = { field: FieldState; locked: boolean; onChange: () => void; boxed?: boolean };

/** A decided field in one line: label, the value that stands, who decided, and a way back in. */
export function DecidedRow({ field, locked, onChange, boxed = false }: Props) {
  const decision = field.decision!;
  const copy = DECISION_COPY[decision.action];
  return (
    <li className={cx('flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5', boxed && 'rounded-lg border border-line bg-surface px-4')}>
      <button
        type="button"
        onClick={onChange}
        disabled={locked}
        aria-label={locked ? undefined : `${field.label}: ${copy.done.toLowerCase()}. Open to change your decision`}
        className="-mx-2 min-w-0 flex-1 rounded-md px-2 py-1 text-left enabled:hover:bg-paper focus-visible:focus-ring"
      >
        <span className="block text-sm text-ink-muted">{field.label}</span>
        <span className="flex flex-wrap items-baseline justify-between gap-x-4">
          <span className="font-medium break-words">{formatValue(decision.value, field.value_type)}</span>
          <span className="flex items-center gap-1 text-sm font-medium text-human">
            <Icon name={copy.icon} size="sm" />
            {copy.done.replace(' this', '')}
          </span>
        </span>
      </button>
      {field.confidence_changed_since_decision && (
        <p className="w-full text-xs text-ink-subtle">The AI's confidence changed since; the value is the same.</p>
      )}
    </li>
  );
}

import { cx } from './cx';
import { Icon } from './Icon';

export type StepItem = {
  id: string;
  label: string;
  status: 'running' | 'done' | 'warning' | 'failed';
  note?: string | null;
};

const STATUS = {
  running: { word: 'In progress', className: 'text-ai-strong' },
  done: { word: 'Done', className: 'text-ink-subtle' },
  warning: { word: 'Done with a warning', className: 'text-attention' },
  failed: { word: 'Failed', className: 'text-danger' },
};

/** What the AI did, step by step. Each status is a word as well as an icon. */
export function StepList({ steps }: { steps: StepItem[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((step) => {
        const s = STATUS[step.status];
        return (
          <li key={step.id} className="flex gap-3 text-sm">
            <span className={cx('mt-0.5', s.className)}>
              {step.status === 'running' ? (
                <span className="mx-1.5 mt-1.5 block size-2 animate-pulse-dot rounded-full bg-ai" aria-hidden />
              ) : (
                <Icon name={step.status === 'done' ? 'check' : step.status === 'warning' ? 'eye' : 'x_circle'} size="sm" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-ink">
                {step.label} <span className={cx('text-xs', s.className)}>· {s.word}</span>
              </p>
              {step.note && <p className="text-ink-muted">{step.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

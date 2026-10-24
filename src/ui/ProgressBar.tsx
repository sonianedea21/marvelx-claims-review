import { cx } from './cx';

type ProgressBarProps = { value: number; max: number; label: string; className?: string };

const WIDTHS = ['w-0', 'w-1/12', 'w-2/12', 'w-3/12', 'w-4/12', 'w-5/12', 'w-6/12', 'w-7/12', 'w-8/12', 'w-9/12', 'w-10/12', 'w-11/12', 'w-full'];

/**
 * Progress in twelfths, so the fill width stays a token-based class; the label carries the exact number.
 * Never overstates: full only when everything is done, and any progress shows at least a sliver.
 */
export function ProgressBar({ value, max, label, className }: ProgressBarProps) {
  const twelfths = twelfthsFor(value, max);
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cx('h-2 overflow-hidden rounded-full bg-line-strong', className)}
    >
      <div className={cx('h-full rounded-full bg-human transition-all duration-300 ease-standard', WIDTHS[twelfths])} />
    </div>
  );
}

export function twelfthsFor(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0;
  if (value >= max) return 12;
  return Math.min(11, Math.max(1, Math.floor((value / max) * 12)));
}

import { cx } from './cx';

type ProgressBarProps = { value: number; max: number; label: string; className?: string };

const WIDTHS = ['w-0', 'w-1/12', 'w-2/12', 'w-3/12', 'w-4/12', 'w-5/12', 'w-6/12', 'w-7/12', 'w-8/12', 'w-9/12', 'w-10/12', 'w-11/12', 'w-full'];

/** Progress in twelfths, so the fill width stays a token-based class. The label carries the exact number. */
export function ProgressBar({ value, max, label, className }: ProgressBarProps) {
  const twelfths = max === 0 ? 0 : Math.round((Math.min(value, max) / max) * 12);
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cx('h-2 overflow-hidden rounded-full bg-sunken', className)}
    >
      <div className={cx('h-full rounded-full bg-human transition-all duration-300 ease-standard', WIDTHS[twelfths])} />
    </div>
  );
}

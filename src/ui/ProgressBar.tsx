import { cx } from './cx';

type ProgressBarProps = { value: number; max: number; label: string; className?: string };

/**
 * A native <progress>, styled in tokens.css (`progress-bar`). It moves with every
 * decision and is exact, so it never looks done before it is (47 of 49 is 96%, not full).
 */
export function ProgressBar({ value, max, label, className }: ProgressBarProps) {
  return <progress value={Math.min(value, max)} max={Math.max(max, 1)} aria-label={label} className={cx('progress-bar block', className)} />;
}

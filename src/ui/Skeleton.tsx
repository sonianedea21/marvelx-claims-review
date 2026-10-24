import { cx } from './cx';

type SkeletonProps = { lines?: number; shape?: 'text' | 'block'; className?: string };

/** Placeholder while loading. Hidden from screen readers; pair it with a visually hidden "Loading…". */
export function Skeleton({ lines = 1, shape = 'text', className }: SkeletonProps) {
  if (shape === 'block') return <div className={cx('h-24 animate-pulse-dot rounded-lg bg-sunken', className)} aria-hidden />;
  return (
    <div className={cx('space-y-2', className)} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={cx('h-4 animate-pulse-dot rounded-sm bg-sunken', i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

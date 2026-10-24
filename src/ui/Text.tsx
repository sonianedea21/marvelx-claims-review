import type { ReactNode } from 'react';
import { cx } from './cx';

type HeadingProps = { level: 1 | 2 | 3; children: ReactNode; className?: string; id?: string };

const HEADING_SIZE = { 1: 'text-xl', 2: 'text-lg', 3: 'text-base' };

/** Serif headings: the one place Libre Baskerville is used. */
export function Heading({ level, children, className, id }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag id={id} className={cx('font-serif tracking-tight text-ink', HEADING_SIZE[level], className)}>
      {children}
    </Tag>
  );
}

/** Small mono uppercase label for metadata: claim refs, field names, document titles. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('font-mono text-xs tracking-label text-ink-subtle uppercase', className)}>{children}</p>;
}

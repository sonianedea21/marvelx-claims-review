import type { ReactNode } from 'react';
import { cx } from './cx';

type CardProps = {
  /** A coloured edge for cards that need attention. Content must still say why. */
  edge?: 'none' | 'attention' | 'danger' | 'human';
  padding?: 'none' | 'md';
  as?: 'div' | 'section' | 'article' | 'li';
  id?: string;
  'aria-labelledby'?: string;
  className?: string;
  children: ReactNode;
};

const EDGE = {
  none: 'border-line',
  attention: 'border-line border-l-4 border-l-attention',
  danger: 'border-line border-l-4 border-l-danger',
  human: 'border-line border-l-4 border-l-human',
};

export function Card({ edge = 'none', padding = 'md', as: Tag = 'div', className, children, ...rest }: CardProps) {
  return (
    <Tag
      className={cx('rounded-lg border bg-surface shadow-sm', EDGE[edge], padding === 'md' && 'p-4 sm:p-5', className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

import { cx } from './cx';

type ExcerptProps = {
  before?: string;
  highlight: string;
  after?: string;
  /** Show "…" where the text was cut. */
  truncated?: boolean;
  className?: string;
};

/** Source text with the cited span highlighted. Plain text only: never rendered as HTML. */
export function Excerpt({ before = '', highlight, after = '', truncated = false, className }: ExcerptProps) {
  return (
    <p className={cx('rounded-md bg-sunken p-3 font-mono text-sm whitespace-pre-wrap text-ink-muted', className)}>
      {truncated && before && '…'}
      {before}
      <mark className="rounded-sm bg-ai-tint px-0.5 text-ink underline decoration-ai decoration-2 underline-offset-4">
        {highlight}
      </mark>
      {after}
      {truncated && after && '…'}
    </p>
  );
}

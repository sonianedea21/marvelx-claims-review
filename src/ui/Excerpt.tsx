import { cx } from './cx';
import { Icon } from './Icon';

type ExcerptProps = {
  before?: string;
  highlight: string;
  after?: string;
  /** cite: the AI's evidence. suspicious: text that tries to instruct the system, never styled as evidence. */
  tone?: 'cite' | 'suspicious';
  /** Show "…" where the surrounding text was cut. */
  truncatedStart?: boolean;
  truncatedEnd?: boolean;
  className?: string;
};

/** Source text with the cited span highlighted. Plain text only: never rendered as HTML. */
export function Excerpt({
  before = '',
  highlight,
  after = '',
  tone = 'cite',
  truncatedStart = false,
  truncatedEnd = false,
  className,
}: ExcerptProps) {
  const suspicious = tone === 'suspicious';
  return (
    <div
      className={cx(
        'max-w-reading rounded-md border p-3 text-sm',
        suspicious ? 'border-danger border-l-4 bg-danger-tint' : 'border-line bg-surface',
        className,
      )}
    >
      {suspicious && (
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-danger">
          <Icon name="shield" size="sm" />
          Suspicious instruction: this is not evidence
        </p>
      )}
      <p className="font-mono whitespace-pre-wrap text-ink-muted">
        {truncatedStart && '…'}
        {before}
        <span className="sr-only">{suspicious ? 'Suspicious text starts: ' : 'Cited text starts: '}</span>
        <mark
          className={cx(
            'rounded-sm px-0.5 text-ink',
            suspicious ? 'bg-transparent' : 'bg-cite underline decoration-ink decoration-2 underline-offset-4',
          )}
        >
          {highlight}
        </mark>
        <span className="sr-only">{suspicious ? ' Suspicious text ends.' : ' Cited text ends.'}</span>
        {after}
        {truncatedEnd && '…'}
      </p>
    </div>
  );
}

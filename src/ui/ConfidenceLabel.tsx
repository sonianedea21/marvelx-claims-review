import { cx } from './cx';
import { Icon } from './Icon';

type ConfidenceLabelProps = {
  /** Words a reviewer can act on: "Likely right", "Check this", "AI is unsure", "Doesn't match the source". */
  label: string;
  /** Secondary detail, e.g. "91%". */
  detail?: string;
  tone: 'neutral' | 'attention' | 'danger';
  className?: string;
};

const TONE = {
  neutral: { text: 'text-ink-muted', icon: null },
  attention: { text: 'text-attention', icon: 'eye' as const },
  danger: { text: 'text-danger', icon: 'x_circle' as const },
};

/** How far to trust a value, in words first and numbers second. Plain text, not a badge: it isn't clickable. */
export function ConfidenceLabel({ label, detail, tone, className }: ConfidenceLabelProps) {
  const t = TONE[tone];
  return (
    <span className={cx('inline-flex items-center gap-1 text-sm font-medium whitespace-nowrap', t.text, className)}>
      {t.icon && <Icon name={t.icon} size="sm" />}
      {label}
      {detail && <span className="font-normal text-ink-subtle">· {detail}</span>}
    </span>
  );
}

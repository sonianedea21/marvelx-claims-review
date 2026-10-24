import type { ReactNode } from 'react';
import { formatValue } from '../../domain/format';
import type { FieldState } from '../../domain/types';
import { Badge, Button, Card, ConfidenceLabel, cx, Excerpt, ValueChange } from '../../ui';
import { ATTENTION_COPY, fieldTrust } from './reviewCopy';

const CITE_PREVIEW = 240;

function shorten(text: string): string {
  return text.length > CITE_PREVIEW ? text.slice(0, CITE_PREVIEW).trimEnd() : text;
}

type Props = {
  field: FieldState;
  changedJustNow: boolean;
  onShowSource: () => void;
  selected: boolean;
  /** Shown when the reviewer opened this card themselves, to fold it back. */
  onCollapse?: () => void;
  children: ReactNode; // the DecisionPanel
};

/** A field that needs the reviewer: why, what the AI changed, the cited text, and the decision. */
export function FieldCard({ field, changedJustNow, onShowSource, selected, onCollapse, children }: Props) {
  const trust = fieldTrust(field);
  const show = (v: FieldState['agent']['value']) => formatValue(v, field.value_type);
  // The trust label already says "Doesn't match the source" or "AI is unsure": don't repeat it as a badge.
  // One badge per message: "AI changed this" is implied by "just now" and by "after you decided".
  const reasons = field.attention.filter(
    (r) =>
      !(r === 'citation_mismatch' || (r === 'low_confidence' && trust.label !== "Doesn't match the source")) &&
      !(r === 'revised_by_agent' && (changedJustNow || field.outdated)),
  );
  const previous = field.history.slice(0, -1);

  return (
    <Card
      as="li"
      edge={field.attention.includes('citation_mismatch') ? 'danger' : field.attention.length > 0 ? 'attention' : 'none'}
      className={cx('my-3', changedJustNow && 'animate-flash')}
    >
      {/* Clicking anywhere on the card (not on a control) shows its source. The button below does the same for keyboards. */}
      <div
        className="space-y-3"
        onClick={(event) => {
          if (!(event.target as HTMLElement).closest('button, input, textarea, label, a, form')) onShowSource();
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <p className="text-sm text-ink-muted">{field.label}</p>
          <div className="flex items-center gap-2">
            <ConfidenceLabel label={trust.label} detail={trust.detail} tone={trust.tone} />
            {onCollapse && (
              <Button size="sm" variant="ghost" onClick={onCollapse} aria-label={`Fold ${field.label} back`}>
                Close
              </Button>
            )}
          </div>
        </div>

        <p className={field.value_type === 'long_text' ? 'text-base' : 'text-lg font-semibold'}>
          {field.agent.value === null ? <span className="text-ink-muted">AI found nothing</span> : show(field.agent.value)}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {changedJustNow && (
            <Badge tone="ai" icon="sparkle" emphasis="solid">
              AI changed this just now
            </Badge>
          )}
          {reasons.map((reason) => (
            <Badge key={reason} tone={ATTENTION_COPY[reason].tone} icon={ATTENTION_COPY[reason].icon}>
              {ATTENTION_COPY[reason].label}
            </Badge>
          ))}
        </div>

        {previous.map((version, i) => (
          <ValueChange
            key={version.version}
            byline={`AI changed this (version ${version.version} → ${version.version + 1})`}
            from={show(version.value)}
            to={show(field.history[i + 1]!.value)}
            reason={field.history[i + 1]!.reason}
          />
        ))}

        {field.cited_text !== null ? (
          <div className="space-y-1.5">
            <p className="text-xs text-ink-subtle">The document says:</p>
            <Excerpt highlight={shorten(field.cited_text)} truncatedEnd={field.cited_text.length > CITE_PREVIEW} />
            <Button size="sm" variant="ghost" icon="document" onClick={onShowSource} aria-pressed={selected}>
              {selected ? 'Showing in the document' : 'See it in the document'}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">No document backs this value. Check it by hand.</p>
        )}

        {children}
      </div>
    </Card>
  );
}

import { formatValue } from '../../domain/format';
import type { FieldState } from '../../domain/types';
import { Button, ConfidenceLabel } from '../../ui';
import { fieldTrust } from './reviewCopy';

type Props = {
  field: FieldState;
  saving: boolean;
  error: string | undefined;
  locked: boolean;
  onAccept: () => void;
  onOpen: () => void;
  selected: boolean;
};

/**
 * A high-confidence, cited, unchanged field: value, trust and the cited words in
 * one line, so a one-tap Accept is still an informed one. Clicking the row opens
 * the full card in place (source, correct, override).
 */
export function FieldRow({ field, saving, error, locked, onAccept, onOpen, selected }: Props) {
  const trust = fieldTrust(field);
  return (
    <li className="grid gap-2 py-3 sm:grid-cols-12 sm:items-center sm:gap-4">
      <button
        type="button"
        onClick={onOpen}
        aria-expanded={selected}
        aria-label={`Open ${field.label} to check it against its source`}
        className="-mx-2 min-w-0 rounded-md px-2 py-1 text-left hover:bg-paper focus-visible:focus-ring sm:col-span-7"
      >
        <p className="text-sm text-ink-muted">{field.label}</p>
        <p className="font-medium break-words">{formatValue(field.agent.value, field.value_type)}</p>
        {field.cited_text && (
          <p className="truncate font-mono text-xs text-ink-subtle" title={field.cited_text}>
            Source: “{field.cited_text.replace(/\s+/g, ' ')}”
          </p>
        )}
      </button>
      <div className="flex items-center justify-between gap-2 sm:col-span-5 sm:justify-end">
        <ConfidenceLabel label={trust.label} detail={trust.detail} tone={trust.tone} />
        {!locked && (
          <Button size="sm" icon="check" loading={saving} onClick={onAccept} aria-label={`Accept ${field.label}`}>
            Accept
          </Button>
        )}
      </div>
      {error && <p className="text-sm font-medium text-danger sm:col-span-12" role="alert">{error}</p>}
    </li>
  );
}

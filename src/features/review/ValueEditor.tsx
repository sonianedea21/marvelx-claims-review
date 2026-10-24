import type { FieldValue, Money, ValueType } from '../../domain/types';
import { ChoiceGroup, Input, TextArea } from '../../ui';

/** The raw text the reviewer is typing; turned into a FieldValue only on submit. */
export type Draft = { text: string; currency: string; bool: 'yes' | 'no' | null };

export function draftFrom(value: FieldValue, valueType: ValueType): Draft {
  if (valueType === 'money') {
    const money = value as Money | null;
    return { text: money?.amount ?? '', currency: money?.currency ?? 'EUR', bool: null };
  }
  if (valueType === 'boolean') return { text: '', currency: 'EUR', bool: value === null ? null : value ? 'yes' : 'no' };
  return { text: value === null ? '' : String(value), currency: 'EUR', bool: null };
}

/** What to send for validation. Numbers stay unparsed when invalid, so validateValue can say so. */
export function draftToInput(draft: Draft, valueType: ValueType): unknown {
  switch (valueType) {
    case 'money':
      return { amount: draft.text.trim(), currency: draft.currency };
    case 'number':
      return draft.text.trim() === '' || Number.isNaN(Number(draft.text)) ? draft.text : Number(draft.text);
    case 'boolean':
      return draft.bool === null ? null : draft.bool === 'yes';
    default:
      return draft.text;
  }
}

type Props = {
  id: string;
  label: string;
  valueType: ValueType;
  draft: Draft;
  onChange: (draft: Draft) => void;
  describedBy?: string;
  invalid?: boolean;
};

/** The right input for each value type. Times stay local to the incident; dates stay calendar dates. */
export function ValueEditor({ id, label, valueType, draft, onChange, describedBy, invalid }: Props) {
  const common = { id, 'aria-describedby': describedBy, 'aria-invalid': invalid || undefined };
  switch (valueType) {
    case 'long_text':
      return <TextArea {...common} value={draft.text} onChange={(e) => onChange({ ...draft, text: e.target.value })} />;
    case 'date':
      return <Input {...common} type="date" value={draft.text} onChange={(e) => onChange({ ...draft, text: e.target.value })} />;
    case 'time':
      return (
        <Input {...common} inputMode="numeric" placeholder="HH:MM" value={draft.text} onChange={(e) => onChange({ ...draft, text: e.target.value })} />
      );
    case 'number':
      return (
        <Input {...common} inputMode="decimal" value={draft.text} onChange={(e) => onChange({ ...draft, text: e.target.value })} />
      );
    case 'money':
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-ink-muted" aria-hidden>
            {draft.currency}
          </span>
          <Input
            {...common}
            inputMode="decimal"
            placeholder="1234.50"
            aria-label={`${label} amount in ${draft.currency}`}
            value={draft.text}
            onChange={(e) => onChange({ ...draft, text: e.target.value })}
          />
        </div>
      );
    case 'boolean':
      return (
        <ChoiceGroup
          name={id}
          legend={label}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
          value={draft.bool}
          onChange={(bool) => onChange({ ...draft, bool })}
        />
      );
    default:
      return <Input {...common} value={draft.text} onChange={(e) => onChange({ ...draft, text: e.target.value })} />;
  }
}

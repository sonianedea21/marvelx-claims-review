import type { FieldState } from './types';
import { sameValue } from './validateValue';

/**
 * Fields the AI works out from other fields instead of reading them from a
 * document, so they have no citation to check. The fixture doesn't say which
 * inputs a derived field uses, so we list them here. Add entries as they turn up.
 */
export const DERIVED_FROM: Record<string, string[]> = {
  estimated_payable: ['total_incl_vat', 'excess'], // 004817: total incl. VAT − excess
};

/**
 * When the reviewer corrects or overrides an input, the AI's derived value no
 * longer follows from what the reviewer decided. Flag it, and reopen it if the
 * reviewer had already decided it before changing the input. We don't recalculate:
 * working out a payout is not this screen's job.
 */
export function withDerivedInputs(fields: FieldState[]): FieldState[] {
  const byId = new Map(fields.map((f) => [f.field_id, f]));

  return fields.map((field) => {
    const changed = (DERIVED_FROM[field.field_id] ?? [])
      .map((id) => byId.get(id))
      .filter((input): input is FieldState => input !== undefined && changedByReviewer(input));
    if (changed.length === 0) return field;

    // ISO timestamps in UTC compare correctly as strings.
    const lastChange = changed.map((input) => input.decision!.at).sort().at(-1)!;
    return {
      ...field,
      changed_inputs: changed.map((input) => input.label),
      inputs_changed_since_decision: field.decision !== null && field.decision.at < lastChange,
      attention: [...field.attention, 'inputs_changed'],
    };
  });
}

/** The reviewer's value differs from the AI's: a correction, or an override with another value. */
function changedByReviewer(field: FieldState): boolean {
  return field.decision !== null && !sameValue(field.decision.value, field.agent.value);
}

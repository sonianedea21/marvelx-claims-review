import { HIGH_CONFIDENCE } from './confidence';
import type { ClaimStatus, DecisionAction, FieldState, FieldValue } from './types';
import { DECISION_ACTIONS } from './types';
import { sameValue, validateValue } from './validateValue';

/** What the browser sends. Everything is unknown until validated. */
export type DecisionInput = { field_id?: unknown; action?: unknown; value?: unknown; agent_version?: unknown };

export type DecisionContext = {
  claimStatus: ClaimStatus;
  field: FieldState | undefined;
};

export type DecisionResult =
  | { ok: true; action: DecisionAction; value: FieldValue; agent_version: number; agent_confidence: number }
  | { ok: false; status: 400 | 404 | 409 | 422; code: string; message: string };

/**
 * The single gate every reviewer decision goes through, on the server (and in
 * the browser for inline errors). Bulk accept must go through here too, plus
 * the stricter checks in bulkAcceptBlockers below.
 */
export function validateDecision(input: DecisionInput, ctx: DecisionContext): DecisionResult {
  if (typeof input.field_id !== 'string') return fail(400, 'invalid_body', 'field_id is required.');
  if (!DECISION_ACTIONS.includes(input.action as DecisionAction)) {
    return fail(400, 'invalid_body', `action must be one of: ${DECISION_ACTIONS.join(', ')}.`);
  }
  if (!Number.isInteger(input.agent_version)) {
    return fail(400, 'invalid_body', 'agent_version is required: the agent version the reviewer saw.');
  }

  const { field, claimStatus } = ctx;
  if (!field) return fail(404, 'field_not_found', `No field "${input.field_id}" on this claim yet.`);
  if (claimStatus === 'reviewed') return fail(409, 'review_completed', 'This review is already completed.');

  // The agent changed the value since the reviewer saw it: never apply a decision to a value they didn't see.
  if (input.agent_version !== field.agent.version) {
    return fail(
      409,
      'agent_value_changed',
      `The AI changed this field (now version ${field.agent.version}) after you looked at it. Review the new value.`,
    );
  }

  const action = input.action as DecisionAction;
  const base = { ok: true as const, action, agent_version: field.agent.version, agent_confidence: field.agent.confidence };

  if (action === 'accept') return { ...base, value: field.agent.value };

  if (action === 'correct') {
    if (field.agent.value === null) {
      return fail(422, 'nothing_to_correct', 'The AI found nothing here, so there is nothing to correct. Use override.');
    }
    const result = validateValue(field.value_type, input.value);
    if (!result.ok) return fail(422, 'invalid_value', result.message);
    if (sameValue(result.value, field.agent.value)) {
      return fail(422, 'unchanged_value', 'That is the AI value unchanged. Use accept.');
    }
    return { ...base, value: result.value };
  }

  // override: reject the agent's value and supply your own. null means "there is no value".
  if (input.value === null) return { ...base, value: null };
  const result = validateValue(field.value_type, input.value);
  if (!result.ok) return fail(422, 'invalid_value', result.message);
  return { ...base, value: result.value };
}

export type BulkAcceptBlocker =
  | 'claim_not_ready'
  | 'agent_value_changed'
  | 'no_value'
  | 'no_citation'
  | 'citation_mismatch'
  | 'below_threshold'
  | 'claim_flagged';

/**
 * Rules for the next ticket (bulk accept above a confidence threshold). Not
 * used by the UI yet; encoded and tested now so the ticket can't break them.
 * `shownVersion` is the agent version the reviewer saw when they chose bulk accept.
 */
export function bulkAcceptBlockers(
  field: FieldState,
  claim: { status: ClaimStatus; suspicious_instructions: boolean },
  shownVersion: number,
  threshold = HIGH_CONFIDENCE,
): BulkAcceptBlocker[] {
  const blockers: BulkAcceptBlocker[] = [];
  if (claim.status !== 'needs_review') blockers.push('claim_not_ready');
  if (field.agent.version !== shownVersion) blockers.push('agent_value_changed');
  if (field.agent.value === null) blockers.push('no_value');
  if (field.agent.source === null) blockers.push('no_citation');
  if (field.citation_check === 'mismatch') blockers.push('citation_mismatch');
  if (field.agent.confidence < threshold) blockers.push('below_threshold');
  if (claim.suspicious_instructions) blockers.push('claim_flagged');
  return blockers;
}

function fail(status: 400 | 404 | 409 | 422, code: string, message: string): DecisionResult {
  return { ok: false, status, code, message };
}

import { checkCitation } from './checkCitation';
import { LOW_CONFIDENCE } from './confidence';
import type { AgentField, AttentionReason, FieldState, FieldStatus, ReviewerDecision } from './types';

const STATUS_BY_ACTION: Record<ReviewerDecision['action'], FieldStatus> = {
  accept: 'accepted',
  correct: 'corrected',
  override: 'overridden',
};

/**
 * Combines what the agent says about a field with what the reviewer decided.
 * `documentText` looks up a document's full text by id, for the citation.
 */
export function deriveFieldState(
  field: AgentField,
  decision: ReviewerDecision | null,
  documentText: (documentId: string) => string | undefined,
): FieldState {
  const latest = field.versions[field.versions.length - 1]!;
  const agent = { ...latest, confidence: field.confidence };
  const citedText = agent.source ? sliceCitation(documentText(agent.source.document_id), agent.source) : null;
  const citationCheck = checkCitation(agent.value, field.value_type, citedText);

  const outdated = decision !== null && decision.agent_version < agent.version;
  const confidenceChangedSinceDecision =
    decision !== null && !outdated && decision.agent_confidence !== agent.confidence;

  const attention: AttentionReason[] = [];
  if (citationCheck === 'mismatch') attention.push('citation_mismatch');
  if (agent.confidence < LOW_CONFIDENCE) attention.push('low_confidence');
  if (field.versions.length > 1) attention.push('revised_by_agent');
  if (agent.source === null) attention.push('no_citation');
  if (agent.value === null) attention.push('no_value');
  if (outdated) attention.push('decision_outdated');

  return {
    field_id: field.field_id,
    label: field.label,
    value_type: field.value_type,
    agent,
    history: field.versions,
    confidence_notes: field.confidence_notes,
    cited_text: citedText,
    citation_check: citationCheck,
    decision,
    status: decision ? STATUS_BY_ACTION[decision.action] : 'pending',
    outdated,
    confidence_changed_since_decision: confidenceChangedSinceDecision,
    attention,
    final_value: decision ? decision.value : undefined,
  };
}

/** Offsets are UTF-16 code units, which is exactly what String.prototype.slice uses. */
export function sliceCitation(text: string | undefined, source: { start: number; end: number }): string | null {
  if (text === undefined || source.start < 0 || source.end > text.length || source.start >= source.end) return null;
  return text.slice(source.start, source.end);
}

/** Latest decision per field. Decisions are append-only; the newest one wins. */
export function latestDecisions(decisions: ReviewerDecision[]): Map<string, ReviewerDecision> {
  const latest = new Map<string, ReviewerDecision>();
  for (const decision of decisions) latest.set(decision.field_id, decision);
  return latest;
}

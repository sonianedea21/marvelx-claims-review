import { summaryText } from './applyEvent';
import { deriveClaimStatus, reviewBlockers } from './deriveClaimStatus';
import { deriveFieldState, latestDecisions } from './deriveFieldState';
import { withDerivedInputs } from './derivedFields';
import { missingChecks } from './missingChecks';
import { isOpen, needsALook } from './needsALook';
import { detectSuspiciousInstructions } from './suspiciousInstructions';
import type {
  ClaimDetail, ClaimSeed, DocumentMeta, QueueItem, ReviewState, ReviewerDecision, RunState,
} from './types';

export type ClaimRecord = {
  seed: ClaimSeed;
  documents: (DocumentMeta & { text: string })[];
  run: RunState;
  decisions: ReviewerDecision[];
  review: ReviewState;
  updated_at: string;
};

/** Everything the review screen needs, derived from the stored record. */
export function buildClaimDetail(record: ClaimRecord): ClaimDetail {
  const { seed, run, review } = record;
  const textById = new Map(record.documents.map((d) => [d.document_id, d.text]));
  const decisions = latestDecisions(record.decisions);

  const fields = withDerivedInputs(
    run.field_order.map((id) => deriveFieldState(run.fields[id]!, decisions.get(id) ?? null, (docId) => textById.get(docId))),
  );
  const summary = summaryText(run);
  const suspicious = detectSuspiciousInstructions(record.documents, summary);
  const steps = run.step_order.map((id) => run.steps[id]!);
  const runningSteps = steps.filter((s) => s.status === 'running');

  const claim: QueueItem = {
    id: seed.id,
    claim_id: seed.claim_id,
    claimant_name: seed.claimant_name,
    product: seed.product,
    priority: seed.priority,
    status: deriveClaimStatus(seed.initial_status, run, review),
    received_at: seed.received_at,
    updated_at: record.updated_at,
    confidence: run.overall_confidence,
    progress: { decided: fields.filter((f) => f.status !== 'pending').length, total: fields.length },
    needs_attention: fields.filter((f) => needsALook(f) && isOpen(f)).length,
    open_conflicts: fields.filter((f) => f.outdated).length,
    suspicious_instructions: suspicious.length > 0,
    missing_checks: missingChecks(run),
    run_error: run.error,
  };

  return {
    claim,
    documents: record.documents.map(({ text: _text, ...meta }) => meta),
    run: {
      phase: run.phase,
      started_at: run.started_at,
      steps,
      // The innermost running step: the most recently started one.
      current_step: runningSteps[runningSteps.length - 1] ?? null,
      summary,
      overall_confidence: run.overall_confidence,
      error: run.error,
    },
    fields,
    suspicious_instructions: suspicious,
    review: { ...review, blockers: reviewBlockers(run, fields, suspicious, review) },
  };
}

// Domain types shared by the server and the browser. Pure TypeScript: no React, no I/O.

// ---- Values, as the fixture defines them ----

export type ValueType = 'text' | 'long_text' | 'money' | 'date' | 'time' | 'number' | 'boolean';
export const VALUE_TYPES: readonly ValueType[] = ['text', 'long_text', 'money', 'date', 'time', 'number', 'boolean'];

/** Amount is a decimal string ("4415.30"). Never parse it to a float for arithmetic. */
export type Money = { amount: string; currency: string };

/** `null` means the agent looked and found nothing. */
export type FieldValue = string | number | boolean | Money | null;

/** UTF-16 offsets into the document text: start inclusive, end exclusive. */
export type Citation = { document_id: string; start: number; end: number };

// ---- Fixture inputs ----

export type Priority = 'high' | 'normal' | 'low';
export const PRIORITIES: readonly Priority[] = ['high', 'normal', 'low'];

export type ClaimStatus = 'queued' | 'running' | 'needs_review' | 'reviewed' | 'failed';
export const CLAIM_STATUSES: readonly ClaimStatus[] = ['queued', 'running', 'needs_review', 'reviewed', 'failed'];

export type ClaimSeed = {
  id: string;
  claim_id: string;
  claimant_name: string;
  product: string;
  priority: Priority;
  received_at: string;
  run: string;
  /** null: the run finished before the session began, deliver all of it at once. */
  start_after_ms: number | null;
  initial_status: ClaimStatus;
};

export type DocumentMeta = { document_id: string; claim_id: string; title: string; kind: string };

type EventBase = { seq: number; at_ms: number; claim_id: string };

export type RunEvent = EventBase &
  (
    | { type: 'run_started'; payload: { started_at: string } }
    | { type: 'step_started'; payload: { step_id: string; label: string } }
    | { type: 'step_finished'; payload: { step_id: string; outcome: 'ok' | 'warning'; note?: string } }
    | { type: 'summary_delta'; payload: { text: string } }
    | {
        type: 'field_extracted';
        payload: {
          field_id: string;
          label: string;
          value: FieldValue;
          value_type: ValueType;
          confidence: number;
          source: Citation | null;
        };
      }
    | {
        type: 'field_revised';
        payload: { field_id: string; value: FieldValue; confidence: number; source: Citation | null; reason: string };
      }
    | { type: 'confidence_changed'; payload: { field_id: string; confidence: number; reason: string } }
    | { type: 'run_finished'; payload: { overall_confidence: number } }
    | {
        type: 'run_failed';
        payload: { step_id: string; error: { code: string; message: string; retryable: boolean } };
      }
  );

// ---- Run state (built by applyEvent) ----

export type StepStatus = 'running' | 'ok' | 'warning' | 'failed';
export type Step = { step_id: string; label: string; status: StepStatus; note: string | null };

/** One value the agent put forward. Version 1 is the extraction; each field_revised adds one. */
export type AgentVersion = {
  version: number;
  seq: number;
  value: FieldValue;
  confidence: number;
  source: Citation | null;
  reason: string | null;
};

export type AgentField = {
  field_id: string;
  label: string;
  value_type: ValueType;
  versions: AgentVersion[];
  /** Current confidence: confidence_changed moves it without creating a new version. */
  confidence: number;
  confidence_notes: { seq: number; confidence: number; reason: string }[];
};

export type RunError = { step_id: string; code: string; message: string; retryable: boolean };

export type RunState = {
  phase: 'not_started' | 'running' | 'finished' | 'failed';
  started_at: string | null;
  /** Seqs already applied. An array, not a Set, so the state stays plain JSON. */
  seen_seqs: number[];
  step_order: string[];
  steps: Record<string, Step>;
  summary_parts: { seq: number; text: string }[];
  field_order: string[];
  fields: Record<string, AgentField>;
  /** Revisions or confidence changes for fields not extracted yet, applied once they are. */
  held_events: RunEvent[];
  overall_confidence: number | null;
  error: RunError | null;
};

// ---- Reviewer side ----

export type DecisionAction = 'accept' | 'correct' | 'override';
export const DECISION_ACTIONS: readonly DecisionAction[] = ['accept', 'correct', 'override'];

export type ReviewerDecision = {
  id: string;
  claim_id: string;
  field_id: string;
  action: DecisionAction;
  /** accept: the agent value the reviewer was shown. correct / override: the reviewer's value. */
  value: FieldValue;
  /** The agent version the reviewer saw. A newer agent version makes this decision outdated. */
  agent_version: number;
  /** The agent confidence the reviewer saw, so a later confidence-only change can be noted. */
  agent_confidence: number;
  at: string;
  reviewer: string;
};

export type ReviewState = { warning_acknowledged_at: string | null; completed_at: string | null };

// ---- Derived views (what the API serves) ----

export type AttentionReason =
  | 'citation_mismatch'
  | 'low_confidence'
  | 'revised_by_agent'
  | 'no_citation'
  | 'no_value'
  | 'decision_outdated';

export type FieldStatus = 'pending' | 'accepted' | 'corrected' | 'overridden';

export type FieldState = {
  field_id: string;
  label: string;
  value_type: ValueType;
  /** The agent's current version, with the current confidence. */
  agent: AgentVersion;
  /** Every version, oldest first, including the current one. */
  history: AgentVersion[];
  confidence_notes: AgentField['confidence_notes'];
  cited_text: string | null;
  citation_check: CitationCheck;
  decision: ReviewerDecision | null;
  status: FieldStatus;
  /** The agent changed the value after the reviewer decided. */
  outdated: boolean;
  /** The agent changed only its confidence after the reviewer decided. Informational. */
  confidence_changed_since_decision: boolean;
  attention: AttentionReason[];
  /** The reviewer's value once decided; undefined until then. */
  final_value: FieldValue | undefined;
};

export type CitationCheck = 'match' | 'mismatch' | 'not_checked';

export type SuspiciousInstruction = { where: 'document' | 'summary'; document_id: string | null; excerpt: string };

export type ReviewBlocker = 'run_not_finished' | 'fields_undecided' | 'decisions_outdated' | 'warning_not_acknowledged';

export type QueueItem = {
  id: string;
  claim_id: string;
  claimant_name: string;
  product: string;
  priority: Priority;
  status: ClaimStatus;
  received_at: string;
  updated_at: string;
  /** overall_confidence once the run has finished, else null. */
  confidence: number | null;
  progress: { decided: number; total: number };
  needs_attention: number;
  open_conflicts: number;
  suspicious_instructions: boolean;
  /** Set when the run failed: what the AI reported, and whether running it again can help. */
  run_error: RunError | null;
};

export type ClaimDetail = {
  claim: QueueItem;
  documents: DocumentMeta[];
  run: {
    phase: RunState['phase'];
    started_at: string | null;
    steps: Step[];
    current_step: Step | null;
    summary: string;
    overall_confidence: number | null;
    error: RunError | null;
  };
  fields: FieldState[];
  suspicious_instructions: SuspiciousInstruction[];
  review: ReviewState & { blockers: ReviewBlocker[] };
};

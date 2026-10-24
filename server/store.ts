import { applyEvent, emptyRunState } from '../src/domain/applyEvent';
import { buildClaimDetail, type ClaimRecord } from '../src/domain/buildClaimDetail';
import type { ClaimDetail, ReviewerDecision, RunEvent } from '../src/domain/types';
import type { FixtureClaim } from './fixtures';

type Listener = (claimId: string) => void;

/**
 * In-memory source of truth for run progress, decisions and review state.
 * Every change notifies listeners with the claim id, which is what the SSE
 * routes push to the browser.
 */
export class ClaimStore {
  private records = new Map<string, ClaimRecord>();
  private listeners = new Set<Listener>();
  private nextDecisionId = 1;

  constructor(private fixtures: FixtureClaim[], private now: () => Date = () => new Date()) {
    this.reset();
  }

  /** Back to the state before any event was delivered. Clears decisions too. */
  reset() {
    this.records.clear();
    for (const fixture of this.fixtures) {
      this.records.set(fixture.seed.id, {
        seed: fixture.seed,
        documents: fixture.documents,
        run: emptyRunState(),
        decisions: [],
        review: { warning_acknowledged_at: null, completed_at: null },
        updated_at: fixture.seed.received_at,
      });
    }
    for (const id of this.records.keys()) this.notify(id);
  }

  ids(): string[] {
    return [...this.records.keys()];
  }

  has(id: string): boolean {
    return this.records.has(id);
  }

  detail(id: string): ClaimDetail | undefined {
    const record = this.records.get(id);
    return record && buildClaimDetail(record);
  }

  documentText(id: string, documentId: string) {
    return this.records.get(id)?.documents.find((d) => d.document_id === documentId);
  }

  deliver(id: string, event: RunEvent) {
    const record = this.mustGet(id);
    const run = applyEvent(record.run, event);
    if (run === record.run) return; // duplicate delivery: nothing changed
    record.run = run;
    this.touch(id);
  }

  addDecision(id: string, decision: Omit<ReviewerDecision, 'id' | 'claim_id' | 'at' | 'reviewer'>): ReviewerDecision {
    const record = this.mustGet(id);
    const saved: ReviewerDecision = {
      ...decision,
      id: `dec_${this.nextDecisionId++}`,
      claim_id: record.seed.claim_id,
      at: this.now().toISOString(),
      reviewer: 'reviewer',
    };
    record.decisions.push(saved);
    this.touch(id);
    return saved;
  }

  acknowledgeWarning(id: string) {
    const record = this.mustGet(id);
    record.review.warning_acknowledged_at ??= this.now().toISOString();
    this.touch(id);
  }

  complete(id: string) {
    const record = this.mustGet(id);
    record.review.completed_at = this.now().toISOString();
    this.touch(id);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private touch(id: string) {
    this.mustGet(id).updated_at = this.now().toISOString();
    this.notify(id);
  }

  private notify(id: string) {
    for (const listener of this.listeners) listener(id);
  }

  private mustGet(id: string): ClaimRecord {
    const record = this.records.get(id);
    if (!record) throw new Error(`Unknown claim ${id}`);
    return record;
  }
}

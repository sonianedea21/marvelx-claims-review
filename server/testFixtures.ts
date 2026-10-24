// Test helpers: load fixture claims and build domain state from them.
// Lives in server/ because it reads files; domain/ stays free of I/O.
import { applyEvents, emptyRunState } from '../src/domain/applyEvent';
import type { ClaimRecord } from '../src/domain/buildClaimDetail';
import type { RunEvent } from '../src/domain/types';
import { EXTRA_FIXTURES_DIR, FIXTURES_DIR, loadFixturePack, type FixtureClaim } from './fixtures';

const all = [...loadFixturePack(FIXTURES_DIR), ...loadFixturePack(EXTRA_FIXTURES_DIR)];

export function fixture(id: string): FixtureClaim {
  const found = all.find((c) => c.seed.id === id);
  if (!found) throw new Error(`No fixture ${id}`);
  return found;
}

/** Events in delivery order, optionally only those delivered by `untilMs` (run-relative). */
export function deliveredEvents(id: string, untilMs = Infinity): RunEvent[] {
  return fixture(id).events.filter((e) => e.at_ms <= untilMs);
}

export function runState(id: string, untilMs = Infinity) {
  return applyEvents(emptyRunState(), deliveredEvents(id, untilMs));
}

export function record(id: string, untilMs = Infinity): ClaimRecord {
  const { seed, documents } = fixture(id);
  return {
    seed,
    documents,
    run: runState(id, untilMs),
    decisions: [],
    review: { warning_acknowledged_at: null, completed_at: null },
    updated_at: seed.received_at,
  };
}

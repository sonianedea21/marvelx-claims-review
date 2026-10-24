# MarvelX take-home — Step 2 plan

## Context
4-hour take-home (brief: Google Doc "product-engineer-frontend-take-home", to be saved verbatim as `docs/BRIEF.md`). Build a queue + live review screen where a non-technical reviewer watches an AI agent extract claim fields and accepts / corrects / overrides them, plus a small Node backend, a documented replay, the committed agent setup, a README with 7 fixed sections and a 3–5 min recording. Judged on visual finish (laptop + phone), the state model, and where we invested vs stopped. Bulk accept is the README "next ticket": **design for it, don't build it**.

Decided with Sonia:
- git init, move supplied files byte-for-byte into `fixtures/`; move `documents/CLAUDE.md` and `documents/Claude outputs/` out.
- Skills → `.claude/skills/ui-component/SKILL.md` and `.claude/skills/visual-check/SKILL.md` (from the drafts, unchanged).
- Injection: our own deterministic server check flags the claim; banner + quoted text; must be acknowledged before completing.
- Value-vs-citation check for date / time / money / number (catches 22:40 vs cited "23:40").
- Final action: field decisions + "Complete review" sign-off. No payout decision.
- Tests cover the happy path and every trap.
- Backend is Express on Node, not Hono (Sonia knows Node and Nest, and has to defend it line by line). Record this in ai-log as a reworked proposal.

## State model
The server is the source of truth. It holds, per claim, the delivered events (deduped), the decisions (append-only) and review state. One pure domain function derives everything, on both server and client.

```
events (deduped by claim_id+seq) ──applyEvent──▶ RunState (steps, summary, agent field versions, outcome)
decisions (append-only)          ─┐
review {acknowledged, completed} ─┼─ deriveFieldState / deriveClaimStatus ─▶ FieldState[], QueueItem
RunState                         ─┘
```

```ts
// src/domain/types.ts
export type ValueType = 'text' | 'long_text' | 'money' | 'date' | 'time' | 'number' | 'boolean';
export type Money = { amount: string; currency: string };          // amount: decimal string
export type FieldValue = string | number | boolean | Money | null;  // null = agent found nothing
export type Citation = { document_id: string; start: number; end: number };

export type ClaimStatus = 'queued' | 'running' | 'needs_review' | 'reviewed' | 'failed';
export type Priority = 'high' | 'normal' | 'low';

export type QueueItem = {
  id: string; claim_id: string; claimant_name: string; product: string;
  priority: Priority; status: ClaimStatus;
  received_at: string; updated_at: string;          // updated_at = last applied event or decision
  confidence: number | null;                        // overall_confidence once run_finished
  progress: { decided: number; total: number };
  needs_attention: number;                          // fields with ≥1 attention reason and no decision
  open_conflicts: number;
  suspicious_instructions: boolean;
};

export type AgentVersion = {
  version: number;                 // 1 = extracted, +1 per field_revised (value change only)
  seq: number;
  value: FieldValue; confidence: number; source: Citation | null;
  reason: string | null;           // from field_revised
};

export type AttentionReason =
  | 'low_confidence' | 'revised_by_agent' | 'no_citation'
  | 'no_value' | 'citation_mismatch' | 'decision_outdated';

export type FieldState = {
  field_id: string; label: string; value_type: ValueType;
  agent: AgentVersion;             // current
  history: AgentVersion[];         // oldest first, includes current
  confidence_notes: { seq: number; confidence: number; reason: string }[]; // confidence_changed
  decision: ReviewerDecision | null;      // latest for this field
  status: 'pending' | 'accepted' | 'corrected' | 'overridden';
  outdated: boolean;               // decision.agent_version < agent.version
  attention: AttentionReason[];
  final_value: FieldValue | undefined;    // decision value, else undefined (not decided)
};

export type ReviewerDecision = {
  id: string; claim_id: string; field_id: string;
  action: 'accept' | 'correct' | 'override';
  value: FieldValue;               // accept: server copies the agent value it was shown
  agent_version: number;           // version the reviewer saw
  at: string; reviewer: string;    // single implicit reviewer
};
```

Status derivation (`deriveClaimStatus`, one place):
1. `run_failed` applied → `failed` (field decisions still allowed; Complete review blocked).
2. no `run_started` yet → `initial_status` from claims.json (`queued`).
3. `run_started` without `run_finished` → `running`.
4. `run_finished` + review completed → `reviewed`; otherwise → `needs_review`.

Complete review requires: run finished, every field decided, no outdated decisions, injection acknowledged if flagged.

Domain rules (`applyEvent`): ignore an already-seen `(claim_id, seq)`; steps live in a map by `step_id` (they can nest); summary is append-only, ordered by seq; a revision or confidence change for an unknown field is kept in a pending list and applied after the extraction (defensive).

`validateDecision(claim, field, input)` is the single rule gate. It also holds the bulk-accept rules as named checks, with tests: not on running or failed claims (bulk only), stale `agent_version` → 409, `accept` on a null value or missing citation is blocked for bulk, flagged claims are blocked for bulk, and the value must be valid for its `value_type` → 422.

## API contract (Express on Node, in-memory; SSE written by hand)
| Endpoint | Notes |
|---|---|
| `GET /api/claims?status=&priority=` | `QueueItem[]`, sorted needs_review → running → failed → queued → reviewed, then priority, then received_at. Unknown value → `400 {error, param, allowed}` |
| `GET /api/claims/:id` | Snapshot: claim, documents meta, RunState, FieldState[], decisions, flags, `cursor`. `404` if unknown |
| `GET /api/claims/:id/events` | SSE: a full claim snapshot (same shape as `GET /api/claims/:id`) after every applied event, decision or replay reset. The browser only renders it; a reconnect just gets the latest snapshot |
| `GET /api/claims/:id/documents/:docId` | `{document_id, title, kind, text}`. `404` if the document isn't on this claim |
| `POST /api/claims/:id/decisions` | `{field_id, action, value?, agent_version}` → `201`. `400` malformed, `404` field, `409` stale version (returns current), `422` invalid value |
| `POST /api/claims/:id/acknowledge-warning` | records the acknowledgement |
| `POST /api/claims/:id/complete` | `409 {blocked_by: [...]}` when blocked |
| `GET /api/queue/events` | SSE: a `QueueItem` each time one changes |
| `POST /api/dev/replay` | `{speed?, seek_ms?}`: restarts the clock and clears decisions. Dev only |

Only the server applies events (deduped and idempotent). The client imports the domain types and `validateDecision` for inline validation. It highlights "AI updated this just now" by comparing `agent.version` between snapshots.

## Replay
- The server `ReplayClock` delivers each event at `(start_after_ms + at_ms) / speed`. Claims with `null` get everything at boot.
- `REPLAY_SPEED=4 npm run dev` sets the speed at boot. `npm run replay -- --speed 2` calls `POST /api/dev/replay` to restart. A dev-only bar in the UI has Restart and a speed select.
- `seek_ms` + `speed: 0` freezes at a position, which gives the visual check deterministic screenshots (004817 at 70s).
- `fixtures-extra/`: a short 3-event run, a failure variant, and a document with an emoji for the UTF-16 test.

## Folders
As in CLAUDE.md, plus:
- `fixtures/` holds the moved originals.
- `docs/BRIEF.md`, `docs/ai-log.md`, `docs/design/`.
- `AGENTS.md` (one line pointing to CLAUDE.md, since the brief names it).
- Inside `src/domain/`: `applyEvent.ts`, `deriveFieldState.ts`, `deriveClaimStatus.ts`, `validateDecision.ts`, `detectSuspiciousInstructions.ts`, `checkCitation.ts`, `format.ts`.
- `server/` tests sit beside their routes.
- Fill in the CLAUDE.md "Commands" section and fix its paths.

## Time plan (≈240 min)
| # | Slice | Min |
|---|---|---|
| 0 | git init, move fixtures, skills, BRIEF, ai-log | 10 |
| 1 | Scaffold (Vite, Tailwind v4, Vitest, Express, ESLint, Playwright) + visual-check script | 25 |
| 2 | Design exploration ×3 + critique → Sonia picks | 25 |
| 3 | Domain + replay + API + tests | 55 |
| 4 | Tokens + `ui/` + `/dev/components` | 30 |
| 5 | Queue screen (filters, live updates) | 20 |
| 6 | Review screen (fields, citation, steps, summary, decisions, conflicts, injection, failed) | 45 |
| 7 | Polish: phone, a11y, states | 10 |
| 8 | README (7 sections) + recording | 20 |

Cut first, in this order:
1. Playwright e2e smoke test
2. Citation check for money and number (keep date and time)
3. Explorations reduced to 2
4. The UI speed control (keep the script and the env var)
5. Queue SSE replaced by 2s polling

Dependencies need approval at slice 1: react, react-dom, react-router, react-markdown, @radix-ui (dialog, tooltip), tailwindcss + @tailwindcss/vite, express + @types/express, supertest + @types/supertest, tsx, vitest, @testing-library/react, jsdom, @playwright/test, eslint + typescript-eslint, concurrently.

## Product decisions for Sonia (each with a recommendation)
1. **Event transport:** raw events + a shared client reducer (rec) vs server-pushed snapshots.
2. **Queue updates:** SSE (rec) vs polling.
3. **Confidence-only change after a decision:** an informational marker, not a conflict (rec). A value or source revision makes the decision outdated.
4. **Outdated decision UX:** keep the decision, show "You accepted v1, the agent changed it to v2 (reason)", and offer "Keep mine" or "Review again" (rec).
5. **Mid-edit revision:** keep the editor open with an inline notice; submitting gets a 409 and shows the choice (rec).
6. **Confidence copy:** bands "Likely right" (≥0.9), "Check this" (0.7–0.9), "Unsure: verify" (<0.7), with % as secondary text (rec).
7. **Flagged summary:** show it with the injected sentences marked, behind the banner (rec) vs hide it until acknowledged.
8. **Null values:** individually the reviewer can "Confirm nothing found"; bulk never can (rec).
9. **`estimated_payable`:** flag "AI-calculated, no source". No dependency tracking (rec, cut).
10. **Changing a decision:** allowed. Decisions are append-only and the latest wins (rec).
11. **Failed run:** show `error.message` and "The agent can be re-run" as text. No fake Retry button; the dev replay can restart it (rec).

## Verification
- `npm run typecheck && npm test && npm run lint`.
- Domain tests:
  - Happy path: full replay of 004809 and 004830 → `needs_review` with the correct fields.
  - Traps: the duplicate seq 42, revision after accept → outdated, the failed 004822, null value and null source, citation slice = document text (including emoji), money and date formatting, the citation check flags 22:40, the injection flag on 004817, and the bulk rules.
- API tests: 400 for an unknown filter, 404 for an unknown id, 409 for a stale version, 422 for a bad value, 201 for the happy path.
- `npm run visual-check` at 375 and 1280 on the queue, 004817 mid-run and finished, 004822 and `/dev/components`.
- Manual: replay at 1× and act on fields while 004817 runs.

## Decisions made after approval
- Transport: full snapshots over SSE, not raw events.
- Queue updates: SSE.
- Confidence-only change: a note. A value revision makes the decision outdated, with "Keep mine" / "Review again".
- Mid-edit revision: the editor stays open with a notice; submitting returns 409.
- Live signals: a sticky "AI is still working · <step>" bar, and an "AI updated this just now" moment with the reason. No per-field "may still change" marker.
- Null values: "Confirm nothing found" one field at a time, never in bulk. Decisions are append-only, latest wins.
- Explorations: in code in `src/explorations/`.
- Still open, to decide after the explorations: confidence copy and thresholds, the flagged-summary display, the failed-run copy.

# AI log

Factual record of what the coding agent (Claude Code) proposed and what Sonia kept, changed or rejected. Source for README section 3. No entries are invented or embellished.

## 2026-10-24 · Planning

### Repo layout: accepted as proposed
- **Proposed:** git init, move the supplied fixture files unchanged into `fixtures/`, and take the stray `documents/CLAUDE.md` copy and `documents/Claude outputs/` out of the fixture documents folder.
- **Outcome:** accepted. Files moved; SHA-256 checksums match before and after.

### Injection handling: accepted as proposed
- **Proposed:** our own deterministic server check flags suspicious instructions; the UI shows a banner with the quoted text, and the reviewer must acknowledge it before completing the review. Alternatives offered: rely on the agent's own step note, or both.
- **Outcome:** accepted.

### Value-vs-citation check: accepted as proposed
- **Proposed:** for date, time, money and number fields, check that the value appears in the cited text (catches `incident_time` "22:40" whose citation reads "23:40").
- **Outcome:** accepted.

### Final reviewer action: accepted after clarification
- **Proposed:** field decisions plus a "Complete review" sign-off, with no payout approve/reject.
- **Sonia:** asked what "approve or reject of payout" meant before choosing. After the explanation she chose the recommended option.

### Bulk accept: questioned, then confirmed against the brief
- **Proposed:** don't build bulk accept; design for it through `validateDecision` and rule tests.
- **Sonia:** questioned whether the brief actually requires building it, and shared the brief.
- **Outcome:** the brief (README section 4) says "Do not build it." Kept as plan-for-it only.

### Backend framework: reworked
- **Proposed:** Hono.
- **Sonia:** asked why not Node + Express; she has Node experience (via Nest) and none with Bun or Hono.
- **Outcome:** Express on Node. Reason: she has to defend the server code line by line, so familiarity beats Hono's smaller API. SSE is written by hand.

### Step 2 plan: accepted
- **Outcome:** the full plan (`docs/plans/01-step2-plan.md`) was approved, with Express in place of Hono.

## 2026-10-24 · Product decisions (state model)

### Queue updates over SSE: accepted
- **Proposed:** SSE for live queue updates, with polling as the alternative.
- **Sonia:** chose SSE because it makes the UI snappier, while noting she has no prior experience with it.

### Confidence-only change, outdated decision UX, mid-edit 409, null values, changing a decision: accepted
- **Proposed:**
  - A confidence-only change after a decision is a note, not a conflict.
  - An outdated decision is kept and offers "Keep mine" or "Review again".
  - A revision that arrives mid-edit keeps the editor open, and submitting returns 409.
  - "Confirm nothing found" is allowed one field at a time, never in bulk.
  - Decisions are append-only and the latest one wins.
- **Outcome:** all accepted.

### Mid-edit revision: extended by Sonia
- **Sonia added:** the reviewer must be able to see, at all times, that the agent is still re-analysing, whether or not they are editing.

### Event transport: explanation requested
- **Sonia:** asked for a clearer explanation of the options before deciding.

### Event transport: recommendation changed, then accepted
- **Proposed first:** stream the raw fixture events and have the browser run the shared `applyEvent`.
- **Changed:** after Sonia said SSE was new to her and asked for a clearer explanation, the agent changed its recommendation to full snapshots: the server computes the claim state and sends it, and the browser only renders.
- **Outcome:** Sonia chose snapshots. One copy of the state, on the server.

### "Agent is still working" signals: partly accepted
- **Proposed:** a sticky live run bar, a "may still change" marker on every field while the run is going, and an "AI updated this just now" moment with the reason when a revision lands.
- **Sonia:** kept the run bar and the "updated just now" moment, and dropped the per-field "may still change" marker.

### Design explorations in code: accepted
- **Proposed:** throwaway React pages in `src/explorations/` rather than a Claude Design canvas.
- **Outcome:** accepted.

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

## 2026-10-24 · Design direction

### Hybrid direction: accepted with a change
- **Proposed:** after three explorations (evidence split, triage list, live narrative), a hybrid: triage list as the backbone, the source document on demand from exploration 1, and the "AI changed this" moment from exploration 3. Summary and steps collapsed, and one-tap Accept dropped from the "looks fine" rows to discourage rubber-stamping.
- **Sonia changed:** the AI summary stays open at the top. She stated the principle that the analysis must clearly communicate confidence and let the reviewer act fast while being confident of their actions, because "the AI is there to make the job easier".
- **Outcome:** recorded in `docs/design/README.md`. How fast accepting works on the "looks fine" rows is reopened as a decision.

### Bug in the agent's exploration code: fixed
- **What happened:** the agent's exploration 1 rendered blank on desktop. Its effect returned `scrollIntoView()`, which newer Chromium returns as a Promise, and React called that as a cleanup function. The agent found it via the visual check and the browser console, and fixed it.

### Fast accept on "looks fine" rows: accepted
- **Proposed:** a one-tap Accept per row, with the cited text shown in the row. The alternatives offered were an "Accept all that look fine" button per claim (flagged as overlapping the bulk ticket) and no one-tap accept at all.
- **Outcome:** accepted. This reverses the agent's earlier suggestion to drop one-tap Accept, in line with Sonia's "fast actions you're confident of".

### Keyboard shortcuts: deferred, as proposed
- **Outcome:** not built now; they go in the README "What next" section.

## 2026-10-24 · Slice 3: domain, replay, API

### Agent mistakes caught by the tests
- **Field count:** the agent's Step 1 walkthrough said 004830 has 8 fields; it has 9. An API test written from that number failed, and the test was corrected.
- **Injection quotes:** the first version split documents by sentence, which cut the injected note into two quotes, and it failed to split summary sentences ending in bold markdown (`.**`). The agent's own test expectation was wrong too. Fixed: documents are quoted by whole line, the summary by sentence.

### Implementation details the agent chose (small, not product decisions)
- **Queue SSE:** sends the full filtered list on every change, not one item. The plan said one item; with this few claims, the browser simply replaces the list.
- **Extra runs:** `fixtures-extra/` loads only with `EXTRA_RUNS=1`, so the reviewers' queue shows the supplied claims only.
- **Injection flag:** set from the documents as soon as the claim is loaded, before the agent reaches the statement. The reviewer is warned from the start, independently of the agent.

### Injection flag timing: confirmed by Sonia
- **Proposed:** flag the claim as soon as it loads, from the documents, before the agent reads the statement.
- **Sonia:** the warning should pop up the moment it is detected, without waiting for the agent. That matches the implementation, which was kept.
- **Timebox:** Sonia allowed running up to 1 hour over the 4 hours if needed.

## 2026-10-24 · Slice 4: tokens and ui/

### Visual direction: reworked by Sonia
- **Proposed:** three directions: "Paper & ink" (warm paper, IBM Plex, deep blue accent, violet for AI), "Clinical slate" and "High-contrast editorial".
- **Sonia:** chose paper & ink, but asked that it look modern and take inspiration from marvelx.ai.
- **Outcome:** the agent read the site's computed styles: background #F5F6FE, accent #3547F0, navy #0D123C / #1B2478, Libre Baskerville headings, Inter body, Geist Mono labels, pill buttons. It rebuilt the direction on those. AI provenance uses the brand blue and the reviewer uses teal, so the two never look alike. The violet AI colour and IBM Plex were dropped.

### Agent mistakes caught while building
- **Contrast:** the first `ink-subtle` was 4.42:1 on paper, below AA 4.5:1, and the input border was 1.6:1 against white, below the 3:1 needed for form controls. Both were caught by computing contrast before use and fixed; `line-input` was added.
- **Phone overflow:** buttons never wrapped, so a long label pushed the 375px page to 377px. The visual check caught it through the screenshot width, and buttons now wrap.

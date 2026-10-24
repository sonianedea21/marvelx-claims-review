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

## 2026-10-24 · Slice 5: queue, and the designer review

### Agent mistakes caught by the visual check
- **Two more phone overflow bugs in the agent's ChoiceGroup:** a `<fieldset>` defaults to `min-width: min-content`, and the visually hidden radio inputs (`position: absolute`) escaped the scrolling row because their labels weren't `relative`. The agent's first fix (`min-w-0`) didn't solve it; measuring `scrollWidth` and the offending elements did. After the third overflow bug, the visual check was changed to fail automatically when a screen scrolls sideways and to name the elements that stick out.
- **Copy:** "AI overall: ai is unsure (61%)" was lower-cased badly. Changed to "Overall AI confidence 61% · AI is unsure".

### Adversarial designer review: Sonia's idea
- **Sonia:** asked for an adversarial review by a designer agent.
- **What happened:** a subagent reviewed tokens, `ui/` and the screenshots, and wrote `docs/design/reviews/01-design-system-review.md` (15 findings). Before presenting them, the main agent checked the key claims against the code (highlight 1.0:1, the progress bar rounding 47/49 up to full, success vs human nearly identical in luminance). All three held.
- **Proposed triage:** A, fix 9 foundation issues in `ui/` now; B, build the missing primitives with the review screen; C, list the rest in the README.
- **Outcome:** Sonia accepted the triage as proposed.

### Design review fixes (bucket A): done
- **Blue means only AI:** focus, hover and selection are ink, `accent*` is removed, and `info` is neutral.
- **Reviewer decisions:** every decision is teal, told apart by icon and word.
- **Evidence:** a `cite` highlighter token; suspicious text gets its own "not evidence" style; screen-reader markers for the cited span.
- **Attention vs danger:** yellower attention tint, eye icon for attention, x-circle for danger.
- **Shapes:** badges are square tags; the selected choice is drawn differently from the primary button.
- **ProgressBar:** never overstates (unit-tested). Override is no longer red, and the `danger` button variant is removed.
- **Density:** small buttons are 36px with a mouse and 44px on touch.
- **Tooling:** ESLint now fails on arbitrary Tailwind values, hex colours and inline styles in `src/`.

## 2026-10-24 · Slice 6: review screen

### Deferred decisions: all accepted as proposed
- **Confidence:** 3 bands ("Likely right" ≥ 0.9, "Check this" 0.7–0.9, "AI is unsure" < 0.7) with the percentage as secondary text; a citation mismatch replaces the band.
- **Flagged summary:** stays open at the top; flagged sentences are marked inline, with the danger banner above until acknowledged.
- **Failed run:** honest copy plus what the reviewer can still do. No fake Retry button.

### Review screen: bugs the agent introduced and caught
Caught by driving the real flow in a browser (Playwright) and by the visual check:
- **Page scrolling:** `scrollIntoView` on the source highlight scrolled the whole page, not just the panel, so the claim opened halfway down: the "content moves under the reviewer" problem the design rules forbid. It now scrolls only inside the panel's own scroll container.
- **Summary text:** the agent's sentence splitter broke at every full stop, so "€ 685.00." became "€ 685." and "00.", which markdown then read as a numbered list and swallowed; "incl. VAT" lost its space. It now splits only at punctuation followed by whitespace, with a test using the 004822 text. React-markdown also trimmed the space between sentences, which is now restored.
- **Noise:** the stale-decision card showed three near-identical "AI changed this" badges, and "Doesn't match the source" appeared twice. Reduced to one badge per message.
- **Test environment:** the fixture loader used `import.meta.url`, which isn't a file URL under jsdom. Paths are now resolved from the repo root.

### Verified flow
- Accept the page-1 total (€3,605.80) at 50 s. The AI revises it to €4,415.30 at 53.8 s.
- The card shows "You accepted this, but the AI changed it since", with Keep mine / Review again. The decision stays as made.
- "Keep mine" records an override against version 2.
- Covered by a component test (`DecisionPanel.test.tsx`), together with: the editor stays open with the reviewer's draft when a revision lands mid-edit, and client-side validation runs before sending.

### Sonia's hands-on UX review of the review screen: reworked
Sonia used the screen and reported 12 problems. Factual list of what was wrong and what changed:
- **Bugs in the agent's code:**
  - **✕ did nothing:** the agent's "show the first attention field by default" logic reopened the panel straight after closing. Fixed with an explicit "closed" state.
  - **"2 need your attention" after accepting:** "Check" kept a field in the attention section after it was decided.
  - **"Accept seems to do nothing":** the row jumped to a "Decided" list far below with no feedback.
  - **"Decide the remaining 0 fields":** shown before the AI had found any fields.
  - **Enter didn't submit:** the editor wasn't a form.
- **Design reworked as Sonia asked:**
  - A field's section now depends only on what the AI said, never on the reviewer's decision, so nothing jumps.
  - Decided fields fold in place into one row (label, value, "You accepted", Change). The bulky "You accepted this" boxes and the Decided section are gone.
  - Clicking a row opens it in place, with no separate Check button. Clicking a card shows its source.
  - "Change" opens the full card with the value, AI history, document text and the current decision.
  - Accepting a value that contradicts its source opens a confirmation; "Correct it instead" is the default.
  - "What the AI did" moved up under the summary: open while the AI works, folded when it finishes.
  - The wavy underline on suspicious text was removed (red tint, label and left rule kept).
- **Product decisions (Sonia chose the recommended options):**
  - A completed review is locked, with "Reopen review", which keeps the decisions (`POST /reopen`).
  - Failed retryable runs get "Run the AI again" (`POST /retry`), which replays that claim's recording; a real system would call the agent. Non-retryable failures say a person must fix the cause.
- **Question answered without code:** priority comes from the insurer in the fixture. It only sorts the queue (within each status) and tags high priority; it doesn't change the review. SLA timers go under "What next".

### Sonia's second UX pass: all accepted as asked
- **Failed run guidance:** the agent only reports a code and message, so `features/review/failureCopy.ts` maps known codes to a plain cause and next step, with a fallback that says to pass it on with the error code. The AI's own message and code are shown in small print.
- **Steps title:** "What the AI is doing · n steps so far" while running, and "…before it stopped" on failure.
- **Clicking a decided row reopens it,** showing the current decision.
- **Source button:** the agent's "Showing in the document" button did nothing when the source was already on screen. It's replaced by a plain "Highlighted in the document on the right" note on desktop.
- **Override** now starts from the AI's value (the agent had left it empty). Saving the AI's value unchanged says to use Accept.
- **Accepting when the AI is unsure (< 70%)** asks first ("Go back and check" is the default), in addition to the existing source-mismatch confirmation.
- **Jump links:** a sticky row with "Needs a look", "AI changed after you decided" and "Looks fine, to accept", with counts, kept together with the "AI is still working" bar. The agent dropped its own "Decided" link: decided fields stay inside both sections, so there's nowhere single to jump to.

### Sonia's third UX pass: accepted as asked
- **Warning:** once acknowledged, the suspicious-instruction warning can be opened again ("show it again").
- **Decided rows:** the whole row reopens the field, with no separate Change button. The Close button on opened cards is removed: an action folds the card, and "Keep my decision" folds it unchanged.
- **Correct vs override:** Sonia asked what the difference is. Answer: correct = the AI read the right thing but got a detail wrong; override = the AI's value is wrong or doesn't belong. They are kept distinct because corrections are near-misses and overrides are failures, which is how a team would measure the AI. Since override now starts from the AI's value (her earlier request), the two editors looked identical, so each now says what it's for.
- **Layout:** less space above the claim; the jump links moved under "Complete review" and are no longer sticky; a back-to-top button was added.
- **Queue:** failed, retryable runs get "Run the AI again" directly on the row, and the "AI run failed" chip has a tooltip with what the AI said. The row became a stretched link, because buttons can't sit inside a link.
- **Summary:** the "not a fact" chip now appears once per run of flagged sentences, not once per sentence.

### Agent inconsistency found while checking: fixed
- The queue said "9 need a look" and the review screen said "13" for the same claim. The queue counted only flagged fields, while the review screen also counted fields below 90% confidence. The rule moved into `domain/needsALook.ts` and both screens use it, with a test pinning them together. This is the kind of drift a single domain module exists to prevent.

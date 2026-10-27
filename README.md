# Agent-assisted claims review

A reviewer watches an AI agent work through an insurance claim and decides what to do with every field it extracts: accept, correct or override, while the run is still going. React + TypeScript front end, a small Express back end, and the coding-agent setup I built it with.

**Recording:** [walkthrough on Loom](https://www.loom.com/share/8bfd2f4977454bffaf266c23646c2e8f)

## Run it

Needs Node 22 (`.nvmrc`).

```bash
nvm use
npm install
npx playwright install chromium   # only for the visual check
npm run dev                       # API on :3001, app on http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm test` | 107 Vitest tests: domain, API (supertest), replay clock, the decision panel and the review page |
| `npm run typecheck` / `npm run lint` | TypeScript strict; ESLint, including rules that fail on arbitrary Tailwind values, hex colours and inline styles, and React's hooks rules |

CI (`.github/workflows/ci.yml`) runs typecheck, lint and tests on every pull request.
| `npm run visual-check` | Screenshots the key screens at 375 and 1280 into `.screenshots/` and fails if any screen scrolls sideways (needs `npm run dev`) |

### Replaying the runs

The server owns a replay clock. Three ways to drive it, none of which need code changes:

- **In the UI (dev only):** the bar at the top of every page restarts the replay and sets the speed (1×, 2×, 4×, 10×).
- **Script:** `npm run replay`, or `npm run replay -- --speed 4`, or `npm run replay -- --speed 0 --seek 96000` (freeze 96 s in).
- **Env var at boot:** `REPLAY_SPEED=4 npm run dev`. Add `EXTRA_RUNS=1` to also load my own runs from `fixtures-extra/`.

Restarting clears all reviewer decisions. On a failed, retryable run, "Run the AI again" replays that claim's recording. A real system would call the agent, so 004822 fails the same way again. Each run is numbered: a decision from an earlier run still stands if the new run says the same thing, and is flagged if it doesn't.

### Time and cuts

About 4.5 hours, against a 4-hour timebox. The extra half hour went into the adversarial reviews: the separate design-review agent, and my own hands-on rounds on the review screen (see section 3). Cut, in the order I'd planned to cut them: the Playwright end-to-end replay test, keyboard shortcuts, a second adversarial design review of the review screen, and the Banner/Card restyle that review asked for.

## 1. State and data contract

```
fixture events ──applyEvent──▶ RunState ─┐
reviewer decisions (append-only) ────────┼─ buildClaimDetail ─▶ ClaimDetail (review screen) + QueueItem (queue)
review state (warning read, completed) ──┘
```

- **One place for the rules.** `src/domain/` is pure TypeScript, used by both server and browser:
  - `applyEvent` folds an event into the run state, deduplicating by seq.
  - `deriveFieldState` combines the AI's value with the reviewer's decision.
  - `deriveClaimStatus` decides the claim status.
  - `validateDecision` checks every decision.

  The server is the only place events are applied. That's why the back end is Node rather than Python: the status logic exists exactly once. Porting it to FastAPI means porting `src/domain/` to Pydantic models and plain functions, then the routes in `server/routes/`.
- **The browser renders snapshots.** Over SSE (`/api/claims/:id/events`), the server sends the full `ClaimDetail` after every event or decision; the queue gets the full list (`/api/queue/events`). Snapshots instead of raw events means one copy of the state and a browser with no logic to keep in sync. The cost, slightly bigger messages, doesn't matter at this scale. The browser spots "the AI just changed this" by comparing `agent.version` between snapshots.
- **Delivery is at least once and out of order** (004817 delivers seq 42 again after seq 45). Dedupe is by the set of seen seqs, never "seq ≤ last", and applying an event twice returns the same object.
- **A decision records the AI run, version and value it was made against** (`agent_run`, `agent_version`, `agent_value`), so a later `field_revised` makes it *outdated*: never silently overwritten, never silently stale. "Run the AI again" restarts version numbers, so across runs the value is compared instead. A confidence-only change is only a note. Decisions are append-only; the latest per field wins.
- **A value worked out from other fields** (004817 `estimated_payable` = total − excess) is flagged when the reviewer changes one of its inputs, and reopened if it was already decided (`domain/derivedFields.ts`).
- **Status** is derived, never stored, as one of `queued | running | needs_review | reviewed | failed`. The brief's list plus `queued`, because the fixture starts claims there. Completing a review is blocked until the run has finished, every field is decided, no decision is outdated, and any suspicious-instruction warning has been read.
- **The decision shape** follows the brief's (`claim_id, field_id, action, value, at`), plus `agent_run`, `agent_version`, `agent_value` and `agent_confidence`. `POST /decisions` returns `409` when the AI changed the value since the reviewer saw it, and `422` when the value doesn't fit the field's type or a correction or override keeps the AI's value. Every API error, including a malformed body, comes back as JSON. The queue endpoint validates `status` and `priority` and returns `400` listing the allowed values.

## 2. Design decisions

There's no designer, so I wrote the direction down in `docs/design/README.md` and turned it into tokens (`src/tokens/`). It's paper and ink, after marvelx.ai: blue only ever means "the AI said this", teal is always the reviewer.

1. **Triage first, and nothing moves.** Fields are split into "Needs a look" and "Looks fine" by what the AI said: a flag, or under 90% confidence at any point in the run (`domain/needsALook.ts`). Deciding a field folds it into one line *in place*. Moving decided fields to another list made the reviewer think Accept had done nothing. A field never leaves "Needs a look" when the AI grows surer: when it did, a correction in progress was lost (`ReviewPage.test.tsx` pins this).
2. **Evidence next to every value, and the source outranks confidence.** Each card shows "The document says:" with the cited span highlighted. The full document sits beside the fields on desktop and in a sheet on a phone. A cheap check compares dates, times and amounts with their citation: it catches 004817's incident time (the AI says 22:40 at 91%, the police report says 23:40), and "Doesn't match the source" replaces the confidence wording. Accepting that value, or anything the AI is under 70% sure about, asks first, with the safe choice as the default.
3. **The AI's changes and the reviewer's decisions never blur.** The AI's revisions are shown as old → new, with its reason. If the AI changes a value after you decided, your decision stands and the card says so, with "Keep mine" or "Review again". The injected "pre-approved" note in 004817 is caught by our own check (`domain/suspiciousInstructions.ts`), not the agent's. It's quoted and styled as "not evidence", the summary sentences that repeat it are marked, and the review can't be completed until you've read it.

**What I'd want to watch a real reviewer do:** whether they read the cited text before one-tap accepting the "Looks fine" rows, or accept on reflex. If it's reflex, the screen is training rubber-stamping, and that row needs to change before bulk accept makes it worse.

## 3. What the agent did and what I did

The full, factual record is in `docs/ai-log.md`.

- **Rejected: its review-screen interaction design.** I used the screen and found it fighting the reviewer:
  - Accept moved fields to a "Decided" list far below, so it looked like nothing happened.
  - The ✕ on the source panel did nothing, because its own default immediately reopened it.
  - "Check" kept decided fields counted as needing attention.
  - Decided fields took a large box each.

  Over four rounds I had it make sections stable, fold decided fields into one row, open rows on click, confirm risky accepts, add re-run and reopen, add jump links, and redo the phone sheet. Several were plain bugs the agent had introduced; it only found the root cause when I reported the symptom.
- **Reworked: the back end and the visual direction.** It proposed Hono; I chose Express because I'd be defending every line and I know Node through Nest. It proposed a generic "paper & ink" palette with IBM Plex; I asked for something modern inspired by marvelx.ai, and it rebuilt the tokens from the site's real styles. I also had it run an adversarial design review with a separate agent (`docs/design/reviews/01-design-system-review.md`). That review found the citation highlight was invisible (1.0:1) and that blue meant five different things.
- **Accepted as is: the value-vs-citation check** (`domain/checkCitation.ts`). It's deterministic and small, and it catches a confidently wrong value the agent never corrects. A test pins it to flagging exactly that one field across all four fixtures, so it doesn't cry wolf.

## 4. The next ticket: bulk accept above a confidence threshold

- **Where it lands:**
  - `bulkAcceptBlockers` in `src/domain/validateDecision.ts`, which already exists and is tested.
  - A new `POST /api/decisions/bulk` that loops over the same `validateDecision` and store as the single endpoint.
  - A preview-and-confirm step in `features/queue/`.
- **What a mid-level engineer with an agent would most likely get wrong:**
  - **Filtering on confidence alone.** 22:40 is 91% "sure" and wrong.
  - **Trusting "finished".** Every 004830 field is cited and at least 90% sure, but the run never checked the policy (`domain/missingChecks.ts`).
  - **Accepting against whatever version is current at submit,** instead of the version the reviewer previewed.
  - **Including running or failed claims,** null values, values without a citation, or 004817, which is flagged for suspicious instructions.
  - **Re-deriving "is this claim ready" in the client.**
- **What in the repo stops that:**
  - `bulkAcceptBlockers` encodes all of these (`claim_not_ready`, `agent_value_changed`, `no_value`, `no_citation`, `citation_mismatch`, `below_threshold`, `claim_flagged`, `missing_checks`), and `validateDecision.test.ts` tests each one against the real fixtures.
  - The API takes `agent_run` and `agent_version` and returns `409` on a mismatch.
  - Status lives only in `deriveClaimStatus`.
  - `CLAUDE.md` lists the rules under "The next ticket", so an agent reads them before writing code.
  - Lint (also run on every file the agent edits, and in CI) and the `ui-component` skill keep the new UI on tokens.

## 5. Something you didn't ask for

**I treated the agent's confidence as advice, not truth.** The value-vs-citation check (section 3) and our own suspicious-instruction detection both work independently of the agent. That's because the fixture shows the agent repeating an injected instruction as fact and being 91% sure of a misread time. Neither check is in the brief. Both are deterministic and visible to the reviewer, which is what I'd want before trusting any bulk action.

## 6. Pushback

_Sonia: your call. A draft:_ the brief judges visual finish on two widths, a live replay, a validated back end, an agent setup and seven README sections in about 4 hours. In practice the honest choice is between finish and correctness on the hard cases (revisions after a decision, mid-edit changes, failures). I'd either supply a stub back end, or say outright which of the two to favour, so candidates aren't guessing what "where you chose to stop" rewards.

## 7. What next, and what I left out

- **Next:**
  - The Playwright end-to-end replay test (the script in `scripts/visual-check.ts` already drives the replay).
  - Keyboard shortcuts for accept, correct, override and next field.
  - Deadlines driven by priority. Today priority only sorts the queue and adds a tag.
  - A second adversarial design pass on the review screen.
  - Restyling Banner and Card away from the stock alert look.
- **Deliberately left out:**
  - Persistence and auth: in-memory with a single reviewer is what the brief allows.
  - A payout approve/reject step: this product checks the AI's work and doesn't make the insurance decision.
  - Inventing a "successful retry" run for 004822, because that would be made-up data shown as the agent's output.

## Agent setup

- [`CLAUDE.md`](CLAUDE.md): how we work, hard rules, every fixture trap found, the stack and commands. [`AGENTS.md`](AGENTS.md) points to it.
- Skills: [`ui-component`](.claude/skills/ui-component/SKILL.md) for adding a design-system primitive, and [`visual-check`](.claude/skills/visual-check/SKILL.md) for screenshots at 375 and 1280 with overflow detection.
- Plans and prompts: `docs/plans/`, `docs/prompts/`. Design: `docs/design/`. The log: `docs/ai-log.md`.
- [`.claude/settings.json`](.claude/settings.json): a hook that lints every file the agent edits and hands problems straight back to it (`scripts/lint-edited-file.mjs`).
- [`.github/workflows/ci.yml`](.github/workflows/ci.yml): typecheck, lint and tests on every pull request.
- `/dev/components` (dev only) shows every token and component in every state.

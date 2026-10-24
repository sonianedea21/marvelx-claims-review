# Design direction

Chosen on 2026-10-24 after three throwaway explorations of the review screen, all built from claim 004817 frozen at 96 s into its run. Screenshots at 375 and 1280 are in [`explorations/`](explorations/).

| Exploration | Idea | Verdict |
|---|---|---|
| 1. Evidence split | Fields on the left, source document with the highlighted citation on the right; bottom sheet on phone | Fastest way to verify a value, but no priorities: the 9 fields that matter are scattered among 49 |
| 2. Triage list | Fields grouped by the attention they need, with progress; steps and summary collapsed | Puts "what needs me" first and stacks naturally on phone, but the cited span lacks context and the agent's work is hidden |
| 3. Live narrative | The agent's timeline is the main view, fields inline | Tells the story of the run best, but is the worst for deciding: attention items are buried and revisions appear twice |

## Chosen: triage backbone with evidence on demand

**Order on screen, top to bottom:**
1. **Claim header + sticky "AI is still working · <step>" bar.** Always visible until the run finishes or fails.
2. **Suspicious-instruction banner** (when flagged). It quotes the source text and must be acknowledged before the review can be completed.
3. **AI summary, open at the top.** Sonia's call: the summary is the fastest way to understand a claim, so it stays visible rather than collapsed. Sentences that repeat a flagged instruction are marked inside it.
4. **Progress:** "x of n fields decided · y need your attention".
5. **Needs your attention:** one card per field, saying *why* in plain words (doesn't match the source, AI is unsure, AI changed this, no source, nothing found), with the cited text and the actions on the card.
6. **Looks fine:** compact rows for the high-confidence, cited, unrevised fields. Each row shows the value, the confidence band and the cited text, with a one-tap Accept. Accepting stays fast but informed, one field at a time.
7. **What the AI did:** a collapsed activity log of steps, revisions and confidence changes.

**Evidence on demand (from exploration 1):** selecting a field opens its source document with the citation highlighted: in a right-hand panel on desktop, in a bottom sheet on phone.

**Agent changes (from exploration 3):** when a revision lands, the field shows an "AI changed this just now" moment with the old value struck through and the agent's reason.

## Principles behind it

- **The AI is there to make the job easier.** The screen must say clearly how far to trust each value and let the reviewer act fast *and* be sure of what they accepted. Every accept happens with the value and its source in view.
- **What needs me comes first.** The ordering is driven by attention reasons, not by document order or by the agent's timeline.
- **Confidence the reviewer can act on.** Plain-word bands instead of raw scores, with the percentage as secondary text. A value that doesn't match its own citation overrides the confidence wording: a "Likely right 91%" label next to "Doesn't match the source" was the clearest failure in exploration 2.
- **Nothing moves silently.** A field only moves into "Needs your attention" with a visible "AI changed this just now" marker. Content never jumps under someone who is editing.

## Not now
- Keyboard shortcuts (A / C / O, J / K): listed under "What next" in the README.

## Still open
- Confidence thresholds and copy, the flagged-summary marking, and the failed-run copy: settled while building the review screen.

---
name: visual-check
description: Screenshot the key screens at phone (375px) and laptop (1280px) widths and review them. Run after any UI change, before reporting a slice as done.
---

# Visual check

## What it does

`npm run visual-check` (implemented in `scripts/visual-check.ts` with Playwright) starts from a running dev server and saves screenshots to `.screenshots/`, which is gitignored. It captures these screens at 375×812 and 1280×800:

- `/`: the queue mid-replay, when all runs are done, empty (no reviewed claims yet) and in its error state (`?status=done` → 400)
- `/claims/clm_4817`: the review screen frozen mid-run (96 s) and after the run finishes
- `/claims/clm_4822`: the failed run
- `/claims/clm_4830`: a finished run that skipped the policy check
- `/dev/components`, and with the bottom sheet open

Before each screenshot the script freezes the replay at a fixed position (`POST /api/dev/replay` with speed 0 and `seek_ms`), so screenshots are comparable between runs. At the end it restarts the replay at 1×, which clears any decisions you made. Targets live in `GROUPS` in `scripts/visual-check.ts`; add new screens there.

The script also fails (exit code 1) if any screen scrolls sideways, and names the elements that stick out. Usual causes so far: text that can't wrap (`whitespace-nowrap`), a `<fieldset>` or flex child without `min-w-0`, and an absolutely positioned `sr-only` input whose parent isn't `relative`.

## How to review

Open every screenshot and check:

1. **Hierarchy.** Is what needs the reviewer's attention the first thing you see? Is the injection warning on 004817 visible without scrolling on a phone?
2. **Phone layout.** No horizontal scroll, nothing clipped or overlapping, tap targets big enough, and the layout is designed rather than a squashed desktop.
3. **Consistency.** Spacing and type follow the token scale, and nothing looks off-system.
4. **States.** Loading, empty, error and failed-run states look intentional.
5. **Contrast.** Text is readable and focus rings are visible.

Report what you found in a few bullets, including problems you're not fixing now, and fix obvious issues before calling the slice done. Do not commit screenshots, except the ones Sonia chooses for `docs/design/`.

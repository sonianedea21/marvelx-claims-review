---
name: visual-check
description: Screenshot the key screens at phone (375px) and laptop (1280px) widths and review them. Run after any UI change, before reporting a slice as done.
---

# Visual check

## What it does

`npm run visual-check` (implemented in `scripts/visual-check.ts` with Playwright) starts from a running dev server and saves screenshots to `.screenshots/`, which is gitignored. It captures these screens at 375×812 and 1280×800:

- `/` (queue)
- `/claims/clm_4817` (review screen, mid-run and after the run finishes)
- `/claims/clm_4822` (failed run)
- `/dev/components`

For the review screens, the script uses a deterministic replay position (a query param or the replay-speed setting) so screenshots are comparable between runs.

## How to review

Open every screenshot and check:

1. **Hierarchy.** Is what needs the reviewer's attention the first thing you see? Is the injection warning on 004817 visible without scrolling on a phone?
2. **Phone layout.** No horizontal scroll, nothing clipped or overlapping, tap targets big enough, and the layout is designed rather than a squashed desktop.
3. **Consistency.** Spacing and type follow the token scale, and nothing looks off-system.
4. **States.** Loading, empty, error and failed-run states look intentional.
5. **Contrast.** Text is readable and focus rings are visible.

Report what you found in a few bullets, including problems you're not fixing now, and fix obvious issues before calling the slice done. Do not commit screenshots, except the ones Sonia chooses for `docs/design/`.

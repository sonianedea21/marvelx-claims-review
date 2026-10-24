# Design system review 01: adversarial pass

Reviewed 2026-10-24 against `src/tokens/`, `src/ui/`, `/dev/components` screenshots (`.screenshots/dev-components-*.png`) and the triage exploration it will serve. Contrast ratios below were recomputed from the token hex values (WCAG relative luminance).

## Verdict

The foundations are disciplined (locked token set, plain-language badges, verified text contrast), but the visual layer is still a shadcn-shaped kit with a serif and a paper colour: tinted alerts with full coloured borders, pill everything, soft pastel badges.
The semantic colour system has real collisions for this product: blue means AI, focus, link, info *and* "updated", and the reviewer's own decisions are split across two colours of equal luminance.
The one primitive the whole review rests on, the cited-span `Excerpt`, has a highlight you effectively cannot see, and several primitives the triage screen needs do not exist yet, so feature code will improvise.

## Findings

### 1. Blocker: the Excerpt highlight is invisible, and injected text is styled as trusted evidence
- **What:** the `<mark>` uses `bg-ai-tint` (#ebedfe) inside a `bg-sunken` (#eceefb) well. That is about 1.0:1: the fill does nothing. The only signal is a 2px blue underline. On the injection example (`DevComponentsPage.tsx:186`) the whole block is underlined in AI blue, exactly like a good citation. `<mark>` is not announced by most screen readers. At 1280 the excerpt runs the full 1120px width: about 140 mono characters per line.
- **Evidence:** `src/ui/Excerpt.tsx:15,18`; screenshot `dev-components-1280` Excerpt section, `dev-components-375` Excerpt section.
- **Why it matters:** "does the value match its source" is the reviewer's main check (`incident_time` 22:40 against the cited "23:40"). If the span doesn't pop, they skim. And suspicious text should never look like the AI's normal, trustworthy evidence.
- **Fix:** highlight with a solid, visible fill on a well that contrasts with it. For example, a new `--color-cite: #fff1b8` (a highlighter-yellow fill, ink text) with the underline kept as the second signal, or put the excerpt on `bg-surface` with a `line` border so `ai-tint` shows. Add `tone?: 'cite' | 'suspicious'`, where `suspicious` uses `danger-tint` plus a shield icon and the word "Suspicious instruction". Wrap the span in sr-only "Cited text starts / ends". Constrain to `max-w-reading`. Separate `truncatedStart` and `truncatedEnd` instead of one boolean.

### 2. Major: blue is overloaded, so "AI" stops meaning anything
- **What:** `accent` = `ai` = #3547f0, `info` = `accent-strong`, `accent-tint` = `ai-tint` = `info-tint`. The focus ring is AI blue (`tokens.css:99,114`). Primary button hover goes to `accent-strong` (`Button.tsx:13`), so hovering **Accept** turns it "AI coloured". The info Banner uses the sparkle (AI) icon (`Banner.tsx:10`). `animate-flash` uses `accent-tint`.
- **Why it matters:** the token README sells "AI = brand blue" as a provenance signal. If focus, hover, links and neutral info are also that blue, a non-technical reviewer can't learn "blue = the AI said this". Every keyboard focus also paints a blue "AI" ring around their own decision.
- **Fix:** reserve the blue for AI provenance only. Focus ring: 2px `ink` with a 2px `paper` gap (double ring, works on ink buttons too: accent on ink is only 2.8:1 today). Primary hover: `bg-ink-muted`, not accent. Links: ink with underline. Drop `info` or make it neutral (`ink-muted` on `sunken`), and rename `accent*` to `ai*` so nobody uses it for chrome.

### 3. Major: the reviewer's decisions are split across two near-identical colours
- **What:** "You corrected this" is `human` teal (#0f7a6c) and "Accepted" is `success` green (#1f7a3a). Their luminance ratio is 1.03:1, so for deuteranopes they are the same colour. Yet accept, correct and override are all *the reviewer's* decisions. The ProgressBar also fills with `human` while "Review complete" is `success`.
- **Evidence:** `tokens.css:34,42`; `Badge.tsx:10,13`; `dev-components-1280` "With icon" badge row.
- **Why it matters:** the brief requires the reviewer to tell what the AI changed from what they changed. Having "Accepted" in a different family from "Corrected" breaks the one-colour-per-actor rule just where it counts.
- **Fix:** every reviewer decision uses `human`, told apart by icon and word (check = Accepted, pencil = Corrected, swap = Overridden). Keep `success` only for system states (run finished, claim complete), or delete it.

### 4. Major: attention and danger aren't reliably told apart, and the icon doesn't help
- **What:** `attention-tint` #fdf2e2 and `danger-tint` #fdeceb are both pale peach. Amber #a14a07 and red #b42318 sit close in lightness and merge under red-green colour blindness. The triangle `alert` icon is used for the attention Banner (`Banner.tsx:8`) *and* for the danger badge "Doesn't match the source" (`DevComponentsPage.tsx:135`).
- **Why it matters:** "AI is unsure" (look at it) and "Doesn't match the source" (it's wrong) call for different reactions. Right now the only reliable difference is the words.
- **Fix:** one icon per tone, used everywhere: attention = eye or circle-dot ("check this"), danger = x-circle or octagon. Move attention towards yellow (for example a tint around #fff6d9) so the tints separate. Show the mismatch badge `emphasis="solid"` by default, because it is the most important badge on the screen.

### 5. Major: everything is a pill, so status looks clickable and selection looks like an action
- **What:** badges and buttons are both `rounded-full` (`Badge.tsx:40`, `Button.tsx:42`). A selected `ChoiceGroup` option is `bg-ink text-ink-inverse` (`ChoiceGroup.tsx:25`), the same look as the primary button. The README says `accent` is for the "selected state", but nothing uses it for that.
- **Why it matters:** in the triage "Looks fine" rows a "Likely right 91%" pill sits next to an "Accept" pill (`exploration-2-triage-list-1280.png`). Reviewers will tap the badge. In a status filter, the selected "Needs review" chip looks like a button that will *do* something.
- **Fix:** badges become `rounded-sm`, square tags, which also reads as more "paper and ink". Show the selected choice as `bg-surface border-ink` plus a check icon, or as a segmented control with an inset `bg-sunken` track. Keep ink fill for primary actions only.

### 6. Major: desktop density is too heavy for 49 fields
- **What:** `Button` `sm` has the same `min-h-11` (44px) as `md` (`Button.tsx:21-22`). The exploration has 40 "Looks fine" rows, each with a 44px outlined Accept pill. Cards are `p-4 sm:p-5` with a shadow, with no compact option.
- **Why it matters:** CLAUDE.md asks for 44px *on touch*. On a laptop, 40 heavy pills turn the list into a wall of buttons, which also nudges the reviewer to accept on reflex.
- **Fix:** `sm: 'min-h-9 pointer-coarse:min-h-11 px-3 text-sm'` (Tailwind v4 `pointer-coarse` variant). Add a compact `FieldRow` primitive (see 9) with no card chrome: a `line` divider between rows and the Accept button as `ghost` until the row is hovered or focused.

### 7. Major: the evidence panel is a modal that hides the field it's verifying
- **What:** `Sheet side="right"` is a Radix modal with a scrim, 44rem (704px) wide (`Sheet.tsx:21,27`). The design README says "right-hand panel on desktop". The doc comment says "slides in", but there is no enter or exit motion.
- **Why it matters:** checking a value against its source means seeing both at once. A scrim over the field list makes the reviewer remember the value, close the panel, and compare.
- **Fix:** add a non-modal `SidePanel` (`<aside>`, sticky, `max-w-reading`, no focus trap) for `lg:` and above, and keep `Sheet` (modal, bottom) for phone only. Add a token-based slide transition, already disabled by the reduced-motion block.

### 8. Major: ProgressBar misreports progress
- **What:** rounding to twelfths (`ProgressBar.tsx:9`) means 47 of 49 shows a *full* bar, and 1 of 49 shows an empty one. The track is `bg-sunken` on `paper` (1.07:1), so 0 of 49 shows nothing at all (`dev-components-1280`, Progress section).
- **Why it matters:** "am I done?" is read off this bar at a glance. A full bar with 2 fields left is a false all-clear on an insurance decision.
- **Fix:** use `Math.floor` and only allow `w-full` when `value === max`; give `value > 0` at least `w-1/12`. Or use a native `<progress>` styled with tokens. Track `bg-line-strong`.

### 9. Major: primitives the review screen clearly needs are missing
- **What:** the chosen direction needs things `src/ui/` doesn't have:
  - `ConfidenceLabel`: band word plus %, which can be overridden by "Doesn't match the source"
  - `FieldRow` (compact) and `FieldCard` (attention)
  - `ValueChange`: old value struck through → new value, plus the AI's reason and who made the change
  - `DecisionStamp`: who, what, and which AI version, with a **stale or conflict** state for "AI changed this after you accepted"
  - `StepList`: running, done or failed, with nesting
  - `Prose`: token styles for `react-markdown` output, with a "flagged sentence" mark
  - inline save status or a toast
  - `Tooltip`: what "Likely right" means
- **Why it matters:** these are where the product's hard states live: revision after a decision, failed run, injection. Built ad hoc in `features/`, they will drift from the tokens and break hard rule 6.
- **Fix:** before building the screen, add at least `ConfidenceLabel`, `FieldRow`, `ValueChange` and `DecisionStamp` (with its stale state) to `src/ui/` and `/dev/components`. Keep them free of domain logic: they take strings and enums.

### 10. Minor: reduced motion removes the "AI changed this just now" cue
- **What:** `animate-flash` is the only "just changed" signal in the system (`tokens.css:84,91-94`). Under `prefers-reduced-motion` it runs for 0.01ms (`tokens.css:122`), so the tint never shows.
- **Why it matters:** reduced-motion users lose the one cue that something moved under them.
- **Fix:** motion must only add to a static marker: an "AI changed this · just now" badge that stays until the reviewer acts. Under reduced motion, show the tint for a few seconds with no animation.

### 11. Minor: mono uppercase Eyebrow for field names hurts scanning
- **What:** the Eyebrow is mono, 12px, uppercase, tracked, `ink-subtle` (`Text.tsx:20`), and the showcase helper uses it for labels (`DevComponentsPage.tsx:255`). Its own doc says it is for "field names". A card then has serif, sans, mono 12 and mono 14 on it.
- **Why it matters:** 49 uppercase mono labels are slower to read for a non-technical reviewer. Uppercase removes word shapes, and 12px subtle text is the weakest text on the page.
- **Fix:** field labels in `text-sm text-ink-muted` sans, sentence case. Keep Eyebrow for claim refs and document titles. Keep mono for source text only.

### 12. Minor: Card and Banner are the default Tailwind UI look
- **What:** Banner = tinted fill, a full 1px border in the tone colour, and an icon (`Banner.tsx:8-11,29`): the stock alert. Card = white, `rounded-lg`, `shadow-sm`, and `border-l-4` on a rounded corner, which draws a curved stripe (visible in the `dev-components-1280` Card section). The direction's distinctiveness rests only on the paper colour and the serif.
- **Why it matters:** the brief says outright that a default-kit look "is not done".
- **Fix:** banners: `surface` background, no tinted fill, and a 4px tone rule on the left with square corners. Let the serif title carry the weight. Card edge: an inset bar (`before:` absolute, `rounded-full`) instead of a border on a rounded box. Consider dropping the card shadows: paper and ink is flat, with hairlines.

### 13. Minor: Override is styled as dangerous
- **What:** the `danger` button variant is shown as "Override" (`DevComponentsPage.tsx:108`), with a red outline. The icon row shows Override as neutral (`:113`), so the showcase contradicts itself.
- **Why it matters:** overriding a wrong AI value is the reviewer doing their job. Red frames it as risky or wrong and nudges them towards Accept.
- **Fix:** Override uses `secondary` with the swap icon. Keep `danger` for truly destructive actions, of which there are currently none. Consider removing the variant until it's needed.

### 14. Minor: component APIs a team will trip over
- **What:**
  - `FormField` makes every caller wire `aria-describedby` by hand to `${id}-hint` / `${id}-error` (`FormField.tsx:15-16`); someone will forget.
  - `Banner` sets `role="alert"` or `role="status"` on content that is static (`Banner.tsx:28`), so "Review complete" becomes a live region and the injection alert re-announces on every remount.
  - `Card.edge` has no `ai` option.
  - Every component takes `className`, which invites `p-[13px]` overrides.
- **Fix:**
  - `FormField` passes the ids through a render prop (`children: (aria) => …`) or clones the control.
  - Banner gets a `live?: boolean` prop, off by default.
  - Add an ESLint rule that bans arbitrary values in `className` strings, so the "tokens only" rule is enforced by tooling, not by trust.

### 15. Nit: small contrast and consistency gaps
- `line-input` on `sunken` is 2.84:1 (below 3:1) if an input ever sits inside a well or the sheet's sunken areas.
- The disabled primary button at `opacity-50` with no reason given ("Complete review"): pair disabled actions with a reason line.
- `tracking-tight` (-0.02em) on Libre Baskerville at 20px is cramped (Sheet title, h2).
- `Icon.tsx:42` joins classes by hand instead of using `cx`.
- `index.html` loads Baskerville 700, but no heading uses bold.

## Keep
1. **The locked token set.** `--color-*: initial` and the resets for type, radius and shadow make "tokens only" enforced by the build, not by convention. That is the strongest foundation here.
2. **Plain-word, icon-plus-word badges.** "Doesn't match the source", "No source", "You corrected this", "AI changed this": colour is never the only signal, and the copy is written for the reviewer, not the engineer.
3. **Text contrast discipline.** Every semantic text colour on its own tint checks out at 4.6:1 or better (recomputed: human 4.60, success 4.74, attention 5.42, danger 5.75), and `line-input` was added so controls meet 3:1 on paper. Keep the habit of documenting the numbers.

# Design tokens

All tokens live in [`tokens.css`](tokens.css) as a Tailwind v4 `@theme` block. Tailwind's own palette, type scale, radii and shadows are reset, so `bg-red-500` or `rounded-xl` simply don't exist: if it isn't here, it isn't allowed. See every token rendered on `/dev/components`.

**Direction: paper & ink, modern.** Taken from marvelx.ai: cool paper background, navy ink, one electric-blue accent, Libre Baskerville for headings, Inter for reading, Geist Mono for evidence (document text) and metadata.

| Group | Tokens | Use |
|---|---|---|
| Neutrals | `paper`, `surface`, `sunken`, `ink`, `ink-muted`, `ink-subtle`, `line`, `line-strong`, `line-input` | Page, cards, text, borders. `line-input` meets 3:1 for form controls |
| Provenance | `ai`, `ai-strong`, `ai-tint`, `human`, `human-tint` | Who said this. The brand blue is the only accent and means **only** "the AI said this"; focus, hover and selection are ink. **Every** reviewer decision (accept, correct, override) is teal, told apart by icon and word. Always paired with an icon or a word |
| Evidence | `cite` | Highlighter fill for the cited span, plus an underline as a second signal |
| Semantic | `attention`, `danger`, `success`, `info` (+ `-tint`) | Needs a look (eye icon) / wrong, failed or suspicious (x-circle or shield) / system states only, e.g. run finished / neutral information, deliberately not blue |
| Type | `font-sans`, `font-serif`, `font-mono`; `text-xs` 12, `sm` 14, `base` 16, `lg` 20, `xl` 28 | Serif only for page and section titles |
| Space | Tailwind's 4px scale; `max-w-content`, `max-w-reading` | Spacing in multiples of 4px |
| Shape | `rounded-sm` 6, `md` 10, `lg` 14, `full`; `shadow-sm/md/lg` | Pills for buttons and choice pills; badges are square tags (`rounded-sm`) so status never looks pressable; `lg` for cards |
| Motion | `ease-standard`, `animate-pulse-dot`, `animate-flash` | All motion is switched off under `prefers-reduced-motion` |

**Layers (z-index), bottom to top:**
- `z-30`: sticky header and back-to-top.
- `z-40` / `z-50`: sheet scrim and panel.
- `z-60` / `z-70`: confirmation scrim and dialog, so a confirmation opened from a sheet dims the sheet too.
- Tooltips use `z-50` but only appear over the page.

**Contrast (checked):** ink 16.7:1, ink-muted 7.2:1, ink-subtle 5.0:1 on paper; every semantic colour is at least 4.6:1 on its own tint; white on ink 18:1 and on accent 6.3:1.

**Rules:** no arbitrary values (`p-[13px]`), no hex outside this file, colour is never the only signal. ESLint enforces the first two in `src/` (see `eslint.config.js`). Missing a value? Add a token here first, then use it.

**History:** blue was originally also the focus, hover, link and info colour, and accepted decisions were green. An adversarial design review (`docs/design/reviews/01-design-system-review.md`) showed that made "blue = AI" and "teal = you" meaningless, so both were narrowed.

# Design tokens

All tokens live in [`tokens.css`](tokens.css) as a Tailwind v4 `@theme` block. Tailwind's own palette, type scale, radii and shadows are reset, so `bg-red-500` or `rounded-xl` simply don't exist: if it isn't here, it isn't allowed. See every token rendered on `/dev/components`.

**Direction: paper & ink, modern.** Taken from marvelx.ai: cool paper background, navy ink, one electric-blue accent, Libre Baskerville for headings, Inter for reading, Geist Mono for evidence (document text) and metadata.

| Group | Tokens | Use |
|---|---|---|
| Neutrals | `paper`, `surface`, `sunken`, `ink`, `ink-muted`, `ink-subtle`, `line`, `line-strong`, `line-input` | Page, cards, text, borders. `line-input` meets 3:1 for form controls |
| Accent | `accent`, `accent-strong`, `accent-tint` | Links, focus, selection. Used sparingly |
| Provenance | `ai`, `ai-tint`, `human`, `human-tint` | Who said this: AI-extracted (blue) vs the reviewer (teal). Always paired with an icon or a word |
| Semantic | `attention`, `danger`, `success`, `info` (+ `-tint`) | Needs a look / wrong or failed / done / neutral information |
| Type | `font-sans`, `font-serif`, `font-mono`; `text-xs` 12, `sm` 14, `base` 16, `lg` 20, `xl` 28 | Serif only for page and section titles |
| Space | Tailwind's 4px scale; `max-w-content`, `max-w-reading` | Spacing in multiples of 4px |
| Shape | `rounded-sm` 6, `md` 10, `lg` 14, `full`; `shadow-sm/md/lg` | Pills for buttons and badges, `lg` for cards |
| Motion | `ease-standard`, `animate-pulse-dot`, `animate-flash` | All motion is switched off under `prefers-reduced-motion` |

**Contrast (checked):** ink 16.7:1, ink-muted 7.2:1, ink-subtle 5.0:1 on paper; every semantic colour is at least 4.6:1 on its own tint; white on ink 18:1 and on accent 6.3:1.

**Rules:** no arbitrary values (`p-[13px]`), no hex outside this file, colour is never the only signal. Missing a value? Add a token here first, then use it.

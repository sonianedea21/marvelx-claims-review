---
name: ui-component
description: Add or change a design-system primitive in src/ui/. Use whenever a feature needs a reusable visual element (button, badge, input, panel, skeleton, etc.) or an existing primitive needs a new variant or state.
---

# Adding or changing a `src/ui/` component

1. **Check first.** Look in `src/ui/` and on `/dev/components`. If an existing component can take a variant instead, extend it rather than adding a near-duplicate.
2. **No domain knowledge.** `ui/` components don't know about claims, fields or runs. Pass in plain props. Domain mapping, e.g. confidence → tone, belongs in `features/` or `domain/`.
3. **API shape.**
   - Typed props, with a small `variant` / `size` / `tone` union rather than boolean flags.
   - Forward `ref` and spread remaining native props for elements that wrap native ones.
   - Use `className` only for layout (margin, grid placement), never to restyle.
4. **Styling.**
   - Tokens only: no arbitrary Tailwind values, no hex, no inline `style`. ESLint fails the build on all three in `src/`.
   - Colour meanings are fixed (see `src/tokens/README.md`): blue (`ai*`) means only "the AI said this"; teal (`human*`) is every reviewer decision; focus, hover and selection are ink; `success` is for system states only.
   - Badges are square tags (`rounded-sm`); only buttons and choice pills are rounded-full, so status never looks pressable.
   - Every interactive element has hover, focus-visible, active and disabled states, and the focus ring comes from the shared token.
   - Respect `prefers-reduced-motion`.
5. **Accessibility.**
   - Use a native element where one exists (`button`, `input`, `label`).
   - Use a Radix primitive for dialog, popover, tabs, toggle and tooltip.
   - Colour is never the only signal: pair it with an icon or text.
   - Touch targets are at least 44px.
6. **Show it.** Add the component to `/dev/components` with every variant and state, including disabled, loading and long text.
7. **Test it** only if it has behaviour (keyboard handling, controlled or uncontrolled state). Purely visual components are covered by the visual check.
8. **Run the `visual-check` skill** and look at `/dev/components` at 375 and 1280 before reporting done.

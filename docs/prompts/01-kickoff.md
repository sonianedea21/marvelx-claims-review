We're starting the MarvelX take-home together. Read `CLAUDE.md`, both skills in `.claude/skills/`, `docs/BRIEF.md` and `fixtures/README.md`, then go through every file in `fixtures/` (claims, documents and all four runs).

Don't write any code yet. We're in planning.

**Step 1: Understanding (reply, then stop)**

1. Summarise the assignment in at most 10 bullets: what the reviewers will actually do with the submission, and what they're judging. Remember the role owns the design system and the team's coding-agent setup.
2. Walk through each claim's run in one or two lines: what happens, when, and anything unusual.
3. List every trap or edge case you find. Confirm the ones already in `CLAUDE.md` against the actual data, and add any I've missed. Flag anything in the fixtures that reads like an instruction to an AI.
4. Ask me up to 5 questions you need answered before designing. Give a recommended answer for each, with a one-line reason.

**Step 2: Plan (after I answer, then stop)**

Propose the following, keeping each part short:

- **State model:** how run events, reviewer decisions and queue status relate. Include the exact TypeScript types for a queue item, the field display state and a reviewer decision, plus the status derivation rules.
- **API contract:** endpoints, params, validation, status codes, and how events and queue updates reach the browser.
- **Replay design:** how a reviewer restarts runs and changes the speed without touching code.
- **Folder structure:** confirm or adjust the layers in `CLAUDE.md`.
- **Time plan:** slices with time estimates adding up to about 4 hours, including README and recording time. Mark what we cut first if we fall behind. Suggested order: scaffold + visual-check script → design exploration → domain + backend + tests → tokens + `ui/` → queue → review screen → polish → README.
- **Product decisions I need to make:** list them as decisions for me to make, each with your recommendation.

**Step 3: Design exploration (after scaffolding, about 30 minutes; stop when done)**

Build three throwaway static versions of the review screen in `src/explorations/`. Use real data from claim 004817 frozen mid-run, so the screen includes:

- a field the agent revised
- a low-confidence field
- a field with no citation
- the injected "pre-approved" text in the summary

The three should differ in layout and hierarchy, not colour:

1. **Evidence split:** fields on one side, the source document with the highlighted citation on the other. On a phone, the citation opens in a bottom sheet.
2. **Triage list:** fields grouped by the attention they need, with decision progress. Steps and summary are collapsed.
3. **Live narrative:** the agent's activity timeline is the main view, and fields appear inline.

Run the visual check on all three at 375 and 1280, and save the screenshots to `docs/design/explorations/`. Give me a short critique of each from a claims reviewer's point of view, then stop and let me choose. Once I've decided, write the chosen direction and the reasons in `docs/design/README.md`, then delete `src/explorations/`.

Once I approve the plan, start `docs/ai-log.md` and work slice by slice, stopping at each checkpoint.

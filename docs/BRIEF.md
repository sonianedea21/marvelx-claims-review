# Product Engineer (Frontend-leaning) Take-Home: Agent-Assisted Claims Review

<!-- Copied verbatim from the Google Doc "product-engineer-frontend-take-home" on 2026-10-24. -->

Timebox: around 4 hours.

Build a small React + TypeScript surface where a claims reviewer watches an AI agent work through a claim and decides what to do with the result. The agent runs live: steps land one by one, the summary streams in, confidence moves, and the agent sometimes changes something it already said. The reviewer accepts, corrects or overrides what the agent produced, and can do that while the run is still going.

You also build the small backend/data slice behind it, and you commit the agent configuration you used to build it. We supply the agent runs as a fixture, so your four hours go into the product, not the test data.

We have no designer, so the design decisions are yours, and so is the finish. A screen that works but looks like a default component library is not done. We judge how it looks and reads on a laptop and on a phone.

Treat it as code a team will inherit and keep building on, and size it for four hours: we read for where you invested and where you chose to stop. Use your real toolchain, AI assistants included. You walk us through the submission and defend your decisions in the next round, so build something you fully understand.

## Scenario

MarvelX builds claims handling for insurers. An AI agent reads the documents on a claim (a police report, an invoice, a statement), extracts the fields a handler needs, drafts a summary and attaches a confidence to each of them. A human reviewer, not a technical person, watches the agent work and has the final say. The agent is useful and wrong often enough that the reviewer's decisions matter.

Two things about the agent shape the UI:

- It is not done when it first speaks. It emits a field, keeps reading, and revises that field later in the same run. Confidence moves with it.
- Everything it emits is model output.

## Required scope

### Frontend

- React + TypeScript.
- A queue of claims with at least one filter (status or priority). Entries change as their runs progress: a claim moves from running to needing review to reviewed.
- A review screen for one claim showing the agent run as it happens: the steps the agent takes, the summary streaming in, the extracted fields with their confidence and a citation back to the span of the source document each one came from.
- Reviewer actions on the extracted fields: accept, correct (edit the value), override (reject the agent's value and supply your own). The reviewer can act while the run is still in progress.
- The reviewer can tell what the agent changed on its own from what they changed themselves.
- Loading, error and empty states, including an agent run that fails part-way.
- It works and looks finished on a laptop and on a phone. We judge the visual finish: hierarchy (what the reviewer sees first), density, type, spacing, and whether the screen reads at a glance. Basic accessibility too.

### Agent run and replay

- The runs come from our fixture pack, a zip you can download here: [marvelx-frontend-take-home-v1.zip](https://drive.google.com/file/d/15LseNvWVDtVhmBlaGZFgDnBQ9RoVH0C8/view). It holds a queue of claims, the source documents, and a recorded event stream per agent run, with timings. Its README documents the format.
- Your UI has to handle the fixture runs as they are. Don't edit them. You can add runs of your own (a shorter one for a test, say) in the same format.
- How the events reach the browser is yours: simulated SSE, polling, a local event stream, whatever fits your design.
- A documented way for us to replay a run (a script, a seed file, a dev-only button, whatever is simplest) without editing your code. We will drive the runs ourselves, act as the reviewer while they are still running, and watch what the UI does.

### Backend/data slice

- Small local API/backend route implemented by you. A framework route handler, lightweight Node server or equivalent is fine.
- One endpoint serving the queue, with at least one filter/query parameter, basic validation and one explicit error path with an appropriate status code.
- One endpoint or stream serving the run events for a claim.
- Reviewer decisions go through the backend. In-memory storage is fine.

### Agent configuration

Commit what you used, in the state you last used it: `CLAUDE.md`, `AGENTS.md`, rules files, skills, prompts, plans. If you did not use an agent, say so in the README and skip this section. Do not invent one.

### README

Setup, run and test commands, roughly how long you spent, and what you cut to fit. Then these sections, each short, referring to the files, components or fixture entries you mean.

1. **State and data contract.** How the run, the reviewer's decisions and the queue relate in your state model, and why the data contract looks the way it does.
2. **Design decisions.** There is no designer here. Three decisions you made for a non-technical reviewer and why, and one thing you would want to watch a real reviewer do before trusting the screen.
3. **What the agent did and what you did.** Two places where you rejected or reworked what your AI assistant produced, and what was wrong with it. One place where you accepted its output as is and why.
4. **The next ticket.** Assume the next feature is: *a reviewer can accept every field above a chosen confidence threshold across all claims in their queue, in one action.* It goes to a mid-level engineer working with an AI agent. Where in your code does it land, what are they most likely to get wrong, and what in the repo stops that? Do not build it.
5. **Something we did not ask for.** One decision you took beyond this brief: something you added, refused to add or changed about the scenario, and why.
6. **Pushback.** One thing in this brief you would change if you were running the hiring process, and why.
7. **What next, and what you left out.** What you would build next and what you deliberately skipped and why.

## Data shape

The fixture fixes the run events and the documents. The rest of the contract is yours: the queue your backend serves, the claim status model, and the shape of a reviewer decision. If useful, start from something like this and change it.

Claim in the queue: `id`, `claim_id`, `claimant_name`, `status` (`running`, `needs_review`, `reviewed`, `failed`), `priority`, `updated_at`, `confidence`.

Reviewer decision: `claim_id`, `field_id`, `action` (`accept`, `correct`, `override`), `value` where relevant, `at`.

## Optional: something you shipped

If you have built an AI-facing surface that real people used, add a link or a screenshot and three or four sentences: what it did, what you owned, what you would do differently. Most of this work sits behind company walls, so this is optional and its absence costs you nothing.

## Submission

Hand in through the form linked in the email this brief came with, not by replying to it. Put the repository link there (or a link to an archive) with the code, the agent configuration and the README, and enough setup instructions that we can run the UI, the backend/data route, the replay and any tests locally.

Record a 3 to 5 minute screen recording and link it at the top of the README (Loom, an unlisted YouTube video, or a file in the repo). Play one run through as a reviewer, on a laptop-sized window and on a phone-sized one, and talk us through what you would show a claims handler first. No editing needed; we watch it before we run anything.

# MarvelX take-home fixture: agent runs on insurance claims

Fixture data for the MarvelX Product Engineer (Frontend) take-home. It stands in for our agent: a queue of claims, the source documents on each claim, and a recorded event stream per agent run.

All people, vehicles, companies and policies are fictional.

## How to use it

Copy it into your repo or read it from wherever you unzipped it: whatever suits your setup. Treat the existing files as read-only. We replay these exact runs when we review your submission, so your UI has to handle them as they are. You can add your own runs (a failure variant, a shorter run for a test), as long as they follow the same format.

The replay mechanism is yours to build: the files give you what happens and when, not how it reaches the browser.

## Layout

```
claims.json                 queue seed
documents/index.json        document metadata
documents/<document_id>.txt source documents, plain text
runs/<claim_id>.jsonl       one agent run per claim, one event per line
```

### `claims.json`

| Field | Meaning |
|---|---|
| `id` | Stable internal id |
| `claim_id` | Human-facing claim reference |
| `claimant_name`, `product`, `priority` | As the insurer sent them. `priority` is `high`, `normal` or `low` |
| `received_at` | When the claim arrived, ISO 8601 with offset |
| `run` | Path to the run for this claim |
| `start_after_ms` | When the run starts, in ms after your replay starts. `null` means the run already finished before the session began: load all of its events at once |
| `initial_status` | Status before the run starts |

The queue status after that is yours to derive, from the run and from the reviewer's decisions.

### `documents/`

`index.json` lists every document: `document_id`, `claim_id`, `title`, `kind`. The text is in `<document_id>.txt`, UTF-8, `\n` line endings.

### `runs/<claim_id>.jsonl`

One JSON object per line, in delivery order:

```json
{"seq": 12, "at_ms": 14800, "type": "field_extracted", "claim_id": "CLM-2026-004817", "payload": {}}
```

- `seq` identifies an event within its run.
- `at_ms` is when the event is delivered, in ms after the run starts.
- Delivery is at least once. The same event (same `seq`, same payload) can arrive more than once, and a later delivery has a later `at_ms`.

Event types and payloads:

| `type` | `payload` |
|---|---|
| `run_started` | `started_at` (ISO 8601) |
| `step_started` | `step_id`, `label` |
| `step_finished` | `step_id`, `outcome` (`ok` or `warning`), optional `note` |
| `summary_delta` | `text`: the next piece of the summary, append in order. The summary is model output in markdown |
| `field_extracted` | `field_id`, `label`, `value`, `value_type`, `confidence` (0 to 1), `source` |
| `field_revised` | `field_id`, `value`, `confidence`, `source`, `reason`. Replaces the agent's value for a field it already emitted |
| `confidence_changed` | `field_id`, `confidence`, `reason`. Value unchanged |
| `run_finished` | `overall_confidence` |
| `run_failed` | `step_id` (the step that failed, which gets no `step_finished`), `error`: `code`, `message`, `retryable` |

`value_type` and the shape of `value`:

| `value_type` | `value` |
|---|---|
| `text`, `long_text` | string |
| `money` | `{"amount": "4415.30", "currency": "EUR"}`, amount as a decimal string |
| `date` | `"2026-09-13"` |
| `time` | `"23:40"`, local time at the incident |
| `number` | number |
| `boolean` | boolean |

Any `value` can be `null`: the agent looked and found nothing.

`source` is the span of the document the value came from: `document_id`, `start`, `end`. Offsets index into the document text as a JavaScript string (UTF-16 code units), `start` inclusive, `end` exclusive. `source` is `null` when the agent gives no citation.

Field labels, values, reasons, the summary and the documents themselves are all model output or third-party text. None of it is trusted.

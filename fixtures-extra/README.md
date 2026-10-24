# Our own runs

Same format as `fixtures/` (see `fixtures/README.md`). The server only loads these when started with `EXTRA_RUNS=1`; the tests load them directly.

| Claim | What it tests |
|---|---|
| `CLM-2026-009001`, short run (about 5 s) | Emoji in the document before a citation, so UTF-16 offsets differ from code points and bytes. A `confidence_changed` that arrives before its field is extracted (held, then applied). A wrong money value revised by the agent. A duplicate summary delta delivered late. Bold markdown split across two deltas. |
| `CLM-2026-009002`, failure variant | `run_failed` with `retryable: false` during the first step, with a partial summary. |

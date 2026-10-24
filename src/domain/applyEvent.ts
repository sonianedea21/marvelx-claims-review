import type { AgentField, RunEvent, RunState } from './types';

export function emptyRunState(): RunState {
  return {
    phase: 'not_started',
    started_at: null,
    seen_seqs: [],
    step_order: [],
    steps: {},
    summary_parts: [],
    field_order: [],
    fields: {},
    held_events: [],
    overall_confidence: null,
    error: null,
  };
}

/**
 * Applies one delivered event and returns the new state. Never mutates its input.
 *
 * Delivery is at least once and not always in seq order (004817 delivers seq 42
 * again after seq 45), so dedupe uses the set of seen seqs, never "seq <= last".
 * Applying the same event twice returns the same state.
 */
export function applyEvent(state: RunState, event: RunEvent): RunState {
  if (state.seen_seqs.includes(event.seq)) return state;

  const next = structuredClone(state);
  next.seen_seqs.push(event.seq);
  applyTo(next, event);
  return next;
}

export function applyEvents(state: RunState, events: RunEvent[]): RunState {
  return events.reduce(applyEvent, state);
}

/** Summary pieces are joined in seq order, whatever order they were delivered in. */
export function summaryText(state: RunState): string {
  return [...state.summary_parts]
    .sort((a, b) => a.seq - b.seq)
    .map((part) => part.text)
    .join('');
}

// Mutates `state`, which is always a fresh clone owned by applyEvent.
function applyTo(state: RunState, event: RunEvent) {
  switch (event.type) {
    case 'run_started':
      state.phase = 'running';
      state.started_at = event.payload.started_at;
      return;

    case 'step_started':
      // Steps can nest (read_invoice_page_2 runs inside read_invoice), so they
      // are tracked by id rather than as a stack or a sequence.
      state.steps[event.payload.step_id] = {
        step_id: event.payload.step_id,
        label: event.payload.label,
        status: 'running',
        note: null,
      };
      state.step_order.push(event.payload.step_id);
      return;

    case 'step_finished': {
      const step = state.steps[event.payload.step_id];
      if (!step) return;
      step.status = event.payload.outcome;
      step.note = event.payload.note ?? null;
      return;
    }

    case 'summary_delta':
      state.summary_parts.push({ seq: event.seq, text: event.payload.text });
      return;

    case 'field_extracted': {
      const { field_id, label, value, value_type, confidence, source } = event.payload;
      state.fields[field_id] = {
        field_id,
        label,
        value_type,
        versions: [{ version: 1, seq: event.seq, value, confidence, source, reason: null }],
        confidence,
        confidence_notes: [],
      };
      state.field_order.push(field_id);
      applyHeldEvents(state, field_id);
      return;
    }

    case 'field_revised': {
      const field = state.fields[event.payload.field_id];
      if (!field) {
        state.held_events.push(event);
        return;
      }
      reviseField(field, event);
      return;
    }

    case 'confidence_changed': {
      const field = state.fields[event.payload.field_id];
      if (!field) {
        state.held_events.push(event);
        return;
      }
      field.confidence = event.payload.confidence;
      field.confidence_notes.push({ seq: event.seq, confidence: event.payload.confidence, reason: event.payload.reason });
      return;
    }

    case 'run_finished':
      state.phase = 'finished';
      state.overall_confidence = event.payload.overall_confidence;
      return;

    case 'run_failed': {
      state.phase = 'failed';
      state.error = { step_id: event.payload.step_id, ...event.payload.error };
      // The failed step never gets a step_finished.
      const step = state.steps[event.payload.step_id];
      if (step) step.status = 'failed';
      return;
    }
  }
}

function reviseField(field: AgentField, event: Extract<RunEvent, { type: 'field_revised' }>) {
  const { value, confidence, source, reason } = event.payload;
  field.versions.push({ version: field.versions.length + 1, seq: event.seq, value, confidence, source, reason });
  field.confidence = confidence;
}

function applyHeldEvents(state: RunState, fieldId: string) {
  const held = state.held_events.filter((e) => 'field_id' in e.payload && e.payload.field_id === fieldId);
  state.held_events = state.held_events.filter((e) => !held.includes(e));
  for (const event of held) applyTo(state, event);
}

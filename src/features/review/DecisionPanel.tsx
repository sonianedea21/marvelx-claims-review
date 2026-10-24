import { useState } from 'react';
import type { ApiError } from '../../api/client';
import { formatValue } from '../../domain/format';
import type { DecisionAction, FieldState, FieldValue } from '../../domain/types';
import { sameValue, validateValue } from '../../domain/validateValue';
import { Banner, Button, DecisionStamp, FormField } from '../../ui';
import { DECISION_COPY } from './reviewCopy';
import { draftFrom, draftToInput, ValueEditor, type Draft } from './ValueEditor';

type Props = {
  field: FieldState;
  locked: boolean;
  saving: boolean;
  serverError: ApiError | undefined;
  decide: (action: DecisionAction, agentVersion: number, value?: FieldValue) => Promise<boolean>;
};

type Editing = { mode: 'correct' | 'override'; draft: Draft; versionAtStart: number };

/** Accept / correct / override for one field, the editor, and what to do when the AI changes things. */
export function DecisionPanel({ field, locked, saving, serverError, decide }: Props) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const [revisiting, setRevisiting] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const show = (v: FieldValue) => formatValue(v, field.value_type);
  const decision = field.decision;

  function startEditing(mode: Editing['mode']) {
    setClientError(null);
    setEditing({ mode, draft: draftFrom(mode === 'correct' ? field.agent.value : null, field.value_type), versionAtStart: field.agent.version });
  }

  async function submit(action: DecisionAction, value?: FieldValue) {
    const ok = await decide(action, field.agent.version, value);
    if (ok) {
      setEditing(null);
      setRevisiting(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    const result = validateValue(field.value_type, draftToInput(editing.draft, field.value_type));
    if (!result.ok) return setClientError(result.message);
    if (editing.mode === 'correct' && sameValue(result.value, field.agent.value)) {
      return setClientError("That's the AI's value unchanged. Use Accept instead.");
    }
    setClientError(null);
    await submit(editing.mode, result.value);
  }

  // ---- The AI changed the value after the reviewer decided ----
  if (decision && field.outdated && !revisiting) {
    const keepAction: DecisionAction = sameValue(decision.value, field.agent.value) ? 'accept' : 'override';
    return (
      <DecisionStamp
        title={DECISION_COPY[decision.action].done}
        icon={DECISION_COPY[decision.action].icon}
        stale={
          <>
            <p>
              You decided on <strong>{show(decision.value)}</strong>. The AI now says <strong>{show(field.agent.value)}</strong>.
            </p>
            {field.agent.reason && <p className="text-ink-muted">AI's reason: “{field.agent.reason}”</p>}
            <p>Your decision still stands until you choose.</p>
          </>
        }
        actions={
          !locked && (
            <>
              <Button size="sm" variant="primary" loading={saving} onClick={() => submit(keepAction, keepAction === 'override' ? decision.value : undefined)}>
                Keep mine ({show(decision.value)})
              </Button>
              <Button size="sm" onClick={() => setRevisiting(true)}>
                Review again
              </Button>
            </>
          )
        }
      />
    );
  }

  // ---- Decided ----
  if (decision && !revisiting) {
    return (
      <DecisionStamp
        title={DECISION_COPY[decision.action].done}
        icon={DECISION_COPY[decision.action].icon}
        detail={
          <>
            {decision.action !== 'accept' && <p>Your value: <strong>{show(decision.value)}</strong></p>}
            {field.confidence_changed_since_decision && (
              <p className="text-ink-muted">
                The AI's confidence changed since you decided (now {Math.round(field.agent.confidence * 100)}%). The value is the same.
              </p>
            )}
          </>
        }
        actions={!locked && <Button size="sm" variant="ghost" onClick={() => setRevisiting(true)}>Change decision</Button>}
      />
    );
  }

  if (locked) return null;

  // ---- Editing: correct or override ----
  if (editing) {
    const inputId = `edit-${field.field_id}`;
    const error = clientError ?? (serverError && serverError.status !== 409 ? serverError.message : null);
    const changedWhileEditing = field.agent.version !== editing.versionAtStart;
    return (
      <div className="space-y-3 rounded-md border border-line bg-paper p-3">
        {changedWhileEditing && (
          <Banner tone="attention" title="The AI changed this while you were editing">
            <p>
              It now says <strong>{show(field.agent.value)}</strong>. Your edit isn't saved yet.
            </p>
            {field.agent.reason && <p>AI's reason: “{field.agent.reason}”</p>}
          </Banner>
        )}
        <FormField
          htmlFor={inputId}
          label={editing.mode === 'correct' ? `Correct the AI's value` : `Your value (replaces the AI's)`}
          hint={field.value_type === 'time' ? 'Local time at the incident, HH:MM.' : field.value_type === 'money' ? 'Amount only, e.g. 4415.30' : undefined}
          error={error}
        >
          <ValueEditor
            id={inputId}
            label={field.label}
            valueType={field.value_type}
            draft={editing.draft}
            onChange={(draft) => setEditing({ ...editing, draft })}
            describedBy={`${inputId}-hint ${inputId}-error`}
            invalid={Boolean(error)}
          />
        </FormField>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" loading={saving} onClick={saveEdit}>
            {changedWhileEditing ? 'Save my value anyway' : editing.mode === 'correct' ? 'Save correction' : 'Save override'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // ---- Not decided yet ----
  return (
    <div className="space-y-2">
      {serverError && <p className="text-sm font-medium text-danger" role="alert">{serverError.message}</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" size="sm" icon="check" loading={saving} onClick={() => submit('accept')}>
          {field.agent.value === null ? 'Confirm nothing found' : 'Accept'}
        </Button>
        {field.agent.value !== null && (
          <Button size="sm" icon="pencil" onClick={() => startEditing('correct')}>
            Correct
          </Button>
        )}
        <Button size="sm" icon="swap" onClick={() => startEditing('override')}>
          Override
        </Button>
        {revisiting && (
          <Button size="sm" variant="ghost" onClick={() => setRevisiting(false)}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { ApiError } from '../../api/client';
import { formatValue } from '../../domain/format';
import type { AgentRef, DecisionAction, FieldState, FieldValue } from '../../domain/types';
import { sameValue, validateValue } from '../../domain/validateValue';
import { Banner, Button, ConfirmDialog, DecisionStamp, FormField } from '../../ui';
import { LOW_CONFIDENCE } from '../../domain/confidence';
import { DECISION_COPY } from './reviewCopy';
import { draftFrom, draftToInput, ValueEditor, type Draft } from './ValueEditor';

type Props = {
  field: FieldState;
  locked: boolean;
  saving: boolean;
  serverError: ApiError | undefined;
  /** `seen` is the AI run and version on screen when the reviewer decided. */
  decide: (action: DecisionAction, seen: AgentRef, value?: FieldValue) => Promise<boolean>;
  /** Open straight into the actions (the reviewer reopened a decided field). */
  startRevisiting?: boolean;
  /** Called when the reviewer keeps their existing decision, so the card can fold back. */
  onKeep?: () => void;
  /** Called when the reviewer starts correcting or overriding, e.g. to show this field's source. */
  onEdit?: () => void;
};

type Editing = { mode: 'correct' | 'override'; draft: Draft; seenAtStart: AgentRef };

/** Accept / correct / override for one field, the editor, and what to do when the AI changes things. */
export function DecisionPanel({ field, locked, saving, serverError, decide, startRevisiting = false, onKeep, onEdit }: Props) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const [revisiting, setRevisiting] = useState(startRevisiting);
  // Accepting a value that contradicts its source, or that the AI is unsure about, takes a second step.
  const [confirming, setConfirming] = useState<'mismatch' | 'unsure' | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const show = (v: FieldValue) => formatValue(v, field.value_type);
  const decision = field.decision;

  function startEditing(mode: Editing['mode']) {
    setClientError(null);
    // Both start from the AI's value: correcting edits it, overriding replaces it.
    setEditing({
      mode,
      draft: draftFrom(field.agent.value, field.value_type),
      seenAtStart: { run: field.agent.run, version: field.agent.version },
    });
    onEdit?.();
  }

  async function submit(action: DecisionAction, value?: FieldValue) {
    const ok = await decide(action, field.agent, value);
    if (ok) {
      setEditing(null);
      setRevisiting(false);
    }
  }

  function accept() {
    if (field.citation_check === 'mismatch') setConfirming('mismatch');
    else if (field.agent.confidence < LOW_CONFIDENCE) setConfirming('unsure');
    else submit('accept');
  }

  async function saveEdit() {
    if (!editing) return;
    const result = validateValue(field.value_type, draftToInput(editing.draft, field.value_type));
    if (!result.ok) return setClientError(result.message);
    if (sameValue(result.value, field.agent.value)) {
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
    // A value worked out from fields the reviewer changed after deciding it (see FieldCard for which).
    const recheck = field.inputs_changed_since_decision;
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
        actions={
          !locked && (
            <>
              {recheck && (
                <Button
                  size="sm"
                  variant="primary"
                  loading={saving}
                  onClick={() => submit(decision.action, decision.action === 'accept' ? undefined : decision.value)}
                >
                  Still right
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setRevisiting(true)}>
                Change decision
              </Button>
            </>
          )
        }
      />
    );
  }

  if (locked) return null;

  // ---- Editing: correct or override ----
  if (editing) {
    const inputId = `edit-${field.field_id}`;
    const error = clientError ?? (serverError && serverError.status !== 409 ? serverError.message : null);
    const changedWhileEditing =
      field.agent.run !== editing.seenAtStart.run || field.agent.version !== editing.seenAtStart.version;
    return (
      <form
        className="space-y-3 rounded-md border border-line bg-paper p-3"
        onSubmit={(event) => {
          event.preventDefault();
          saveEdit();
        }}
      >
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
          hint={[
            editing.mode === 'correct'
              ? 'For a small mistake: the AI read the right thing but got a detail wrong.'
              : "For a wrong value: the AI's answer doesn't belong here. Type the right one.",
            field.value_type === 'time' ? 'Local time at the incident, HH:MM.' : field.value_type === 'money' ? 'Amount only, e.g. 4415.30.' : '',
          ].join(' ')}
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
          <Button type="submit" variant="primary" size="sm" loading={saving}>
            {changedWhileEditing ? 'Save my value anyway' : editing.mode === 'correct' ? 'Save correction' : 'Save override'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  // ---- Not decided yet, or reconsidering ----
  return (
    <div className="space-y-2">
      {revisiting && decision && (
        <p className="text-sm text-human">
          Your current decision: {DECISION_COPY[decision.action].done.replace(' this', '')}, <strong>{show(decision.value)}</strong>. It
          stays until you choose something else.
        </p>
      )}
      {serverError && <p className="text-sm font-medium text-danger" role="alert">{serverError.message}</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" size="sm" icon="check" loading={saving} onClick={accept}>
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
        {revisiting && decision && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setRevisiting(false);
              onKeep?.();
            }}
          >
            Keep my decision
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={confirming === 'mismatch'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="This doesn't match the source"
        safeLabel="Correct it instead"
        onSafe={() => {
          setConfirming(null);
          startEditing('correct');
        }}
        riskyLabel="Accept the AI's value anyway"
        onRisky={() => {
          setConfirming(null);
          submit('accept');
        }}
      >
        <p>
          The AI says <strong className="text-ink">{show(field.agent.value)}</strong>, but the document says{' '}
          <strong className="text-ink">“{field.cited_text}”</strong>.
        </p>
        <p>Accept the AI's value only if you've checked and the document is wrong.</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={confirming === 'unsure'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="The AI is unsure about this"
        safeLabel="Go back and check"
        onSafe={() => setConfirming(null)}
        riskyLabel="I've checked it, accept"
        onRisky={() => {
          setConfirming(null);
          submit('accept');
        }}
      >
        <p>
          The AI is only {Math.round(field.agent.confidence * 100)}% sure that <strong className="text-ink">{show(field.agent.value)}</strong> is right.
        </p>
        <p>
          {field.cited_text === null
            ? 'No document backs it: the AI worked it out itself. Check it by hand before accepting.'
            : 'Check it against the document before accepting.'}
        </p>
      </ConfirmDialog>
    </div>
  );
}

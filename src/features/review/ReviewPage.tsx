import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { api } from '../../api/claims';
import type { ApiError } from '../../api/client';
import { useLiveData } from '../../api/useLiveData';
import type { DecisionAction, FieldState, FieldValue } from '../../domain/types';
import { Banner, Button, Card, Disclosure, EmptyState, Heading, Skeleton, StepList, type StepItem } from '../../ui';
import { useIsDesktop } from '../shared/useIsDesktop';
import { ClaimHeader } from './ClaimHeader';
import { DecisionPanel } from './DecisionPanel';
import { FieldCard } from './FieldCard';
import { DecidedRow } from './DecidedRow';
import { FieldRow } from './FieldRow';
import { isOpen, needsALook } from './reviewCopy';
import { ReviewProgress } from './ReviewProgress';
import { RunBanners } from './RunBanners';
import { SourcePanel } from './SourcePanel';
import { SummaryCard } from './SummaryCard';
import { useDecide } from './useDecide';
import { useRecentlyChanged } from './useRecentlyChanged';

export function ReviewPage() {
  const { id = '' } = useParams();
  const { data: detail, error, connection, retry } = useLiveData(() => api.claim(id), api.claimEventsUrl(id), 'claim');
  const recentlyChanged = useRecentlyChanged(detail?.fields);
  const { decide, pending, errors } = useDecide(id);
  const isDesktop = useIsDesktop();
  // null: show the default (first field that needs a look, on desktop). 'none': the reviewer closed the panel.
  const [selection, setSelection] = useState<string | 'none' | null>(null);
  // Fields the reviewer opened themselves (a "looks fine" row, or "Change" on a decided field).
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<'ack' | 'complete' | 'reopen' | 'retry' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (error) {
    return (
      <main className="mx-auto max-w-content px-4 py-10">
        {error.status === 404 ? (
          <EmptyState title="We can't find this claim" action={<Link to="/" className="font-medium underline">Back to the queue</Link>}>
            {error.message}
          </EmptyState>
        ) : (
          <Banner tone="danger" title="Couldn't load this claim" actions={<Button variant="primary" icon="refresh" onClick={retry}>Try again</Button>}>
            <p>{error.message}</p>
          </Banner>
        )}
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="mx-auto max-w-content space-y-4 px-4 py-10" aria-busy="true">
        <span className="sr-only">Loading the claim…</span>
        <Skeleton lines={2} className="max-w-reading" />
        <Skeleton shape="block" />
        <Skeleton shape="block" />
      </main>
    );
  }

  const locked = detail.claim.status === 'reviewed';
  const lookFields = detail.fields.filter(needsALook);
  const fineFields = detail.fields.filter((f) => !needsALook(f));
  const openCount = lookFields.filter(isOpen).length;
  const titles = Object.fromEntries(detail.documents.map((d) => [d.document_id, d.title]));
  const selected =
    selection === 'none'
      ? null
      : detail.fields.find((f) => f.field_id === selection) ?? (isDesktop ? lookFields.find(isOpen) ?? null : null);
  const steps: StepItem[] = detail.run.steps.map((s) => ({
    id: s.step_id,
    label: s.label,
    status: s.status === 'ok' ? 'done' : s.status,
    note: s.note,
  }));

  function open(fieldId: string) {
    setOpened((current) => new Set(current).add(fieldId));
    setSelection(fieldId);
  }

  function close(fieldId: string) {
    setOpened((current) => {
      const next = new Set(current);
      next.delete(fieldId);
      return next;
    });
  }

  /** Saves a decision; a card the reviewer opened folds back into its one-line row. */
  async function decideAndFold(fieldId: string, action: DecisionAction, version: number, value?: FieldValue) {
    const ok = await decide(fieldId, action, version, value);
    if (ok) close(fieldId);
    return ok;
  }

  async function run(kind: 'ack' | 'complete' | 'reopen' | 'retry', action: () => Promise<unknown>) {
    setBusy(kind);
    setActionError(null);
    await action().catch((e: ApiError) => setActionError(e.message));
    setBusy(null);
  }

  /** One field, in the form that fits it: full card, decided row, or compact "looks fine" row. */
  function renderField(field: FieldState, section: 'look' | 'fine') {
    const reviewerOpened = opened.has(field.field_id);
    if (reviewerOpened || (section === 'look' && isOpen(field))) {
      return (
        <FieldCard
          key={field.field_id}
          field={field}
          changedJustNow={recentlyChanged.has(field.field_id)}
          selected={selected?.field_id === field.field_id}
          onShowSource={() => setSelection(field.field_id)}
          onCollapse={reviewerOpened ? () => close(field.field_id) : undefined}
        >
          <DecisionPanel
            field={field}
            locked={locked}
            saving={Boolean(pending[field.field_id])}
            serverError={errors[field.field_id]}
            startRevisiting={reviewerOpened && field.decision !== null && !field.outdated}
            decide={(action, version, value) => decideAndFold(field.field_id, action, version, value)}
          />
        </FieldCard>
      );
    }
    if (field.decision) {
      return (
        <DecidedRow key={field.field_id} field={field} locked={locked} boxed={section === 'look'} onChange={() => open(field.field_id)} />
      );
    }
    return (
      <FieldRow
        key={field.field_id}
        field={field}
        locked={locked}
        saving={Boolean(pending[field.field_id])}
        error={errors[field.field_id]?.message}
        selected={selected?.field_id === field.field_id}
        onAccept={() => decide(field.field_id, 'accept', field.agent.version)}
        onOpen={() => open(field.field_id)}
      />
    );
  }

  return (
    <main className="mx-auto max-w-content space-y-5 px-4 py-6 sm:py-8">
      <ClaimHeader detail={detail} />
      {connection === 'reconnecting' && (
        <p className="text-sm text-ink-subtle" role="status">Reconnecting… showing the last update.</p>
      )}
      <RunBanners
        detail={detail}
        acknowledging={busy === 'ack'}
        onAcknowledge={() => run('ack', () => api.acknowledgeWarning(id))}
        retrying={busy === 'retry'}
        onRetry={() => run('retry', () => api.retry(id))}
      />
      <SummaryCard summary={detail.run.summary} writing={detail.run.phase === 'running'} failed={detail.run.phase === 'failed'} />
      {/* Open while the AI works, folded once it's done. The key remounts it when the phase changes. */}
      <Disclosure
        key={detail.run.phase}
        defaultOpen={detail.run.phase === 'running'}
        summary={`What the AI did · ${steps.length} ${steps.length === 1 ? 'step' : 'steps'}`}
      >
        {steps.length > 0 ? <StepList steps={steps} /> : <p className="text-sm text-ink-muted">Nothing yet.</p>}
      </Disclosure>
      <ReviewProgress
        detail={detail}
        attentionCount={openCount}
        busy={busy === 'complete' || busy === 'reopen'}
        onComplete={() => run('complete', () => api.complete(id))}
        onReopen={() => run('reopen', () => api.reopen(id))}
        error={actionError}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-8 lg:col-span-7">
          {detail.fields.length === 0 && (
            <EmptyState icon="sparkle" title="No fields yet">
              {detail.run.phase === 'not_started' ? 'The AI hasn’t started on this claim.' : 'The AI is reading the documents. Fields appear here as it finds them.'}
            </EmptyState>
          )}

          {lookFields.length > 0 && (
            <section className="space-y-3" aria-labelledby="look-title">
              <Heading level={2} id="look-title">
                Needs a look · {openCount > 0 ? `${openCount} to decide` : 'all decided'}
              </Heading>
              <ul className="space-y-3">{lookFields.map((field) => renderField(field, 'look'))}</ul>
            </section>
          )}

          {fineFields.length > 0 && (
            <section className="space-y-3" aria-labelledby="fine-title">
              <div className="space-y-1">
                <Heading level={2} id="fine-title">Looks fine · {fineFields.length}</Heading>
                <p className="text-sm text-ink-muted">
                  The AI is at least 90% sure, the value matches its source, and the AI hasn't changed it. Click a row to check it.
                </p>
              </div>
              <Card padding="none">
                <ul className="divide-y divide-line px-4">
                  {fineFields.map((field) => renderField(field, 'fine'))}
                </ul>
              </Card>
            </section>
          )}
        </div>

        {isDesktop && (
          <div className="lg:col-span-5">
            <SourcePanel claimId={id} field={selected} documentTitles={titles} onClose={() => setSelection('none')} asSheet={false} />
          </div>
        )}
      </div>

      {!isDesktop && (
        <SourcePanel claimId={id} field={selected} documentTitles={titles} onClose={() => setSelection('none')} asSheet />
      )}
    </main>
  );
}

import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { api } from '../../api/claims';
import type { ApiError } from '../../api/client';
import { useLiveData } from '../../api/useLiveData';
import type { FieldState } from '../../domain/types';
import { Banner, Button, Card, Disclosure, EmptyState, Heading, Skeleton, StepList, type StepItem } from '../../ui';
import { useIsDesktop } from '../shared/useIsDesktop';
import { ClaimHeader } from './ClaimHeader';
import { DecisionPanel } from './DecisionPanel';
import { FieldCard } from './FieldCard';
import { FieldRow } from './FieldRow';
import { needsAttention } from './reviewCopy';
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<'ack' | 'complete' | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);

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
  const attention = detail.fields.filter((f) => needsAttention(f) || expanded.has(f.field_id));
  const fine = detail.fields.filter((f) => f.status === 'pending' && !attention.includes(f));
  const decided = detail.fields.filter((f) => f.status !== 'pending' && !attention.includes(f));
  // On desktop the source panel always has something useful: the first field that needs a look.
  const selected =
    detail.fields.find((f) => f.field_id === selectedId) ?? (isDesktop ? attention[0] ?? null : null);
  const titles = Object.fromEntries(detail.documents.map((d) => [d.document_id, d.title]));
  const steps: StepItem[] = detail.run.steps.map((s) => ({
    id: s.step_id,
    label: s.label,
    status: s.status === 'ok' ? 'done' : s.status,
    note: s.note,
  }));

  const decisionPanel = (field: FieldState) => (
    <DecisionPanel
      field={field}
      locked={locked}
      saving={Boolean(pending[field.field_id])}
      serverError={errors[field.field_id]}
      decide={(action, version, value) => decide(field.field_id, action, version, value)}
    />
  );

  async function acknowledge() {
    setBusy('ack');
    await api.acknowledgeWarning(id).catch(() => undefined);
    setBusy(null);
  }

  async function complete() {
    setBusy('complete');
    setCompleteError(null);
    await api.complete(id).catch((e: ApiError) => setCompleteError(e.message));
    setBusy(null);
  }

  return (
    <main className="mx-auto max-w-content space-y-5 px-4 py-6 sm:py-8">
      <ClaimHeader detail={detail} />
      {connection === 'reconnecting' && (
        <p className="text-sm text-ink-subtle" role="status">Reconnecting… showing the last update.</p>
      )}
      <RunBanners detail={detail} acknowledging={busy === 'ack'} onAcknowledge={acknowledge} />
      <SummaryCard summary={detail.run.summary} writing={detail.run.phase === 'running'} failed={detail.run.phase === 'failed'} />
      <ReviewProgress
        detail={detail}
        attentionCount={attention.length}
        completing={busy === 'complete'}
        onComplete={complete}
        error={completeError}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-8 lg:col-span-7">
          {detail.fields.length === 0 && (
            <EmptyState icon="sparkle" title="No fields yet">
              {detail.run.phase === 'not_started' ? 'The AI hasn’t started on this claim.' : 'The AI is reading the documents. Fields appear here as it finds them.'}
            </EmptyState>
          )}

          {attention.length > 0 && (
            <section className="space-y-3" aria-labelledby="attention-title">
              <Heading level={2} id="attention-title">Needs your attention · {attention.length}</Heading>
              <ul className="space-y-3">
                {attention.map((field) => (
                  <FieldCard
                    key={field.field_id}
                    field={field}
                    changedJustNow={recentlyChanged.has(field.field_id)}
                    selected={selected?.field_id === field.field_id}
                    onShowSource={() => setSelectedId(field.field_id)}
                  >
                    {decisionPanel(field)}
                  </FieldCard>
                ))}
              </ul>
            </section>
          )}

          {fine.length > 0 && (
            <section className="space-y-3" aria-labelledby="fine-title">
              <div className="space-y-1">
                <Heading level={2} id="fine-title">Looks fine · {fine.length}</Heading>
                <p className="text-sm text-ink-muted">AI is at least 90% sure, the value matches its source, and the AI hasn't changed it.</p>
              </div>
              <Card padding="none">
                <ul className="divide-y divide-line px-4">
                  {fine.map((field) => (
                    <FieldRow
                      key={field.field_id}
                      field={field}
                      locked={locked}
                      saving={Boolean(pending[field.field_id])}
                      error={errors[field.field_id]?.message}
                      selected={selectedId === field.field_id}
                      onAccept={() => decide(field.field_id, 'accept', field.agent.version)}
                      onOpen={() => {
                        setExpanded((e) => new Set(e).add(field.field_id));
                        setSelectedId(field.field_id);
                      }}
                    />
                  ))}
                </ul>
              </Card>
            </section>
          )}

          {decided.length > 0 && (
            <section className="space-y-3" aria-labelledby="decided-title">
              <Heading level={2} id="decided-title">Decided · {decided.length}</Heading>
              <ul className="space-y-2">
                {decided.map((field) => (
                  <li key={field.field_id} className="space-y-1">
                    <p className="text-sm text-ink-muted">{field.label}</p>
                    {decisionPanel(field)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Disclosure summary={`What the AI did · ${steps.length} ${steps.length === 1 ? 'step' : 'steps'}`}>
            {steps.length > 0 ? <StepList steps={steps} /> : <p className="text-sm text-ink-muted">Nothing yet.</p>}
          </Disclosure>
        </div>

        {isDesktop && (
          <div className="lg:col-span-5">
            <SourcePanel claimId={id} field={selected} documentTitles={titles} onClose={() => setSelectedId(null)} asSheet={false} />
          </div>
        )}
      </div>

      {!isDesktop && (
        <SourcePanel claimId={id} field={selected} documentTitles={titles} onClose={() => setSelectedId(null)} asSheet />
      )}
    </main>
  );
}

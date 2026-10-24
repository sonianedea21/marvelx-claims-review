import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { api, type QueueFilter } from '../../api/claims';
import { useLiveData } from '../../api/useLiveData';
import type { ClaimStatus, Priority } from '../../domain/types';
import { Banner, Button, EmptyState, Eyebrow, Heading, Sheet, Skeleton } from '../../ui';
import { QueueFilters } from './QueueFilters';
import { QueueRow } from './QueueRow';

export function QueuePage() {
  const [params, setParams] = useSearchParams();
  // Passed to the server as is: an unknown value comes back as a 400 we show to the reviewer.
  const filter = {
    status: params.get('status') ?? undefined,
    priority: params.get('priority') ?? undefined,
  } as QueueFilter;
  const { data: claims, error, connection, retry } = useLiveData(
    () => api.queue(filter),
    api.queueEventsUrl(filter),
    'queue',
  );

  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters = [filter.status, filter.priority].filter(Boolean).length;

  function setFilter(next: { status: ClaimStatus | 'all'; priority: Priority | 'all' }) {
    const search = new URLSearchParams();
    if (next.status !== 'all') search.set('status', next.status);
    if (next.priority !== 'all') search.set('priority', next.priority);
    setParams(search);
  }

  return (
    <main className="mx-auto max-w-content space-y-6 px-4 py-6 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <Eyebrow>Claims review</Eyebrow>
          <Heading level={1}>Your queue</Heading>
        </div>
        {connection === 'reconnecting' && <p className="text-sm text-ink-subtle">Reconnecting… showing the last update.</p>}
        {/* Phones: filters live in a bottom drawer. */}
        <Button className="sm:hidden" icon="filter" onClick={() => setFiltersOpen(true)}>
          Filters{activeFilters > 0 ? ` · ${activeFilters}` : ''}
        </Button>
      </header>

      <div className="hidden sm:block">
        <QueueFilters status={filter.status ?? 'all'} priority={filter.priority ?? 'all'} onChange={setFilter} />
      </div>
      <Sheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Filter the queue"
        footer={
          <Button variant="primary" className="w-full" onClick={() => setFiltersOpen(false)}>
            Show {claims?.length ?? 0} {claims?.length === 1 ? 'claim' : 'claims'}
          </Button>
        }
      >
        <QueueFilters status={filter.status ?? 'all'} priority={filter.priority ?? 'all'} onChange={setFilter} layout="wrap" />
      </Sheet>

      {error ? (
        <Banner
          tone="danger"
          title="Couldn't load the queue"
          actions={
            error.status === 400 ? (
              <Button variant="primary" onClick={() => setParams(new URLSearchParams())}>
                Clear filters
              </Button>
            ) : (
              <Button variant="primary" icon="refresh" onClick={retry}>
                Try again
              </Button>
            )
          }
        >
          <p>{error.message}</p>
        </Banner>
      ) : claims === null ? (
        <div className="space-y-3" aria-busy="true">
          <span className="sr-only">Loading claims…</span>
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} shape="block" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <EmptyState
          title="No claims match these filters"
          action={<Button onClick={() => setParams(new URLSearchParams())}>Show all claims</Button>}
        >
          Try another status or priority.
        </EmptyState>
      ) : (
        <ul className="space-y-3" aria-label={`${claims.length} claims`}>
          {claims.map((claim) => (
            <QueueRow key={claim.id} claim={claim} />
          ))}
        </ul>
      )}
    </main>
  );
}

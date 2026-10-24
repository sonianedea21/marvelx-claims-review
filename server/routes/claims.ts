import { Router, type Request } from 'express';
import { validateDecision } from '../../src/domain/validateDecision';
import { CLAIM_STATUSES, PRIORITIES, type ClaimStatus, type Priority, type QueueItem } from '../../src/domain/types';
import { openEventStream } from '../sse';
import type { ClaimStore } from '../store';

const STATUS_ORDER: ClaimStatus[] = ['needs_review', 'running', 'failed', 'queued', 'reviewed'];

type QueueFilter = { status?: ClaimStatus; priority?: Priority };
type FilterResult = { ok: true; filter: QueueFilter } | { ok: false; error: object };

export function claimsRouter(store: ClaimStore) {
  const router = Router();

  router.get('/claims', (req, res) => {
    const parsed = parseQueueFilter(req);
    if (!parsed.ok) return res.status(400).json(parsed.error);
    res.json(queue(store, parsed.filter));
  });

  // Live queue: the full filtered list again whenever any claim changes. Four
  // claims make this cheap, and the browser just replaces what it shows.
  router.get('/queue/events', (req, res) => {
    const parsed = parseQueueFilter(req);
    if (!parsed.ok) return res.status(400).json(parsed.error);
    const unsubscribe = store.subscribe(() => send('queue', queue(store, parsed.filter)));
    const send = openEventStream(req, res, unsubscribe);
    send('queue', queue(store, parsed.filter));
  });

  router.get('/claims/:id', (req, res) => {
    const detail = store.detail(req.params.id);
    if (!detail) return res.status(404).json(notFound(req.params.id));
    res.json(detail);
  });

  // Live claim: the full claim snapshot after every change to this claim.
  router.get('/claims/:id/events', (req, res) => {
    const id = req.params.id;
    if (!store.has(id)) return res.status(404).json(notFound(id));
    const unsubscribe = store.subscribe((changedId) => {
      if (changedId === id) send('claim', store.detail(id));
    });
    const send = openEventStream(req, res, unsubscribe);
    send('claim', store.detail(id));
  });

  router.get('/claims/:id/documents/:documentId', (req, res) => {
    const doc = store.documentText(req.params.id, req.params.documentId);
    if (!doc) {
      return res.status(404).json({ error: 'document_not_found', message: 'No such document on this claim.' });
    }
    res.json(doc);
  });

  router.post('/claims/:id/decisions', (req, res) => {
    const id = req.params.id;
    const detail = store.detail(id);
    if (!detail) return res.status(404).json(notFound(id));

    const input = typeof req.body === 'object' && req.body !== null ? req.body : {};
    const field = detail.fields.find((f) => f.field_id === input.field_id);
    const result = validateDecision(input, { claimStatus: detail.claim.status, field });
    if (!result.ok) {
      return res.status(result.status).json({ error: result.code, message: result.message, field: field ?? null });
    }

    const { ok: _ok, ...decision } = result;
    res.status(201).json(store.addDecision(id, { field_id: input.field_id, ...decision }));
  });

  router.post('/claims/:id/acknowledge-warning', (req, res) => {
    const id = req.params.id;
    if (!store.has(id)) return res.status(404).json(notFound(id));
    store.acknowledgeWarning(id);
    res.json(store.detail(id));
  });

  router.post('/claims/:id/complete', (req, res) => {
    const id = req.params.id;
    const detail = store.detail(id);
    if (!detail) return res.status(404).json(notFound(id));
    if (detail.review.blockers.length > 0) {
      return res.status(409).json({
        error: 'review_blocked',
        message: 'This review cannot be completed yet.',
        blocked_by: detail.review.blockers,
      });
    }
    store.complete(id);
    res.json(store.detail(id));
  });

  return router;
}

function queue(store: ClaimStore, filter: QueueFilter): QueueItem[] {
  return store
    .ids()
    .map((id) => store.detail(id)!.claim)
    .filter((c) => (!filter.status || c.status === filter.status) && (!filter.priority || c.priority === filter.priority))
    .sort(
      (a, b) =>
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
        PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) ||
        a.received_at.localeCompare(b.received_at),
    );
}

function parseQueueFilter(req: Request): FilterResult {
  const { status, priority } = req.query;
  if (status !== undefined && !CLAIM_STATUSES.includes(status as ClaimStatus)) {
    return { ok: false, error: invalidParam('status', status, CLAIM_STATUSES) };
  }
  if (priority !== undefined && !PRIORITIES.includes(priority as Priority)) {
    return { ok: false, error: invalidParam('priority', priority, PRIORITIES) };
  }
  return { ok: true, filter: { status: status as ClaimStatus | undefined, priority: priority as Priority | undefined } };
}

function invalidParam(param: string, value: unknown, allowed: readonly string[]) {
  return {
    error: 'invalid_query',
    param,
    message: `"${String(value)}" is not a valid ${param}. Use one of: ${allowed.join(', ')}.`,
    allowed,
  };
}

function notFound(id: string) {
  return { error: 'claim_not_found', message: `No claim with id "${id}".` };
}

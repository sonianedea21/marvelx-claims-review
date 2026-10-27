import type {
  ClaimDetail, ClaimStatus, DecisionAction, FieldValue, Priority, QueueItem, ReviewerDecision,
} from '../domain/types';
import { request } from './client';

export type QueueFilter = { status?: ClaimStatus; priority?: Priority };

function query(filter: QueueFilter): string {
  const params = new URLSearchParams();
  if (filter.status) params.set('status', filter.status);
  if (filter.priority) params.set('priority', filter.priority);
  const text = params.toString();
  return text ? `?${text}` : '';
}

export const api = {
  queue: (filter: QueueFilter) => request<QueueItem[]>(`/api/claims${query(filter)}`),
  queueEventsUrl: (filter: QueueFilter) => `/api/queue/events${query(filter)}`,

  claim: (id: string) => request<ClaimDetail>(`/api/claims/${encodeURIComponent(id)}`),
  claimEventsUrl: (id: string) => `/api/claims/${encodeURIComponent(id)}/events`,

  document: (id: string, documentId: string) =>
    request<{ document_id: string; title: string; kind: string; text: string }>(
      `/api/claims/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentId)}`,
    ),

  decide: (
    id: string,
    body: { field_id: string; action: DecisionAction; value?: FieldValue; agent_run: number; agent_version: number },
  ) =>
    request<ReviewerDecision>(`/api/claims/${encodeURIComponent(id)}/decisions`, { method: 'POST', body }),

  acknowledgeWarning: (id: string) =>
    request<ClaimDetail>(`/api/claims/${encodeURIComponent(id)}/acknowledge-warning`, { method: 'POST' }),

  reopen: (id: string) => request<ClaimDetail>(`/api/claims/${encodeURIComponent(id)}/reopen`, { method: 'POST' }),
  retry: (id: string) => request<ClaimDetail>(`/api/claims/${encodeURIComponent(id)}/retry`, { method: 'POST' }),

  complete: (id: string) => request<ClaimDetail>(`/api/claims/${encodeURIComponent(id)}/complete`, { method: 'POST' }),

  replayOptions: () => request<{ speed: number; seekMs: number }>('/api/dev/replay'),
  restartReplay: (speed?: number) =>
    request<{ speed: number; seekMs: number }>('/api/dev/replay', { method: 'POST', body: { speed } }),
};

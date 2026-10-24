import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { createApp } from './app';
import { EXTRA_FIXTURES_DIR, FIXTURES_DIR, loadFixturePack } from './fixtures';
import { ReplayClock } from './replayClock';
import { ClaimStore } from './store';

const fixtures = [...loadFixturePack(FIXTURES_DIR), ...loadFixturePack(EXTRA_FIXTURES_DIR)];

/** A store with every run delivered in full: no timers involved. */
function finishedApp() {
  const store = new ClaimStore(fixtures);
  const clock = new ReplayClock(fixtures, store, { speed: 0, seekMs: Number.MAX_SAFE_INTEGER });
  clock.restart();
  return createApp(store, clock);
}

describe('GET /api/claims', () => {
  it('lists the queue, needs_review first', async () => {
    const res = await request(finishedApp()).get('/api/claims');
    expect(res.status).toBe(200);
    expect(res.body.map((c: { id: string; status: string }) => `${c.id}:${c.status}`)).toEqual([
      'clm_4817:needs_review',
      'clm_4809:needs_review',
      'clm_4830:needs_review',
      'clm_9001:needs_review',
      'clm_4822:failed',
      'clm_9002:failed',
    ]);
  });

  it('filters by status and priority', async () => {
    const res = await request(finishedApp()).get('/api/claims?status=failed&priority=normal');
    expect(res.body.map((c: { id: string }) => c.id)).toEqual(['clm_4822', 'clm_9002']);
  });

  it('rejects an unknown filter value with 400 and the allowed values', async () => {
    const res = await request(finishedApp()).get('/api/claims?status=done');
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: 'invalid_query',
      param: 'status',
      allowed: ['queued', 'running', 'needs_review', 'reviewed', 'failed'],
    });
  });
});

describe('GET /api/claims/:id', () => {
  it('returns 404 for an unknown claim', async () => {
    const res = await request(finishedApp()).get('/api/claims/clm_nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('claim_not_found');
  });

  it('serves a claim document, and 404 for a document on another claim', async () => {
    const app = finishedApp();
    const ok = await request(app).get('/api/claims/clm_4817/documents/police-report-004817');
    expect(ok.body.text).toContain('Time of incident: 23:40');
    const other = await request(app).get('/api/claims/clm_4817/documents/glass-quote-004809');
    expect(other.status).toBe(404);
  });
});

describe('POST /api/claims/:id/decisions', () => {
  it('records an accept (happy path) and reflects it in the claim', async () => {
    const app = finishedApp();
    const res = await request(app)
      .post('/api/claims/clm_4830/decisions')
      .send({ field_id: 'frame_number', action: 'accept', agent_version: 1 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ field_id: 'frame_number', action: 'accept', value: 'GZ4H218873', agent_version: 1 });

    const claim = await request(app).get('/api/claims/clm_4830');
    expect(claim.body.claim.progress).toEqual({ decided: 1, total: 9 });
  });

  it('returns 409 when the agent changed the value since the reviewer saw it', async () => {
    const res = await request(finishedApp())
      .post('/api/claims/clm_4817/decisions')
      .send({ field_id: 'total_incl_vat', action: 'accept', agent_version: 1 });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('agent_value_changed');
    expect(res.body.field.agent.version).toBe(2);
  });

  it('returns 422 for a value that does not fit the field type', async () => {
    const res = await request(finishedApp())
      .post('/api/claims/clm_4817/decisions')
      .send({ field_id: 'incident_date', action: 'correct', value: '13/09/2026', agent_version: 1 });
    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Enter a real date as YYYY-MM-DD.');
  });
});

describe('completing a review', () => {
  it('is blocked with 409 and the reasons until everything is done', async () => {
    const res = await request(finishedApp()).post('/api/claims/clm_4817/complete');
    expect(res.status).toBe(409);
    expect(res.body.blocked_by).toEqual(['fields_undecided', 'warning_not_acknowledged']);
  });

  it('moves the claim to reviewed once every field is decided', async () => {
    const app = finishedApp();
    const claim = await request(app).get('/api/claims/clm_4809');
    for (const field of claim.body.fields) {
      await request(app)
        .post('/api/claims/clm_4809/decisions')
        .send({ field_id: field.field_id, action: 'accept', agent_version: field.agent.version });
    }
    const res = await request(app).post('/api/claims/clm_4809/complete');
    expect(res.status).toBe(200);
    expect(res.body.claim.status).toBe('reviewed');
  });
});

describe('GET /api/claims/:id/events (SSE)', () => {
  it('sends the current claim snapshot as the first event', async () => {
    const server = finishedApp().listen(0);
    const { port } = server.address() as AddressInfo;
    const controller = new AbortController();
    try {
      const res = await fetch(`http://localhost:${port}/api/claims/clm_4822/events`, { signal: controller.signal });
      expect(res.headers.get('content-type')).toBe('text/event-stream');
      const reader = res.body!.getReader();
      let text = '';
      while (!text.includes('\n\n')) text += new TextDecoder().decode((await reader.read()).value);
      const [eventLine, dataLine] = text.split('\n');
      expect(eventLine).toBe('event: claim');
      expect(JSON.parse(dataLine!.slice('data: '.length)).run.error.code).toBe('policy_service_unavailable');
    } finally {
      controller.abort();
      server.close();
    }
  });
});

describe('reopening and re-running', () => {
  it('reopens a completed review, keeping the decisions', async () => {
    const app = finishedApp();
    const claim = await request(app).get('/api/claims/clm_4809');
    for (const field of claim.body.fields) {
      await request(app).post('/api/claims/clm_4809/decisions').send({ field_id: field.field_id, action: 'accept', agent_version: 1 });
    }
    await request(app).post('/api/claims/clm_4809/complete');
    const res = await request(app).post('/api/claims/clm_4809/reopen');
    expect(res.status).toBe(200);
    expect(res.body.claim.status).toBe('needs_review');
    expect(res.body.claim.progress.decided).toBe(7);
  });

  it('refuses to reopen a claim that is not reviewed, and to re-run one that did not fail', async () => {
    const app = finishedApp();
    expect((await request(app).post('/api/claims/clm_4809/reopen')).status).toBe(409);
    expect((await request(app).post('/api/claims/clm_4809/retry')).status).toBe(409);
    expect((await request(app).post('/api/claims/clm_9002/retry')).body.error).toBe('not_retryable'); // retryable: false
  });

  it('re-runs a retryable failed run from the start', async () => {
    const res = await request(finishedApp()).post('/api/claims/clm_4822/retry');
    expect(res.status).toBe(202);
    expect(res.body.run.phase).toBe('not_started');
  });
});

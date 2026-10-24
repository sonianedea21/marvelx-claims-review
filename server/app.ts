import express from 'express';
import { claimsRouter } from './routes/claims';
import { devRouter } from './routes/dev';
import type { ReplayClock } from './replayClock';
import type { ClaimStore } from './store';

// Built separately from index.ts so tests can use the app without opening a port.
export function createApp(store: ClaimStore, clock?: ReplayClock) {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.use('/api', claimsRouter(store, clock));
  if (clock && process.env.NODE_ENV !== 'production') app.use('/api', devRouter(clock));

  return app;
}

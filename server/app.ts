import express, { type ErrorRequestHandler } from 'express';
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

  // Every API answer is JSON in the same { error, message } shape, including the ones
  // Express would otherwise send as an HTML page (an unknown route, a malformed body).
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'not_found', message: `No API route ${req.method} ${req.path}.` });
  });
  app.use(jsonErrors);

  return app;
}

const jsonErrors: ErrorRequestHandler = (err, _req, res, _next) => {
  // express.json() marks a body it can't parse with this type.
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'invalid_json', message: 'The request body is not valid JSON.' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'server_error', message: 'Something went wrong on the server. Try again.' });
};

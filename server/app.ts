import express from 'express';

// Built separately from index.ts so tests can use the app without opening a port.
export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}

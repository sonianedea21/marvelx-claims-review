import { Router } from 'express';
import type { ReplayClock } from '../replayClock';

/** Dev-only replay control, used by `npm run replay` and the dev bar in the UI. */
export function devRouter(clock: ReplayClock) {
  const router = Router();

  router.get('/dev/replay', (_req, res) => {
    res.json(clock.options);
  });

  router.post('/dev/replay', (req, res) => {
    const { speed, seek_ms } = req.body ?? {};
    if (speed !== undefined && (typeof speed !== 'number' || speed < 0)) {
      return res.status(400).json({ error: 'invalid_body', message: 'speed must be a number ≥ 0.' });
    }
    if (seek_ms !== undefined && (typeof seek_ms !== 'number' || seek_ms < 0)) {
      return res.status(400).json({ error: 'invalid_body', message: 'seek_ms must be a number ≥ 0.' });
    }
    clock.restart({ speed, seekMs: seek_ms ?? 0 });
    res.json(clock.options);
  });

  return router;
}

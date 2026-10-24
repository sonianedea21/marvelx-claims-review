import { createApp } from './app';
import { SERVER_PORT } from './config';
import { loadAllFixtures } from './fixtures';
import { ReplayClock, speedFromEnv } from './replayClock';
import { ClaimStore } from './store';

const fixtures = loadAllFixtures();
const store = new ClaimStore(fixtures);
const clock = new ReplayClock(fixtures, store, { speed: speedFromEnv(), seekMs: 0 });
clock.restart();

createApp(store, clock).listen(SERVER_PORT, () => {
  console.log(`API listening on http://localhost:${SERVER_PORT} (replay speed ${clock.options.speed}×)`);
});

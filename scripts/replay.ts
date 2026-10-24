/**
 * Restarts the replay on the running server. Clears all reviewer decisions.
 *
 *   npm run replay                     # restart at the current speed
 *   npm run replay -- --speed 4        # restart at 4× speed
 *   npm run replay -- --seek 60000     # restart, jumping 60 s into the replay
 *   npm run replay -- --speed 0 --seek 96000   # freeze 96 s in
 */
import { SERVER_PORT } from '../server/config';

function numberArg(name: string): number | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0) return undefined;
  const value = Number(process.argv[index + 1]);
  if (!Number.isFinite(value) || value < 0) {
    console.error(`--${name} needs a number ≥ 0`);
    process.exit(1);
  }
  return value;
}

async function main() {
  const body = { speed: numberArg('speed'), seek_ms: numberArg('seek') };
  try {
    const res = await fetch(`http://localhost:${SERVER_PORT}/api/dev/replay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const options = await res.json();
    if (!res.ok) throw new Error(options.message);
    console.log(`Replay restarted: speed ${options.speed}×, from ${options.seekMs} ms.`);
  } catch (error) {
    console.error(`Could not restart the replay. Is \`npm run dev\` running? (${(error as Error).message})`);
    process.exit(1);
  }
}

main();

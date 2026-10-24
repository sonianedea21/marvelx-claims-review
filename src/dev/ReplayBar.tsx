import { useEffect, useState } from 'react';
import { api } from '../api/claims';
import { Button, Eyebrow } from '../ui';

const SPEEDS = [1, 2, 4, 10];

/** Dev only: restart the replay and change its speed without touching code. Clears all decisions. */
export function ReplayBar() {
  const [speed, setSpeed] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.replayOptions().then((o) => setSpeed(o.speed), () => setSpeed(null));
  }, []);

  async function restart(nextSpeed = speed ?? 1) {
    setBusy(true);
    try {
      const options = await api.restartReplay(nextSpeed);
      setSpeed(options.speed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-b border-line bg-sunken">
      <div className="mx-auto flex max-w-content flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1">
        <Eyebrow>Dev · replay</Eyebrow>
        <Button size="sm" variant="ghost" icon="refresh" loading={busy} onClick={() => restart()}>
          Restart
        </Button>
        <div className="flex items-center gap-1" role="group" aria-label="Replay speed">
          {SPEEDS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={speed === s ? 'primary' : 'ghost'}
              aria-pressed={speed === s}
              onClick={() => restart(s)}
            >
              {s}×
            </Button>
          ))}
        </div>
        {speed === 0 && <span className="text-xs text-ink-subtle">Paused (screenshot mode). Pick a speed to resume.</span>}
      </div>
    </div>
  );
}

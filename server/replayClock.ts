import type { FixtureClaim } from './fixtures';
import type { ClaimStore } from './store';

export type ReplayOptions = { speed: number; seekMs: number };

/**
 * Delivers each fixture event at (start_after_ms + at_ms) / speed after the
 * replay starts. Runs with start_after_ms null are delivered in full at once.
 * Restart clears the store (decisions included) and starts again.
 * `seekMs` jumps ahead: everything due by then is delivered immediately.
 * Speed 0 pauses at the seek position (used for deterministic screenshots).
 */
export class ReplayClock {
  private timers: ReturnType<typeof setTimeout>[] = [];
  options: ReplayOptions;

  constructor(private fixtures: FixtureClaim[], private store: ClaimStore, options: ReplayOptions) {
    this.options = options;
  }

  restart(options: Partial<ReplayOptions> = {}) {
    this.stop();
    this.options = { ...this.options, ...options };
    this.store.reset();

    const { speed, seekMs } = this.options;
    for (const { seed, events } of this.fixtures) {
      for (const event of events) {
        const dueMs = seed.start_after_ms === null ? 0 : seed.start_after_ms + event.at_ms;
        if (seed.start_after_ms === null || dueMs <= seekMs) {
          this.store.deliver(seed.id, event);
        } else if (speed > 0) {
          this.timers.push(setTimeout(() => this.store.deliver(seed.id, event), (dueMs - seekMs) / speed));
        }
      }
    }
  }

  /**
   * Runs one claim's recording again from now ("Run the AI again"). A real system
   * would call the agent; here the same recording replays, so 004822 fails the same way.
   */
  rerun(claimId: string) {
    const fixture = this.fixtures.find((f) => f.seed.id === claimId);
    if (!fixture) return;
    this.store.resetRun(claimId);
    const speed = this.options.speed > 0 ? this.options.speed : 1;
    for (const event of fixture.events) {
      this.timers.push(setTimeout(() => this.store.deliver(claimId, event), event.at_ms / speed));
    }
  }

  stop() {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
  }
}

export function speedFromEnv(value = process.env.REPLAY_SPEED): number {
  const speed = Number(value ?? 1);
  if (!Number.isFinite(speed) || speed < 0) throw new Error(`REPLAY_SPEED must be a number ≥ 0, got "${value}"`);
  return speed;
}

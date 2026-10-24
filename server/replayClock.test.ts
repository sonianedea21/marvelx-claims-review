import { FIXTURES_DIR, loadFixturePack } from './fixtures';
import { ReplayClock, speedFromEnv } from './replayClock';
import { ClaimStore } from './store';

const fixtures = loadFixturePack(FIXTURES_DIR);

describe('ReplayClock', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function start(speed: number, seekMs = 0) {
    const store = new ClaimStore(fixtures);
    const clock = new ReplayClock(fixtures, store, { speed, seekMs });
    clock.restart();
    const status = (id: string) => store.detail(id)!.claim.status;
    return { store, clock, status };
  }

  it('loads 004809 in full at once and leaves the others queued', () => {
    const { status } = start(1);
    expect(status('clm_4809')).toBe('needs_review');
    expect(status('clm_4830')).toBe('queued');
  });

  it('delivers events on the replay timeline', () => {
    const { status } = start(1);
    vi.advanceTimersByTime(4500); // 004822 starts at 4 s
    expect(status('clm_4822')).toBe('running');
    vi.advanceTimersByTime(31500); // its run_failed is due at 4 s + 31.75 s
    expect(status('clm_4822')).toBe('failed');
  });

  it('runs faster at a higher speed', () => {
    const { status } = start(10);
    vi.advanceTimersByTime(10_300); // 004817 finishes at 102.75 s of replay time
    expect(status('clm_4817')).toBe('needs_review');
  });

  it('seeks ahead and pauses at speed 0', () => {
    const { store } = start(0, 96000);
    vi.advanceTimersByTime(60_000);
    const detail = store.detail('clm_4817')!;
    expect(detail.claim.status).toBe('running');
    expect(detail.run.current_step?.step_id).toBe('cross_check_amounts');
  });

  it('clears decisions when restarted', () => {
    const { store, clock } = start(0, Number.MAX_SAFE_INTEGER);
    store.addDecision('clm_4830', { field_id: 'locked', action: 'accept', value: true, agent_version: 1, agent_confidence: 0.94 });
    clock.restart();
    expect(store.detail('clm_4830')!.claim.progress.decided).toBe(0);
  });
});

describe('speedFromEnv', () => {
  it('defaults to 1 and rejects nonsense', () => {
    expect(speedFromEnv(undefined)).toBe(1);
    expect(speedFromEnv('4')).toBe(4);
    expect(() => speedFromEnv('fast')).toThrow();
  });
});

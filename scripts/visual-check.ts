/**
 * Screenshots key screens at phone and laptop width. Needs `npm run dev` running.
 *
 *   npm run visual-check                      # default screens → .screenshots/
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';

const VIEWPORTS = [
  { name: '375', width: 375, height: 812 },
  { name: '1280', width: 1280, height: 800 },
];

/** seekMs: freeze the replay this far in (speed 0) before the screenshot, so shots are comparable. */
type Target = { name: string; path: string; seekMs?: number };

const GROUPS: Record<string, Target[]> = {
  default: [
    { name: 'queue-live', path: '/', seekMs: 30000 },
    { name: 'queue-done', path: '/', seekMs: 200000 },
    { name: 'queue-empty', path: '/?status=reviewed', seekMs: 200000 },
    { name: 'queue-error', path: '/?status=done', seekMs: 200000 },
    { name: 'review-4817-midrun', path: '/claims/clm_4817', seekMs: 96000 },
    { name: 'review-4817-done', path: '/claims/clm_4817', seekMs: 200000 },
    { name: 'review-4822-failed', path: '/claims/clm_4822', seekMs: 200000 },
    { name: 'dev-components', path: '/dev/components' },
    { name: 'dev-components-sheet', path: '/dev/components?sheet=bottom' },
  ],
};

function parseArgs(argv: string[]) {
  const outIndex = argv.indexOf('--out');
  const outDir = outIndex >= 0 ? argv[outIndex + 1] : '.screenshots';
  const group = argv.find((arg, i) => !arg.startsWith('--') && argv[i - 1] !== '--out') ?? 'default';
  return { group, outDir: outDir ?? '.screenshots' };
}

async function freezeReplay(seekMs: number) {
  await fetch(`${BASE_URL}/api/dev/replay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speed: 0, seek_ms: seekMs }),
  });
}

async function resumeReplay() {
  await fetch(`${BASE_URL}/api/dev/replay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speed: 1, seek_ms: 0 }),
  });
}

/** A page wider than the viewport scrolls sideways: report it with the elements that stick out. */
async function findHorizontalOverflow(page: Page, name: string, viewport: { name: string; width: number }) {
  const result = await page.evaluate((width) => {
    const scrollWidth = document.documentElement.scrollWidth;
    const culprits = [...document.querySelectorAll('body *')]
      .filter((el) => el.getBoundingClientRect().right > width + 1)
      .slice(0, 3)
      .map((el) => `<${el.tagName.toLowerCase()} class="${String(el.getAttribute('class') ?? '').slice(0, 60)}">`);
    return { scrollWidth, culprits };
  }, viewport.width);
  if (result.scrollWidth <= viewport.width) return [];
  return [`  ${name} @${viewport.name}: page is ${result.scrollWidth}px wide. Sticking out: ${result.culprits.join(', ')}`];
}

async function assertServerRunning() {
  try {
    await fetch(BASE_URL);
  } catch {
    console.error(`Nothing is running at ${BASE_URL}. Start it with \`npm run dev\` first.`);
    process.exit(1);
  }
}

async function main() {
  const { group, outDir } = parseArgs(process.argv.slice(2));
  const targets = GROUPS[group];
  if (!targets) {
    console.error(`Unknown group "${group}". Use one of: ${Object.keys(GROUPS).join(', ')}`);
    process.exit(1);
  }

  await assertServerRunning();
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();

  const problems: string[] = [];
  for (const viewport of VIEWPORTS) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    for (const target of targets) {
      if (target.seekMs !== undefined) await freezeReplay(target.seekMs);
      // 'load', not 'networkidle': SSE streams keep the network busy forever.
      await page.goto(BASE_URL + target.path, { waitUntil: 'load' });
      await page.waitForTimeout(600);
      const file = join(outDir, `${target.name}-${viewport.name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`saved ${file}`);
      problems.push(...(await findHorizontalOverflow(page, target.name, viewport)));
    }
    await page.close();
  }

  await browser.close();
  await resumeReplay();
  if (problems.length > 0) {
    console.error(`\n${problems.length} screen(s) scroll sideways:\n${problems.join('\n')}`);
    process.exitCode = 1;
  }
  console.log('Replay restarted at 1× (decisions cleared).');
}

main();

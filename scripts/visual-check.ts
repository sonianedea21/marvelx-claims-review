/**
 * Screenshots key screens at phone and laptop width. Needs `npm run dev` running.
 *
 *   npm run visual-check                      # default screens → .screenshots/
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';

const VIEWPORTS = [
  { name: '375', width: 375, height: 812 },
  { name: '1280', width: 1280, height: 800 },
];

type Target = { name: string; path: string };

const GROUPS: Record<string, Target[]> = {
  default: [
    { name: 'queue', path: '/' },
    { name: 'review-4817', path: '/claims/clm_4817' },
    { name: 'review-4822-failed', path: '/claims/clm_4822' },
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

  for (const viewport of VIEWPORTS) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    for (const target of targets) {
      await page.goto(BASE_URL + target.path, { waitUntil: 'networkidle' });
      const file = join(outDir, `${target.name}-${viewport.name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`saved ${file}`);
    }
    await page.close();
  }

  await browser.close();
}

main();

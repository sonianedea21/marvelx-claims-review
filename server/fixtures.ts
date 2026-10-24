import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ClaimSeed, DocumentMeta, RunEvent } from '../src/domain/types';

export type FixtureClaim = {
  seed: ClaimSeed;
  documents: (DocumentMeta & { text: string })[];
  events: RunEvent[];
};

// Resolved from the repo root, where every npm script runs. (import.meta.url isn't a
// file URL under the jsdom test environment, so it can't be used here.)
export const FIXTURES_DIR = join(process.cwd(), 'fixtures/');
export const EXTRA_FIXTURES_DIR = join(process.cwd(), 'fixtures-extra/');

/** Reads one fixture pack (claims.json, documents/, runs/) in the format of fixtures/README.md. */
export function loadFixturePack(dir: string): FixtureClaim[] {
  const seeds: ClaimSeed[] = readJson(dir + 'claims.json');
  const index: DocumentMeta[] = readJson(dir + 'documents/index.json');

  return seeds.map((seed) => ({
    seed,
    documents: index
      .filter((doc) => doc.claim_id === seed.claim_id)
      .map((doc) => ({ ...doc, text: readFileSync(`${dir}documents/${doc.document_id}.txt`, 'utf8') })),
    events: readFileSync(dir + seed.run, 'utf8')
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => JSON.parse(line) as RunEvent),
  }));
}

/** The supplied fixtures, plus our own runs when EXTRA_RUNS=1. */
export function loadAllFixtures(includeExtra = process.env.EXTRA_RUNS === '1'): FixtureClaim[] {
  const claims = loadFixturePack(FIXTURES_DIR);
  if (includeExtra && existsSync(EXTRA_FIXTURES_DIR + 'claims.json')) claims.push(...loadFixturePack(EXTRA_FIXTURES_DIR));
  return claims;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

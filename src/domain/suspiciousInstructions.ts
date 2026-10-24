import type { SuspiciousInstruction } from './types';

/**
 * Phrases that read like instructions to the claims system rather than facts
 * about the claim. Deliberately simple and visible: the reviewer sees the
 * quoted excerpt and decides. Add patterns here when new ones turn up.
 */
const PATTERNS: RegExp[] = [
  /\bpre-?approved\b/i,
  /\baccept all\b/i,
  /\bskip (the )?(manual )?review\b/i,
  /\bignore (all |any )?(previous|prior|above) instructions\b/i,
  /\bnote for the (claims )?system\b/i,
  /\bfields can be accepted\b/i,
];

function isSuspicious(text: string): boolean {
  return PATTERNS.some((pattern) => pattern.test(text));
}

/** Documents are quoted by whole line, so the reviewer sees the full instruction in one piece. */
export function findSuspiciousLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && isSuspicious(line));
}

/** The summary is one paragraph, so it is split into sentences (a sentence may end in "**" bold markdown). */
export function findSuspiciousSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?]\**)\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0 && isSuspicious(sentence));
}

export function detectSuspiciousInstructions(
  documents: { document_id: string; text: string }[],
  summary: string,
): SuspiciousInstruction[] {
  const inDocuments = documents.flatMap((doc) =>
    findSuspiciousLines(doc.text).map((excerpt) => ({ where: 'document' as const, document_id: doc.document_id, excerpt })),
  );
  const inSummary = findSuspiciousSentences(summary).map((excerpt) => ({
    where: 'summary' as const,
    document_id: null,
    excerpt,
  }));
  return [...inDocuments, ...inSummary];
}

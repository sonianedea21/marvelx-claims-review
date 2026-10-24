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

export function isSuspicious(text: string): boolean {
  return PATTERNS.some((pattern) => pattern.test(text));
}

/** Documents are quoted by whole line, so the reviewer sees the full instruction in one piece. */
export function findSuspiciousLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && isSuspicious(line));
}

/**
 * Splits a paragraph into sentences, keeping the whitespace after each one so
 * joining them gives the original text back. A sentence may end in "**" (bold markdown).
 */
export function splitSentences(text: string): string[] {
  // A sentence ends at . ! or ? followed by whitespace (or the end), so "685.00" and "4,415.30" stay whole.
  return text.match(/[\s\S]*?[.!?]+\**(?:\s+|$)|[\s\S]+$/g) ?? [];
}

/** The summary is one paragraph, so it is checked sentence by sentence. */
export function findSuspiciousSentences(text: string): string[] {
  return splitSentences(text)
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

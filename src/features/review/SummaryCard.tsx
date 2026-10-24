import Markdown, { type Components } from 'react-markdown';
import { isSuspicious, splitSentences } from '../../domain/suspiciousInstructions';
import { Badge, Card, Heading, Icon, LiveIndicator } from '../../ui';

// The summary is AI-written markdown. No raw HTML, no links, no images (CLAUDE.md rule 3).
const INLINE: Components = {
  p: ({ children }) => <>{children}</>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
};

/** Markdown trims whitespace, so the space after each sentence is put back outside it. */
function SummarySentence({ text }: { text: string }) {
  const trailing = /\s*$/.exec(text)?.[0] ?? '';
  return (
    <>
      <Markdown skipHtml disallowedElements={['a', 'img']} unwrapDisallowed components={INLINE}>
        {text.trimEnd()}
      </Markdown>
      {trailing && ' '}
    </>
  );
}

type Props = { summary: string; writing: boolean; failed: boolean };

/** The AI summary, open at the top. Sentences our check flags are marked, not hidden. */
export function SummaryCard({ summary, writing, failed }: Props) {
  const sentences = splitSentences(summary);
  return (
    <Card as="section" aria-labelledby="summary-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Heading level={2} id="summary-title">
          AI summary
        </Heading>
        <Badge tone="ai" icon="sparkle">
          Written by the AI
        </Badge>
      </div>
      {summary === '' ? (
        <p className="text-ink-muted">{writing ? 'The AI hasn’t started the summary yet.' : 'The AI wrote no summary.'}</p>
      ) : (
        <p className="max-w-reading leading-relaxed text-ink">
          {sentences.map((sentence, i) =>
            isSuspicious(sentence) ? (
              <span key={i} className="rounded-sm bg-danger-tint px-0.5">
                <span className="sr-only">Suspicious sentence: </span>
                <SummarySentence text={sentence} />
                <Badge tone="danger" icon="shield" className="mx-1 align-middle">
                  From the claimant's text, not a fact
                </Badge>
              </span>
            ) : (
              <SummarySentence key={i} text={sentence} />
            ),
          )}
        </p>
      )}
      {writing && <LiveIndicator className="mt-3 text-ink-muted">Still writing…</LiveIndicator>}
      {failed && summary !== '' && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-muted">
          <Icon name="x_circle" size="sm" /> The summary stops here because the AI run failed.
        </p>
      )}
    </Card>
  );
}

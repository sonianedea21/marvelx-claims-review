import { useEffect, useRef } from 'react';
import type { FieldState } from '../../domain/types';
import { Excerpt, Sheet, SidePanel, Skeleton } from '../../ui';
import { useDocument } from './useDocuments';

const CONTEXT_CHARS = 160;

type Props = { claimId: string; field: FieldState | null; documentTitles: Record<string, string>; onClose: () => void; asSheet: boolean };

/** Where a value came from: the document with the cited span highlighted. Side panel on desktop, bottom sheet on phone. */
export function SourcePanel({ claimId, field, documentTitles, onClose, asSheet }: Props) {
  const source = field?.agent.source ?? null;
  const doc = useDocument(claimId, source?.document_id ?? null);
  const markRef = useRef<HTMLDivElement>(null);
  const title = field ? field.label : 'Source';
  const eyebrow = source ? documentTitles[source.document_id] ?? source.document_id : undefined;

  // Scroll the highlight to the middle of the panel only. scrollIntoView would also
  // scroll the page, moving the fields out from under the reviewer.
  useEffect(() => {
    const mark = markRef.current?.querySelector('mark');
    const scroller = mark?.closest<HTMLElement>('[data-scroll-container]');
    if (!mark || !scroller) return;
    const offset = mark.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    scroller.scrollTop += offset - scroller.clientHeight / 2;
  }, [doc, source?.start]);

  let body;
  if (!field) {
    body = <p className="text-sm text-ink-muted">Choose “See it in the document” on a field to check it against its source.</p>;
  } else if (!source) {
    body = <p className="text-sm text-ink-muted">The AI didn't point to any document for this value. Check it by hand.</p>;
  } else if (doc === null) {
    body = <Skeleton lines={6} />;
  } else if (doc === 'error') {
    body = <p className="text-sm text-danger">Couldn't load this document. Try again in a moment.</p>;
  } else {
    // Offsets are UTF-16 code units, exactly what String.slice uses.
    const start = asSheet ? Math.max(0, source.start - CONTEXT_CHARS) : 0;
    const end = asSheet ? Math.min(doc.text.length, source.end + CONTEXT_CHARS) : doc.text.length;
    body = (
      <div ref={markRef}>
        <Excerpt
          before={doc.text.slice(start, source.start)}
          highlight={doc.text.slice(source.start, source.end)}
          after={doc.text.slice(source.end, end)}
          truncatedStart={start > 0}
          truncatedEnd={end < doc.text.length}
        />
      </div>
    );
  }

  if (asSheet) {
    return (
      <Sheet open={field !== null} onOpenChange={(open) => !open && onClose()} title={title} description={eyebrow}>
        {body}
      </Sheet>
    );
  }
  return (
    <SidePanel title={title} eyebrow={eyebrow ?? 'Source document'} onClose={field ? onClose : undefined}>
      {body}
    </SidePanel>
  );
}

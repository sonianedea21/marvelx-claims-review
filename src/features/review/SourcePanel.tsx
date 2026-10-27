import { useEffect, useRef, type ReactNode } from 'react';
import { formatValue } from '../../domain/format';
import type { FieldState } from '../../domain/types';
import { ConfidenceLabel, Excerpt, Sheet, SidePanel, Skeleton } from '../../ui';
import { fieldTrust } from './reviewCopy';
import { useDocument } from './useDocuments';

type Props = {
  claimId: string;
  field: FieldState | null;
  documentTitles: Record<string, string>;
  onClose: () => void;
  asSheet: boolean;
  /** Phone only: the decision actions, pinned under the document. */
  actions?: ReactNode;
};

/** Where a value came from: the document with the cited span highlighted. Side panel on desktop, bottom sheet on phone. */
export function SourcePanel({ claimId, field, documentTitles, onClose, asSheet, actions }: Props) {
  const source = field?.agent.source ?? null;
  const doc = useDocument(claimId, source?.document_id ?? null);
  const markRef = useRef<HTMLDivElement>(null);
  const title = field ? field.label : 'Source';
  const eyebrow = source ? documentTitles[source.document_id] ?? source.document_id : undefined;
  // What the AI says, kept in the header so it stays next to the document while the reviewer compares.
  const aiSays = field && <AiSays field={field} />;

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
    body = (
      <div ref={markRef}>
        <Excerpt
          before={doc.text.slice(0, source.start)}
          highlight={doc.text.slice(source.start, source.end)}
          after={doc.text.slice(source.end)}
        />
      </div>
    );
  }

  if (asSheet) {
    return (
      <Sheet
        open={field !== null}
        onOpenChange={(open) => !open && onClose()}
        title={title}
        description={
          aiSays && (
            <>
              {aiSays}
              {eyebrow && <span className="block">From {eyebrow}</span>}
            </>
          )
        }
        footer={actions}
        height="full"
      >
        {body}
      </Sheet>
    );
  }
  return (
    <SidePanel title={title} eyebrow={eyebrow ?? 'Source document'} description={aiSays} onClose={field ? onClose : undefined}>
      {body}
    </SidePanel>
  );
}

/** "AI says: 22:40" with how far to trust it. Long values are cut to two lines; the field card has them in full. */
function AiSays({ field }: { field: FieldState }) {
  const trust = fieldTrust(field);
  return (
    <span className="block space-y-0.5">
      <span className="line-clamp-2 block text-ink">
        AI says: <strong className="font-semibold">{formatValue(field.agent.value, field.value_type)}</strong>
      </span>
      <ConfidenceLabel label={trust.label} detail={trust.detail} tone={trust.tone} />
    </span>
  );
}

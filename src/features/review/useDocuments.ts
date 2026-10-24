import { useEffect, useState } from 'react';
import { api } from '../../api/claims';

type Doc = { title: string; text: string };

/** Loads source documents for a claim on demand and keeps them for the session. */
export function useDocument(claimId: string, documentId: string | null) {
  const [docs, setDocs] = useState<Record<string, Doc | 'error'>>({});

  useEffect(() => {
    if (!documentId || docs[documentId]) return;
    api.document(claimId, documentId).then(
      (doc) => setDocs((d) => ({ ...d, [documentId]: { title: doc.title, text: doc.text } })),
      () => setDocs((d) => ({ ...d, [documentId]: 'error' })),
    );
  }, [claimId, documentId, docs]);

  return documentId ? docs[documentId] ?? null : null;
}

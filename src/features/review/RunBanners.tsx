import type { ClaimDetail } from '../../domain/types';
import { Banner, Button, Disclosure, Excerpt, Icon } from '../../ui';
import { failureGuidance } from './failureCopy';

type Props = {
  detail: ClaimDetail;
  acknowledging: boolean;
  onAcknowledge: () => void;
  retrying: boolean;
  onRetry: () => void;
};

/** What must be seen before anything else: suspicious instructions, a failed run, and checks a finished run skipped. */
export function RunBanners({ detail, acknowledging, onAcknowledge, retrying, onRetry }: Props) {
  const fromDocuments = detail.suspicious_instructions.filter((s) => s.where === 'document');
  const inSummary = detail.suspicious_instructions.some((s) => s.where === 'summary');
  const acknowledged = detail.review.warning_acknowledged_at !== null;
  const titles = Object.fromEntries(detail.documents.map((d) => [d.document_id, d.title]));
  const error = detail.run.error;
  const missing = detail.claim.missing_checks;

  return (
    <>
      {detail.suspicious_instructions.length > 0 && (
        // One collapsible in both states: open until the reviewer has read it, folded (but re-openable) after.
        <Disclosure
          key={acknowledged ? 'read' : 'unread'}
          tone="danger"
          defaultOpen={!acknowledged}
          summary={
            <span className="flex items-center gap-2 text-danger">
              <Icon name="shield" size="sm" />
              {acknowledged
                ? "You've read the warning: a document tries to instruct the claims system"
                : 'A document on this claim tries to instruct the claims system'}
            </span>
          }
        >
          <div className="space-y-3">
            {fromDocuments.map((s, i) => (
              <div key={i} className="space-y-1">
                <p className="text-xs text-ink-muted">In “{s.document_id ? titles[s.document_id] : 'a document'}”:</p>
                <Excerpt tone="suspicious" highlight={s.excerpt} />
              </div>
            ))}
            <p className="text-sm text-ink">
              {inSummary ? 'The AI summary repeats this as if it were a fact. ' : ''}
              Nothing has been pre-approved. Review every field as normal: claimants can't approve their own claims.
            </p>
            {!acknowledged && (
              <Button variant="primary" loading={acknowledging} onClick={onAcknowledge}>
                I've read this, continue reviewing
              </Button>
            )}
          </div>
        </Disclosure>
      )}

      {error && (
        <Banner
          tone="danger"
          title={`The AI stopped before finishing: ${detail.run.steps.find((s) => s.step_id === error.step_id)?.label ?? error.step_id}`}
          actions={
            error.retryable && (
              <Button variant="primary" icon="refresh" loading={retrying} onClick={onRetry}>
                Run the AI again
              </Button>
            )
          }
        >
          <p className="text-ink">{failureGuidance(error.code, error.retryable).cause}</p>
          <p className="text-ink">
            <strong>What to do:</strong> {failureGuidance(error.code, error.retryable).nextStep}
            {error.retryable && ' Your decisions so far are kept.'}
          </p>
          <p className="text-xs">
            The AI said: “{error.message}” · error code <code className="font-mono">{error.code}</code>
          </p>
          <p>
            You can still check the {detail.fields.length} {detail.fields.length === 1 ? 'field' : 'fields'} it found, but the
            review can't be completed until a full run finishes. Anything it didn't get to hasn't been checked at all.
          </p>
        </Banner>
      )}

      {missing.length > 0 && (
        // "Finished" isn't "complete": 004830 finishes without ever looking up the policy.
        <Banner tone="attention" icon="search_off" title={`The AI finished without checking ${missing.map((m) => m.what).join(' or ')}`}>
          <p className="text-ink">
            The fields below can all look fine and still not be the whole picture. Check{' '}
            {missing.map((m) => m.what).join(' and ')} yourself before relying on this review.
          </p>
        </Banner>
      )}
    </>
  );
}

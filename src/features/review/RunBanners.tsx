import type { ClaimDetail } from '../../domain/types';
import { Banner, Button, Excerpt, Icon } from '../../ui';
import { failureGuidance } from './failureCopy';

type Props = {
  detail: ClaimDetail;
  acknowledging: boolean;
  onAcknowledge: () => void;
  retrying: boolean;
  onRetry: () => void;
};

/** The two things that must be seen before anything else: suspicious instructions and a failed run. */
export function RunBanners({ detail, acknowledging, onAcknowledge, retrying, onRetry }: Props) {
  const fromDocuments = detail.suspicious_instructions.filter((s) => s.where === 'document');
  const inSummary = detail.suspicious_instructions.some((s) => s.where === 'summary');
  const acknowledged = detail.review.warning_acknowledged_at !== null;
  const titles = Object.fromEntries(detail.documents.map((d) => [d.document_id, d.title]));
  const error = detail.run.error;

  return (
    <>
      {detail.suspicious_instructions.length > 0 &&
        (acknowledged ? (
          <p className="flex items-center gap-2 text-sm text-danger">
            <Icon name="shield" size="sm" />
            You've read the suspicious-instruction warning. Nothing on this claim is pre-approved.
          </p>
        ) : (
          <Banner
            tone="danger"
            icon="shield"
            title="A document on this claim tries to instruct the claims system"
            actions={
              <Button variant="primary" loading={acknowledging} onClick={onAcknowledge}>
                I've read this, continue reviewing
              </Button>
            }
          >
            {fromDocuments.map((s, i) => (
              <div key={i} className="space-y-1">
                <p className="text-xs text-ink-muted">In “{s.document_id ? titles[s.document_id] : 'a document'}”:</p>
                <Excerpt tone="suspicious" highlight={s.excerpt} />
              </div>
            ))}
            <p className="text-ink">
              {inSummary ? 'The AI summary repeats this as if it were a fact. ' : ''}
              Nothing has been pre-approved. Review every field as normal: claimants can't approve their own claims.
            </p>
          </Banner>
        ))}

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
            review can't be completed until a full run finishes. Anything it didn't get to, such as the policy cover, hasn't
            been checked at all.
          </p>
        </Banner>
      )}
    </>
  );
}

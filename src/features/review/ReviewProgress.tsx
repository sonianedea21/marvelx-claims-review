import type { ClaimDetail } from '../../domain/types';
import { Banner, Button, ProgressBar } from '../../ui';
import { blockerCopy } from './reviewCopy';

type Props = { detail: ClaimDetail; attentionCount: number; completing: boolean; onComplete: () => void; error: string | null };

/** "Where am I?": how many fields are decided, and what still stands between the reviewer and done. */
export function ReviewProgress({ detail, attentionCount, completing, onComplete, error }: Props) {
  const { decided, total } = detail.claim.progress;
  const counts = { undecided: total - decided, outdated: detail.claim.open_conflicts };
  const blockers = detail.review.blockers;

  if (detail.claim.status === 'reviewed') {
    return <Banner tone="success" title="Review complete">You decided every field on this claim.</Banner>;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="flex flex-wrap justify-between gap-x-4 text-sm">
          <span className="font-medium">
            {decided} of {total} fields decided
          </span>
          {attentionCount > 0 && <span className="font-medium text-attention">{attentionCount} need your attention</span>}
        </p>
        <ProgressBar value={decided} max={total} label={`${decided} of ${total} fields decided`} />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button variant="primary" disabled={blockers.length > 0} loading={completing} onClick={onComplete}>
          Complete review
        </Button>
        {blockers.length > 0 && (
          <ul className="text-sm text-ink-muted" aria-label="Before you can complete this review">
            {blockers.map((b) => (
              <li key={b}>· {blockerCopy(b, counts, detail.run.phase === 'failed')}</li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-sm font-medium text-danger" role="alert">{error}</p>}
    </div>
  );
}

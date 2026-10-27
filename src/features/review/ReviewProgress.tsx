import type { ClaimDetail } from '../../domain/types';
import { Banner, Button, ProgressBar } from '../../ui';
import { blockerCopy } from './reviewCopy';

type Props = {
  detail: ClaimDetail;
  attentionCount: number;
  busy: boolean;
  onComplete: () => void;
  onReopen: () => void;
  error: string | null;
};

/** "Where am I?": how many fields are decided, and what still stands between the reviewer and done. */
export function ReviewProgress({ detail, attentionCount, busy, onComplete, onReopen, error }: Props) {
  const { decided, total } = detail.claim.progress;
  const counts = {
    undecided: total - decided,
    outdated: detail.claim.open_conflicts,
    derived: detail.fields.filter((f) => f.inputs_changed_since_decision).length,
  };
  const blockers = detail.review.blockers
    .map((b) => blockerCopy(b, counts, detail.run.phase === 'failed'))
    .filter((text): text is string => text !== null);

  if (detail.claim.status === 'reviewed') {
    return (
      <Banner
        tone="success"
        title="Review complete"
        actions={<Button loading={busy} onClick={onReopen}>Reopen review</Button>}
      >
        <p>You decided every field on this claim. It's locked; reopen it to change a decision. Your decisions are kept.</p>
      </Banner>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="flex flex-wrap justify-between gap-x-4 text-sm">
          <span className="font-medium">
            {decided} of {total} fields decided
          </span>
          {attentionCount > 0 && <span className="font-medium text-attention">{attentionCount} need a look</span>}
        </p>
        <ProgressBar value={decided} max={total} label={`${decided} of ${total} fields decided`} />
        {blockers.length > 0 && <p className="text-xs text-ink-muted">Before you can complete: {blockers.join(' · ')}.</p>}
        {error && <p className="text-sm font-medium text-danger" role="alert">{error}</p>}
      </div>
      <Button variant="primary" disabled={detail.review.blockers.length > 0} loading={busy} onClick={onComplete}>
        Complete review
      </Button>
    </div>
  );
}

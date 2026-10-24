import { Link } from 'react-router';
import type { ClaimDetail } from '../../domain/types';
import { Badge, cx, Eyebrow, Heading, Icon, LiveIndicator } from '../../ui';
import { confidenceCopy } from '../shared/confidenceCopy';
import { PRIORITY_LABEL, STATUS_DISPLAY } from '../queue/statusDisplay';

/** Claim identity, plus a bar that stays visible while the AI is still working. */
export function ClaimHeader({ detail }: { detail: ClaimDetail }) {
  const { claim, run } = detail;
  const status = STATUS_DISPLAY[claim.status];

  return (
    <>
      <div className="space-y-1">
        <BackLink className="hidden lg:inline-flex" />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex w-full items-start justify-between gap-3 lg:w-auto">
            <div className="min-w-0 space-y-1">
              <Eyebrow>
                {claim.claim_id} · {claim.product}
              </Eyebrow>
              <Heading level={1}>{claim.claimant_name}</Heading>
            </div>
            <BackLink className="inline-flex shrink-0 lg:hidden" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {claim.priority === 'high' ? (
              <Badge tone="attention" emphasis="solid">{PRIORITY_LABEL.high}</Badge>
            ) : (
              <span className="text-sm text-ink-subtle">{PRIORITY_LABEL[claim.priority]}</span>
            )}
            {claim.status !== 'running' && (
              <Badge tone={status.tone} icon={status.icon}>
                {status.label}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {run.phase === 'finished' && run.overall_confidence !== null && (
        <p className="text-sm text-ink-muted">
          The AI finished. Overall confidence {confidenceCopy(run.overall_confidence).percent} ·{' '}
          {confidenceCopy(run.overall_confidence).label}.
        </p>
      )}
    </>
  );
}

/** "The AI is still working": shown in the sticky bar at the top of the review page. */
export function RunBar({ detail }: { detail: ClaimDetail }) {
  const { run } = detail;
  if (run.phase !== 'running') return null;
  return (
    <LiveIndicator className="font-medium text-ai-strong">
      {run.current_step ? `The AI is still working · ${run.current_step.label}.` : 'The AI is starting.'} Fields can still change.
    </LiveIndicator>
  );
}

function BackLink({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cx('min-h-11 items-center gap-1 text-sm text-ink-muted hover:text-ink focus-visible:focus-ring', className)}
    >
      <Icon name="arrow_left" size="sm" /> Queue
    </Link>
  );
}

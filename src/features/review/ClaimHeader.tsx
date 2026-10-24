import { Link } from 'react-router';
import type { ClaimDetail } from '../../domain/types';
import { Badge, Eyebrow, Heading, Icon, LiveIndicator } from '../../ui';
import { confidenceCopy } from '../shared/confidenceCopy';
import { PRIORITY_LABEL, STATUS_DISPLAY } from '../queue/statusDisplay';

/** Claim identity, plus a bar that stays visible while the AI is still working. */
export function ClaimHeader({ detail }: { detail: ClaimDetail }) {
  const { claim, run } = detail;
  const status = STATUS_DISPLAY[claim.status];

  return (
    <>
      <div className="space-y-3">
        <Link to="/" className="inline-flex min-h-11 items-center gap-1 text-sm text-ink-muted hover:text-ink focus-visible:focus-ring">
          <Icon name="arrow_left" size="sm" /> Queue
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <Eyebrow>
              {claim.claim_id} · {claim.product}
            </Eyebrow>
            <Heading level={1}>{claim.claimant_name}</Heading>
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

      {run.phase === 'running' && (
        <div className="sticky top-0 z-30 -mx-4 border-b border-line bg-ai-tint px-4 py-2 sm:mx-0 sm:rounded-md sm:border">
          <LiveIndicator className="font-medium text-ai-strong">
            The AI is still working{run.current_step ? ` · ${run.current_step.label}` : '…'}. Fields can still change.
          </LiveIndicator>
        </div>
      )}
      {run.phase === 'finished' && run.overall_confidence !== null && (
        <p className="text-sm text-ink-muted">
          The AI finished. Overall confidence {confidenceCopy(run.overall_confidence).percent} ·{' '}
          {confidenceCopy(run.overall_confidence).label}.
        </p>
      )}
    </>
  );
}

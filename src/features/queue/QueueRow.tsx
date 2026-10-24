import { Link } from 'react-router';
import type { QueueItem } from '../../domain/types';
import { Badge, Eyebrow, Icon, LiveIndicator, ProgressBar } from '../../ui';
import { confidenceCopy } from '../shared/confidenceCopy';
import { PRIORITY_LABEL, STATUS_DISPLAY } from './statusDisplay';

export function QueueRow({ claim }: { claim: QueueItem }) {
  const status = STATUS_DISPLAY[claim.status];
  const { decided, total } = claim.progress;

  return (
    <li>
      <Link
        to={`/claims/${claim.id}`}
        className="group grid gap-3 rounded-lg border border-line bg-surface p-4 shadow-sm transition-colors duration-150 hover:border-line-strong focus-visible:focus-ring sm:grid-cols-12 sm:items-center sm:gap-4 sm:px-5"
      >
        <div className="min-w-0 sm:col-span-4">
          <Eyebrow>
            {claim.claim_id} · {claim.product}
          </Eyebrow>
          <p className="truncate text-base font-semibold group-hover:underline">{claim.claimant_name}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:col-span-4">
          {claim.status === 'running' ? (
            <LiveIndicator className="font-medium text-ai-strong">AI is working</LiveIndicator>
          ) : (
            <Badge tone={status.tone} icon={status.icon}>
              {status.label}
            </Badge>
          )}
          {claim.priority === 'high' && (
            <Badge tone="attention" emphasis="solid">
              {PRIORITY_LABEL.high}
            </Badge>
          )}
          {claim.priority !== 'high' && <span className="text-xs text-ink-subtle">{PRIORITY_LABEL[claim.priority]}</span>}
          {claim.suspicious_instructions && (
            <Badge tone="danger" icon="shield">
              Suspicious instruction
            </Badge>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-3">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span>{total === 0 ? 'No fields yet' : `${decided} of ${total} decided`}</span>
            {claim.needs_attention > 0 && (
              <span className="font-medium text-attention">{claim.needs_attention} need a look</span>
            )}
          </div>
          <ProgressBar value={decided} max={total} label={`${decided} of ${total} fields decided`} />
          {claim.confidence !== null && (
            <p className="text-xs text-ink-subtle">
              Overall AI confidence {confidenceCopy(claim.confidence).percent} · {confidenceCopy(claim.confidence).label}
            </p>
          )}
        </div>

        <Icon name="chevron_right" className="hidden justify-self-end text-ink-subtle sm:col-span-1 sm:block" />
      </Link>
    </li>
  );
}

import { useState } from 'react';
import { Link } from 'react-router';
import { api } from '../../api/claims';
import type { QueueItem } from '../../domain/types';
import { Badge, Button, Eyebrow, Icon, LiveIndicator, ProgressBar, Tooltip } from '../../ui';
import { confidenceCopy } from '../shared/confidenceCopy';
import { PRIORITY_LABEL, STATUS_DISPLAY } from './statusDisplay';

export function QueueRow({ claim }: { claim: QueueItem }) {
  const status = STATUS_DISPLAY[claim.status];
  const { decided, total } = claim.progress;
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  async function retry() {
    setRetrying(true);
    setRetryError(null);
    await api.retry(claim.id).catch((e: Error) => setRetryError(e.message));
    setRetrying(false);
  }

  return (
    // The claimant's name is a "stretched" link covering the whole row; the few
    // controls on the row sit above it (relative z-10), since buttons can't live inside a link.
    <li className="group relative grid gap-3 rounded-lg border border-line bg-surface p-4 shadow-sm transition-colors duration-150 hover:border-line-strong has-focus-visible:focus-ring sm:grid-cols-12 sm:items-center sm:gap-4 sm:px-5">
      <div className="min-w-0 sm:col-span-4">
        <Eyebrow>
          {claim.claim_id} · {claim.product}
        </Eyebrow>
        <Link
          to={`/claims/${claim.id}`}
          className="block truncate text-base font-semibold outline-none group-hover:underline after:absolute after:inset-0 after:rounded-lg"
        >
          {claim.claimant_name}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:col-span-4">
        {claim.status === 'running' ? (
          <LiveIndicator className="font-medium text-ai-strong">AI is working</LiveIndicator>
        ) : claim.run_error ? (
          <Tooltip content={<>The AI said: “{claim.run_error.message}”</>}>
            <button type="button" className="relative z-10 rounded-sm focus-visible:focus-ring" aria-label={`${status.label}. The AI said: ${claim.run_error.message}`}>
              <Badge tone={status.tone} icon={status.icon}>
                {status.label}
              </Badge>
            </button>
          </Tooltip>
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
        {claim.missing_checks.map((check) => (
          <Badge key={check.step_id} tone="attention" icon="search_off">
            {`Didn't check ${check.what}`}
          </Badge>
        ))}
      </div>

      <div className="space-y-1.5 sm:col-span-3">
        {claim.run_error?.retryable ? (
          <div className="relative z-10 space-y-1">
            <Button size="sm" variant="primary" icon="refresh" loading={retrying} onClick={retry}>
              Run the AI again
            </Button>
            {retryError && <p className="text-sm text-danger" role="alert">{retryError}</p>}
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      <Icon name="chevron_right" className="hidden justify-self-end text-ink-subtle sm:col-span-1 sm:block" />
    </li>
  );
}

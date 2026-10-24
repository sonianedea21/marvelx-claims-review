import { CLAIM_STATUSES, PRIORITIES, type ClaimStatus, type Priority } from '../../domain/types';
import { ChoiceGroup } from '../../ui';
import { STATUS_DISPLAY } from './statusDisplay';

type Props = {
  status: ClaimStatus | 'all';
  priority: Priority | 'all';
  onChange: (next: { status: ClaimStatus | 'all'; priority: Priority | 'all' }) => void;
};

export function QueueFilters({ status, priority, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
      <ChoiceGroup
        name="status"
        legend="Status"
        value={status}
        options={[{ value: 'all', label: 'All' }, ...CLAIM_STATUSES.map((s) => ({ value: s, label: STATUS_DISPLAY[s].label }))]}
        onChange={(next) => onChange({ status: next, priority })}
      />
      <ChoiceGroup
        name="priority"
        legend="Priority"
        value={priority}
        options={[{ value: 'all', label: 'All' }, ...PRIORITIES.map((p) => ({ value: p, label: p[0]!.toUpperCase() + p.slice(1) }))]}
        onChange={(next) => onChange({ status, priority: next })}
      />
    </div>
  );
}

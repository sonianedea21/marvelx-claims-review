// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { record } from '../../../server/testFixtures';
import { buildClaimDetail } from '../../domain/buildClaimDetail';
import type { FieldState, ReviewerDecision } from '../../domain/types';
import { DecisionPanel } from './DecisionPanel';

afterEach(cleanup);

/** 004817 total_incl_vat as the reviewer sees it at `untilMs`, optionally with a decision. */
function totalField(untilMs: number, decisions: ReviewerDecision[] = []): FieldState {
  const rec = { ...record('clm_4817', untilMs), decisions };
  return buildClaimDetail(rec).fields.find((f) => f.field_id === 'total_incl_vat')!;
}

const acceptedV1: ReviewerDecision = {
  id: 'dec_1', claim_id: 'CLM-2026-004817', field_id: 'total_incl_vat', action: 'accept',
  value: { amount: '3605.80', currency: 'EUR' }, agent_version: 1, agent_confidence: 0.88,
  at: '2026-10-24T10:00:00Z', reviewer: 'reviewer',
};

function renderPanel(field: FieldState, decide = vi.fn().mockResolvedValue(true)) {
  const utils = render(<DecisionPanel field={field} locked={false} saving={false} serverError={undefined} decide={decide} />);
  return { ...utils, decide };
}

describe('DecisionPanel', () => {
  it('never silently replaces a decision the AI later changed: it asks', () => {
    renderPanel(totalField(Infinity, [acceptedV1]));
    expect(screen.getByText('You accepted this, but the AI changed it since')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Keep mine (€3,605.80)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Review again' })).toBeTruthy();
  });

  it('"Keep mine" overrides the new AI value with the reviewer\'s, against the new version', () => {
    const { decide } = renderPanel(totalField(Infinity, [acceptedV1]));
    fireEvent.click(screen.getByRole('button', { name: 'Keep mine (€3,605.80)' }));
    expect(decide).toHaveBeenCalledWith('override', 2, { amount: '3605.80', currency: 'EUR' });
  });

  it('keeps the editor open with the reviewer\'s draft when the AI revises mid-edit', () => {
    const { rerender, decide } = renderPanel(totalField(50000));
    fireEvent.click(screen.getByRole('button', { name: 'Correct' }));
    fireEvent.change(screen.getByLabelText(/amount in EUR/), { target: { value: '3700.00' } });

    // The revision lands (version 2) while the reviewer is typing.
    rerender(<DecisionPanel field={totalField(Infinity)} locked={false} saving={false} serverError={undefined} decide={decide} />);

    expect(screen.getByText('The AI changed this while you were editing')).toBeTruthy();
    expect((screen.getByLabelText(/amount in EUR/) as HTMLInputElement).value).toBe('3700.00');
    fireEvent.click(screen.getByRole('button', { name: 'Save my value anyway' }));
    expect(decide).toHaveBeenCalledWith('correct', 2, { amount: '3700.00', currency: 'EUR' });
  });

  it('validates by value type before sending anything', () => {
    const { decide } = renderPanel(totalField(50000));
    fireEvent.click(screen.getByRole('button', { name: 'Correct' }));
    fireEvent.change(screen.getByLabelText(/amount in EUR/), { target: { value: '€ 3,700' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save correction' }));
    expect(screen.getByRole('alert').textContent).toContain('without a currency sign');
    expect(decide).not.toHaveBeenCalled();
  });
});

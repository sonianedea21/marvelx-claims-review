// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { record } from '../../../server/testFixtures';
import { buildClaimDetail } from '../../domain/buildClaimDetail';
import type { ClaimDetail } from '../../domain/types';
import { ReviewPage } from './ReviewPage';

// The page gets its snapshots from useLiveData; the test hands it fixture snapshots instead of a server.
const live = vi.hoisted(() => ({ detail: null as ClaimDetail | null }));
vi.mock('../../api/useLiveData', () => ({
  useLiveData: () => ({ data: live.detail, error: null, connection: 'live', retry: () => undefined }),
}));

// Browser APIs jsdom doesn't have. Phone width: no side panel, so no document fetch.
class NoopObserver {
  observe() {}
  disconnect() {}
}
beforeAll(() => {
  vi.stubGlobal('ResizeObserver', NoopObserver);
  vi.stubGlobal('IntersectionObserver', NoopObserver);
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false, media: query, addEventListener: () => undefined, removeEventListener: () => undefined,
  }));
});
afterAll(() => vi.unstubAllGlobals());
afterEach(cleanup);

// A new element each time: rerendering the same element object would let React skip the update.
const page = () => (
  <MemoryRouter initialEntries={['/claims/clm_4817']}>
    <Routes>
      <Route path="/claims/:id" element={<ReviewPage />} />
    </Routes>
  </MemoryRouter>
);

describe('ReviewPage', () => {
  it('keeps an in-progress correction when the AI grows surer about that field', () => {
    // 60 s into 004817: incident_location is at 72%, so it needs a look.
    live.detail = buildClaimDetail(record('clm_4817', 60000));
    const { rerender } = render(page());
    const card = document.getElementById('field-incident_location')!;
    fireEvent.click(within(card).getByRole('button', { name: 'Correct' }));
    fireEvent.change(screen.getByLabelText("Correct the AI's value"), { target: { value: 'Wibautstraat / Ringdijk' } });

    // 64 s: confidence_changed raises it to 93%. It used to move to "Looks fine" and lose the edit.
    live.detail = buildClaimDetail(record('clm_4817', 65000));
    rerender(page());

    expect((screen.getByLabelText("Correct the AI's value") as HTMLInputElement).value).toBe('Wibautstraat / Ringdijk');
    const stillHere = document.getElementById('field-incident_location')!;
    expect(stillHere.closest('section')!.id).toBe('look');
    expect(within(stillHere).getByText('AI changed how sure it is')).toBeTruthy();
  });
});

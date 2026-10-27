import type { ReactNode } from 'react';
import { Icon } from './Icon';

type SidePanelProps = {
  title: ReactNode;
  eyebrow?: ReactNode;
  /** Under the title, outside the scrolling body, so it stays in view (like Sheet's description). */
  description?: ReactNode;
  onClose?: () => void;
  children: ReactNode;
};

/**
 * A non-modal panel that sits beside the content on wide screens (no scrim, no focus trap),
 * so the reviewer can compare a value with its source. On phones use Sheet instead.
 */
export function SidePanel({ title, eyebrow, description, onClose, children }: SidePanelProps) {
  return (
    <aside className="sticky top-(--sticky-offset) flex max-h-screen flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          {eyebrow && <p className="font-mono text-xs tracking-label text-ink-subtle uppercase">{eyebrow}</p>}
          <h2 className="font-serif text-lg text-ink">{title}</h2>
          {description && <div className="mt-1 text-sm text-ink-muted">{description}</div>}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-sunken focus-visible:focus-ring"
          >
            <Icon name="x" label="Close source" />
          </button>
        )}
      </div>
      <div data-scroll-container className="min-h-0 flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </aside>
  );
}

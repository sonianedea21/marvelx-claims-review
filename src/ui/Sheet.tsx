import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** bottom: phone. right: a side panel on wider screens. */
  side?: 'bottom' | 'right';
  children: ReactNode;
  /** Pinned below the scrolling content, e.g. the actions for what's shown. */
  footer?: ReactNode;
  /** content: as tall as its content (filters). full: nearly the whole screen (a document). Bottom sheets only. */
  height?: 'content' | 'full';
};

/** A modal panel that slides in from the bottom or the right. Radix handles focus trapping and Escape. */
export function Sheet({ open, onOpenChange, title, description, side = 'bottom', children, footer, height = 'content' }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim" />
        <Dialog.Content
          // A dialog opened from inside the sheet (e.g. a confirmation) is not "outside":
          // without this, the sheet would close and take that dialog's owner with it.
          onInteractOutside={(event) => {
            const target = event.detail.originalEvent.target as HTMLElement | null;
            if (target?.closest('[role="dialog"], [role="alertdialog"]')) event.preventDefault();
          }}
          className={cx(
            'fixed z-50 flex flex-col bg-surface shadow-lg focus-visible:outline-none',
            side === 'bottom'
              ? cx('inset-x-0 bottom-0 rounded-t-lg', height === 'full' ? 'top-12' : 'sheet-max-h')
              : 'inset-y-0 right-0 w-full max-w-reading border-l border-line',
          )}
        >
          {side === 'bottom' && <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-line-strong" aria-hidden />}
          <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
            <div className="min-w-0">
              <Dialog.Title className="font-serif text-lg text-ink">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-sm text-ink-muted">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">Details</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-ink-muted hover:bg-sunken focus-visible:focus-ring">
              <Icon name="x" label="Close" />
            </Dialog.Close>
          </div>
          <div data-scroll-container className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
            {children}
          </div>
          {footer && <div className="border-t border-line bg-surface p-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

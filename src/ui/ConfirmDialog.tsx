import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { Button } from './Button';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  /** The safer choice comes first and gets focus. */
  safeLabel: string;
  onSafe: () => void;
  riskyLabel: string;
  onRisky: () => void;
};

/** Asks before a risky action. The safe option is primary and focused; Escape cancels. */
export function ConfirmDialog({ open, onOpenChange, title, children, safeLabel, onSafe, riskyLabel, onRisky }: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim" />
        <Dialog.Content className="fixed inset-x-4 top-1/4 z-50 mx-auto max-w-reading space-y-4 rounded-lg bg-surface p-5 shadow-lg focus-visible:outline-none">
          <Dialog.Title className="font-serif text-lg text-ink">{title}</Dialog.Title>
          <Dialog.Description asChild>
            <div className="space-y-2 text-ink-muted">{children}</div>
          </Dialog.Description>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={onSafe} autoFocus>
              {safeLabel}
            </Button>
            <Button onClick={onRisky}>{riskyLabel}</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

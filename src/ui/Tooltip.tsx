import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

type TooltipProps = { content: ReactNode; children: ReactNode };

/**
 * Extra detail on hover or keyboard focus. The trigger must be focusable (a button,
 * or pass something with tabIndex). Never put the only copy of important text in here.
 */
export function Tooltip({ content, children }: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={150}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            sideOffset={6}
            className="z-50 max-w-reading rounded-md bg-ink px-3 py-2 text-sm text-ink-inverse shadow-md"
          >
            {content}
            <RadixTooltip.Arrow className="fill-ink" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}

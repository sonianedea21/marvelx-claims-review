import { useEffect, useState } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

/** A floating "back to top" button that appears once the page is scrolled well down. */
/** `className` is for placement only, e.g. raising it above a bottom bar. */
export function BackToTop({ className }: { className?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 800);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })}
      className={cx(
        'fixed right-4 bottom-4 z-30 inline-flex size-11 items-center justify-center rounded-full bg-ink text-ink-inverse shadow-md hover:bg-ink-muted focus-visible:focus-ring sm:right-6 sm:bottom-6',
        className,
      )}
    >
      <Icon name="chevron_down" className="rotate-180" label="Back to top" />
    </button>
  );
}

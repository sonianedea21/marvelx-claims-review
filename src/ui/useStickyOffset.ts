import { useCallback } from 'react';

/**
 * Measures a sticky header and publishes its height as --sticky-offset, so
 * sticky panels and jump targets (`top-(--sticky-offset)`, `scroll-mt-(--sticky-offset)`)
 * sit just below it at any screen width.
 *
 * Returns a callback ref rather than using an effect, because the header often
 * mounts after the first render (once data has loaded).
 */
export function useStickyOffset<T extends HTMLElement>() {
  return useCallback((element: T | null) => {
    if (!element) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      root.style.setProperty('--sticky-offset', `${Math.ceil(element.getBoundingClientRect().height) + 12}px`);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.setProperty('--sticky-offset', '0px');
    };
  }, []);
}

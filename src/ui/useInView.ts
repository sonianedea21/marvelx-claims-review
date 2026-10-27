import { useCallback, useState } from 'react';

/**
 * Whether an element is on screen. Returns a callback ref to put on the element
 * (a callback ref, like useStickyOffset, because the element often mounts after
 * the first render). Starts as true, so nothing that depends on it flashes in
 * before the first measurement.
 */
export function useInView<T extends Element>(): [(element: T | null) => void, boolean] {
  const [inView, setInView] = useState(true);
  const ref = useCallback((element: T | null) => {
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry!.isIntersecting));
    observer.observe(element);
    return () => {
      observer.disconnect();
      setInView(true);
    };
  }, []);
  return [ref, inView];
}

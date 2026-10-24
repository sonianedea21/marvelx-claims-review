import { useEffect, useState } from 'react';

const QUERY = '(min-width: 1024px)';

/** True at the `lg` breakpoint and up, where the source shows beside the fields instead of in a sheet. */
export function useIsDesktop(): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(QUERY).matches);
  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return matches;
}

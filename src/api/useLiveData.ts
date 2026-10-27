import { useEffect, useState } from 'react';
import { ApiError } from './client';

export type Connection = 'loading' | 'live' | 'reconnecting' | 'error';

type LiveData<T> = { data: T | null; error: ApiError | null; connection: Connection; retry: () => void };

/**
 * Loads data once with a normal request (so errors like a 400 come back with a
 * message), then keeps it current from a Server-Sent Events stream that sends
 * the full, updated data each time. The browser's EventSource reconnects by
 * itself; while it does, the last data stays on screen.
 */
export function useLiveData<T>(load: () => Promise<T>, eventsUrl: string, eventName: string): LiveData<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [connection, setConnection] = useState<Connection>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let source: EventSource | null = null;
    setConnection('loading');
    setError(null);

    load()
      .then((initial) => {
        if (cancelled) return;
        setData(initial);
        source = new EventSource(eventsUrl);
        source.addEventListener(eventName, (event) => {
          setData(JSON.parse((event as MessageEvent<string>).data) as T);
          setConnection('live');
        });
        source.onopen = () => setConnection('live');
        source.onerror = () => setConnection('reconnecting');
      })
      .catch((err: ApiError) => {
        if (cancelled) return;
        setError(err);
        setConnection('error');
      });

    return () => {
      cancelled = true;
      source?.close();
    };
    // `load` is recreated every render by callers, so listing it would reload on every render.
    // The URL identifies what is loaded: when it changes, this effect runs with that render's `load`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsUrl, eventName, attempt]);

  return { data, error, connection, retry: () => setAttempt((n) => n + 1) };
}

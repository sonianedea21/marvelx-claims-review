import { useEffect, useState } from 'react';

// Placeholder until slice 5. Proves the client can reach the server through the Vite proxy.
export function QueuePage() {
  const [health, setHealth] = useState('checking…');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((body: { ok: boolean }) => setHealth(body.ok ? 'server ok' : 'server error'))
      .catch(() => setHealth('server unreachable'));
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Claims queue</h1>
      <p className="mt-2">{health}</p>
    </main>
  );
}

import type { Request, Response } from 'express';

/**
 * Server-Sent Events, by hand: keep the response open and write
 * "event: <name>\ndata: <json>\n\n" blocks. The browser's EventSource
 * reconnects on its own if the connection drops.
 */
export function openEventStream(req: Request, res: Response, onClose: () => void) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  // A comment line every 15 s keeps proxies from closing an idle stream.
  const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 15_000);
  req.on('close', () => {
    clearInterval(heartbeat);
    onClose();
  });

  return function send(event: string, data: unknown) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
}

/**
 * Server-Sent Events endpoint for real-time admin notifications.
 * Sends a `connected` event on open, then heartbeats every 25 s.
 * Future: proxy backend push events (webhooks, DB triggers) to connected clients.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // client disconnected
        }
      };

      // Immediate connect confirmation
      send({ type: 'connected', ts: Date.now() });

      // Heartbeat keeps the connection alive through proxies / load balancers
      const heartbeat = setInterval(() => {
        try {
          send({ type: 'heartbeat', ts: Date.now() });
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);

      // Cleanup when client disconnects
      const cleanup = () => {
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* already closed */ }
      };

      // Abort after 5 min to avoid zombie connections; clients auto-reconnect
      setTimeout(cleanup, 5 * 60 * 1_000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable Nginx buffering
    },
  });
}

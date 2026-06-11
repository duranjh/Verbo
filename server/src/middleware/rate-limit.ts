import type { MiddlewareHandler } from 'hono';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

// Sliding-window log per client IP. In-memory by design: this proxy runs as a
// single instance, and losing counts on restart is acceptable. Swap for a
// shared store (Redis) if you ever scale past one machine.
const hits = new Map<string, number[]>();

const clientKey = (headers: { [k: string]: string | undefined }): string => {
  // Fly sets fly-client-ip; generic proxies set x-forwarded-for (client first).
  return (
    headers['fly-client-ip'] ||
    headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    'unknown'
  );
};

const sweepStaleKeys = (now: number): void => {
  if (hits.size < 1_000) return;
  for (const [key, times] of hits) {
    if (times.length === 0 || now - times[times.length - 1] > WINDOW_MS) {
      hits.delete(key);
    }
  }
};

// Rejects clients that exceed MAX_REQUESTS within WINDOW_MS. This bounds how
// fast a single client can burn OpenAI credits, but is not authentication —
// see the Security section in server/README.md.
export const rateLimit: MiddlewareHandler = async (c, next) => {
  const now = Date.now();
  const key = clientKey({
    'fly-client-ip': c.req.header('fly-client-ip'),
    'x-forwarded-for': c.req.header('x-forwarded-for'),
  });

  const windowStart = now - WINDOW_MS;
  const recent = (hits.get(key) || []).filter((t) => t > windowStart);

  if (recent.length >= MAX_REQUESTS) {
    const retryAfterSec = Math.ceil((recent[0] + WINDOW_MS - now) / 1000);
    c.header('Retry-After', String(Math.max(retryAfterSec, 1)));
    return c.json({ error: 'Too many requests' }, 429);
  }

  recent.push(now);
  hits.set(key, recent);
  sweepStaleKeys(now);

  await next();
};

import type { MiddlewareHandler } from 'hono';

const parseAllowed = (): string[] => {
  const raw = process.env.ALLOWED_ORIGINS || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

export const allowedOrigins = parseAllowed();

export const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) return false;
  return allowedOrigins.includes(origin);
};

// Hard-rejects requests whose Origin header isn't in ALLOWED_ORIGINS.
// CORS middleware would silently fail on the browser side; this middleware
// also blocks non-browser clients (curl, fetch from a server) that finds the URL.
export const originAllowlist: MiddlewareHandler = async (c, next) => {
  const origin = c.req.header('origin');
  if (!isAllowedOrigin(origin)) {
    return c.json(
      { error: 'Origin not allowed' },
      403,
    );
  }
  await next();
};

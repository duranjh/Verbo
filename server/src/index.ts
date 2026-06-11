import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { allowedOrigins, isAllowedOrigin, originAllowlist } from './middleware/allowlist.js';
import { requestLogger } from './middleware/logger.js';
import { rateLimit } from './middleware/rate-limit.js';
import { verifyRoute } from './routes/verify.js';
import { suggestSourcesRoute } from './routes/suggest-sources.js';
import { consensusRoute } from './routes/consensus.js';
import { tagsRoute } from './routes/tags.js';
import { enhanceRoute } from './routes/enhance.js';
import { researchRoute } from './routes/research.js';
import { researchSynthesisRoute } from './routes/research-synthesis.js';
import { transcribeRoute } from './routes/transcribe.js';
import { debateSearchRoute } from './routes/debate-search.js';

const app = new Hono();

app.use('*', requestLogger);

// CORS reflects the same allowlist. Browsers will block mismatched origins
// before the request body even arrives; the originAllowlist middleware below
// also rejects non-browser clients explicitly.
app.use(
  '/api/*',
  cors({
    origin: (origin) => (isAllowedOrigin(origin) ? origin : null),
    allowMethods: ['POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 600,
  }),
);

app.use('/api/*', originAllowlist);
app.use('/api/*', rateLimit);

// /health is open to any origin: it returns no data beyond liveness, and the
// client pings it cross-origin to decide whether to show the AI-offline banner.
app.use('/health', cors());
app.get('/health', (c) => c.json({ ok: true }));

app.route('/api/verify', verifyRoute);
app.route('/api/suggest-sources', suggestSourcesRoute);
app.route('/api/consensus', consensusRoute);
app.route('/api/tags', tagsRoute);
app.route('/api/enhance', enhanceRoute);
app.route('/api/research', researchRoute);
app.route('/api/research-synthesis', researchSynthesisRoute);
app.route('/api/transcribe', transcribeRoute);
app.route('/api/debate-search', debateSearchRoute);

const port = Number(process.env.PORT) || 8787;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[verbo-backend] listening on :${info.port}`);
  console.log(`[verbo-backend] allowed origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : '(none — set ALLOWED_ORIGINS)'}`);
});

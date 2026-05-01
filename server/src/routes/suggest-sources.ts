import { Hono } from 'hono';
import { suggestSupportingSources } from '../openai.js';

export const suggestSourcesRoute = new Hono();

suggestSourcesRoute.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      statement?: string;
      context?: string;
      stance?: string;
    }>();

    const sources = await suggestSupportingSources(
      typeof body.statement === 'string' ? body.statement : '',
      typeof body.context === 'string' ? body.context : '',
      typeof body.stance === 'string' ? body.stance : '',
    );
    return c.json(sources);
  } catch (e) {
    console.error('suggest-sources route error', e);
    return c.json([]);
  }
});

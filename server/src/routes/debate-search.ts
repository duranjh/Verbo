import { Hono } from 'hono';
import { searchDebates } from '../openai.js';

export const debateSearchRoute = new Hono();

debateSearchRoute.post('/', async (c) => {
  try {
    const body = await c.req.json<{ query?: string; topics?: any[] }>();
    const result = await searchDebates(
      typeof body.query === 'string' ? body.query : '',
      Array.isArray(body.topics) ? body.topics : [],
    );
    return c.json({
      exactMatchId: result.exactMatchId ?? null,
      similarMatchIds: result.similarMatchIds,
    });
  } catch (e) {
    console.error('debate-search route error', e);
    return c.json({ exactMatchId: null, similarMatchIds: [] });
  }
});

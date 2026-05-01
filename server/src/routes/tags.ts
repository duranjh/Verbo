import { Hono } from 'hono';
import { suggestTags } from '../openai.js';

export const tagsRoute = new Hono();

tagsRoute.post('/', async (c) => {
  try {
    const body = await c.req.json<{ title?: string; description?: string }>();
    const tags = await suggestTags(
      typeof body.title === 'string' ? body.title : '',
      typeof body.description === 'string' ? body.description : '',
    );
    return c.json({ tags });
  } catch (e) {
    console.error('tags route error', e);
    return c.json({ tags: [] });
  }
});

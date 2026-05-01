import { Hono } from 'hono';
import { generateTopicResearch } from '../openai.js';

export const researchRoute = new Hono();

researchRoute.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      title?: string;
      description?: string;
      excludeUrls?: string[];
    }>();
    const exclude = Array.isArray(body.excludeUrls)
      ? body.excludeUrls.filter((s): s is string => typeof s === 'string')
      : [];

    const result = await generateTopicResearch(
      typeof body.title === 'string' ? body.title : '',
      typeof body.description === 'string' ? body.description : '',
      exclude,
    );
    return c.json(result);
  } catch (e) {
    console.error('research route error', e);
    return c.json({ for: [], neutral: [], against: [] });
  }
});

import { Hono } from 'hono';
import { enhanceArgument } from '../openai.js';

export const enhanceRoute = new Hono();

type EnhanceBody = { argument?: string; topic?: string; stance?: string };

enhanceRoute.post('/', async (c) => {
  let body: EnhanceBody = {};
  try {
    body = await c.req.json<EnhanceBody>();
  } catch {
    // Malformed JSON falls through to defaults below; return the empty-string fallback.
  }
  const argument = typeof body.argument === 'string' ? body.argument : '';
  try {
    const enhanced = await enhanceArgument(
      argument,
      typeof body.topic === 'string' ? body.topic : '',
      typeof body.stance === 'string' ? body.stance : '',
    );
    return c.json({ enhanced });
  } catch (e) {
    console.error('enhance route error', e);
    // Mirror the client-side fallback: return the original argument unchanged.
    return c.json({ enhanced: argument });
  }
});

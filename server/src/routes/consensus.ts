import { Hono } from 'hono';
import { generateConsensusSummary } from '../openai.js';

export const consensusRoute = new Hono();

consensusRoute.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      topicTitle?: string;
      topicDescription?: string;
      forArgs?: string[];
      againstArgs?: string[];
      neutralArgs?: string[];
    }>();

    const stringArr = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];

    const summary = await generateConsensusSummary(
      typeof body.topicTitle === 'string' ? body.topicTitle : '',
      typeof body.topicDescription === 'string' ? body.topicDescription : '',
      stringArr(body.forArgs),
      stringArr(body.againstArgs),
      stringArr(body.neutralArgs),
    );
    return c.json({ summary });
  } catch (e) {
    console.error('consensus route error', e);
    return c.json({ summary: 'Consensus generation unavailable at the moment.' });
  }
});

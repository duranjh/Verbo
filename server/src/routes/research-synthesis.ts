import { Hono } from 'hono';
import { generateResearchSynthesis, SYNTHESIS_FALLBACK } from '../openai.js';
import type { SynthesisSource } from '../types.js';

export const researchSynthesisRoute = new Hono();

researchSynthesisRoute.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      title?: string;
      description?: string;
      sources?: SynthesisSource[];
    }>();
    const sources = Array.isArray(body.sources)
      ? body.sources.filter((s) => s && typeof (s as any).hostname === 'string')
      : [];

    const result = await generateResearchSynthesis(
      typeof body.title === 'string' ? body.title : '',
      typeof body.description === 'string' ? body.description : '',
      sources as SynthesisSource[],
    );
    return c.json(result);
  } catch (e) {
    console.error('research-synthesis route error', e);
    return c.json(SYNTHESIS_FALLBACK);
  }
});

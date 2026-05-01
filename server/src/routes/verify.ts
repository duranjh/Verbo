import { Hono } from 'hono';
import { verifyStatement } from '../openai.js';
import { FactRating } from '../types.js';

export const verifyRoute = new Hono();

verifyRoute.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      statement?: string;
      context?: string;
      existingStatements?: string[];
    }>();

    const statement = typeof body.statement === 'string' ? body.statement : '';
    const context = typeof body.context === 'string' ? body.context : '';
    const existing = Array.isArray(body.existingStatements)
      ? body.existingStatements.filter((s) => typeof s === 'string')
      : [];

    const result = await verifyStatement(statement, context, existing);
    return c.json(result);
  } catch (e) {
    console.error('verify route error', e);
    return c.json({
      rating: FactRating.NEUTRAL,
      ratingLabel: 'Unverified',
      detectedStance: 'NEUTRAL',
      reasoning: 'AI service is currently unavailable or could not verify this claim.',
      groundingSources: [],
      isDuplicate: false,
    });
  }
});

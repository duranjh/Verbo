import { Hono } from 'hono';
import { transcribeAudio } from '../openai.js';

export const transcribeRoute = new Hono();

// Unlike other endpoints, transcribe surfaces failures to the user (the voice-input
// UI shows a specific error message), so we return 4xx + { error } on failure
// rather than swallowing into a fallback.
transcribeRoute.post('/', async (c) => {
  try {
    const body = await c.req.json<{ audioBase64?: string; mimeType?: string }>();
    if (typeof body.audioBase64 !== 'string' || typeof body.mimeType !== 'string') {
      return c.json({ error: 'audioBase64 and mimeType are required strings' }, 400);
    }

    const text = await transcribeAudio(body.audioBase64, body.mimeType);
    return c.json({ text });
  } catch (e: any) {
    console.error('transcribe route error', e);
    const status = e?.status ?? e?.error?.code;
    const msg = e?.message || '';

    if (status === 404 || msg.includes('404') || msg.includes('not found')) {
      return c.json({
        error:
          'Audio transcription is not available. The model may not support audio input, or your API key may not have access to audio transcription features.',
      }, 502);
    }

    if (status === 400 || msg.includes('400')) {
      return c.json({
        error: 'Invalid audio format. The audio file may be corrupted or in an unsupported format. Supported formats include: audio/webm, audio/mp3, audio/wav, audio/ogg',
      }, 400);
    }

    return c.json({ error: `Failed to transcribe audio: ${msg || 'Unknown error'}` }, 500);
  }
});

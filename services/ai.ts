// Thin fetch wrappers around the verbo-backend proxy. Each function preserves
// the signature and return type of the previous in-browser OpenAI SDK
// implementation so consumer call sites (App.tsx, DebateView, ConversationThread,
// etc.) need zero changes. Network and HTTP errors fall back to the same
// graceful-degradation values the SDK code returned in catch blocks.

import {
  AIAnalysis,
  FactRating,
  GroundingSource,
  ResearchSynthesis,
  SourceCategory,
  TopicResearchData,
} from '../types';

const PROXY_URL = (import.meta.env.VITE_PROXY_URL || 'http://localhost:8787').replace(/\/$/, '');

const post = async <T>(path: string, body: unknown): Promise<T> => {
  const res = await fetch(`${PROXY_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Proxy ${path} returned ${res.status}`);
  }
  return (await res.json()) as T;
};

const NEUTRAL_ANALYSIS: AIAnalysis = {
  rating: FactRating.NEUTRAL,
  ratingLabel: 'Unverified',
  detectedStance: 'NEUTRAL',
  reasoning: 'AI service is currently unavailable or could not verify this claim.',
  groundingSources: [],
  isDuplicate: false,
};

const SYNTHESIS_FALLBACK: ResearchSynthesis = {
  agree: '',
  disagree: '',
  underexplored: '',
  agreementPct: 0,
  disagreementPct: 0,
  underexploredPct: 0,
  confidence: 'low',
};

// Pings the proxy's /health endpoint so the app can tell the user when AI
// features are offline (e.g. cloned the repo but didn't start the server).
export const checkProxyHealth = async (timeoutMs = 3000): Promise<boolean> => {
  try {
    const res = await fetch(`${PROXY_URL}/health`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  const res = await fetch(`${PROXY_URL}/api/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioBase64, mimeType }),
  });

  if (!res.ok) {
    let errMsg = `Failed to transcribe audio (status ${res.status})`;
    try {
      const json = await res.json();
      if (json && typeof json.error === 'string') errMsg = json.error;
    } catch {
      // body wasn't JSON; keep default
    }
    throw new Error(errMsg);
  }

  const json = (await res.json()) as { text?: string };
  const text = (json.text || '').trim();
  if (!text) {
    throw new Error('Empty transcription response');
  }
  return text;
};

export const verifyStatement = async (
  statement: string,
  context: string,
  existingStatements: string[] = []
): Promise<AIAnalysis> => {
  try {
    return await post<AIAnalysis>('/api/verify', { statement, context, existingStatements });
  } catch (e) {
    console.error('Error verifying statement:', e);
    return NEUTRAL_ANALYSIS;
  }
};

export const suggestSupportingSources = async (
  statement: string,
  context: string,
  stance: string
): Promise<{ title: string; uri: string }[]> => {
  try {
    const result = await post<GroundingSource[]>('/api/suggest-sources', { statement, context, stance });
    return Array.isArray(result)
      ? result.map((s) => ({ title: s.title || 'Source', uri: s.uri }))
      : [];
  } catch (e) {
    console.error('Error suggesting sources', e);
    return [];
  }
};

export const generateConsensusSummary = async (
  topicTitle: string,
  topicDescription: string,
  forArgs: string[],
  againstArgs: string[],
  neutralArgs: string[]
): Promise<string> => {
  try {
    const { summary } = await post<{ summary: string }>('/api/consensus', {
      topicTitle,
      topicDescription,
      forArgs,
      againstArgs,
      neutralArgs,
    });
    return summary || 'Consensus generation unavailable at the moment.';
  } catch (e) {
    console.error('Error generating consensus:', e);
    return 'Consensus generation unavailable at the moment.';
  }
};

export const suggestTags = async (title: string, description: string): Promise<string[]> => {
  try {
    const { tags } = await post<{ tags: string[] }>('/api/tags', { title, description });
    return Array.isArray(tags) ? tags.slice(0, 5) : [];
  } catch (e) {
    console.error('Error generating tags', e);
    return [];
  }
};

export const enhanceArgument = async (
  argument: string,
  topic: string,
  stance: string
): Promise<string> => {
  try {
    const { enhanced } = await post<{ enhanced: string }>('/api/enhance', { argument, topic, stance });
    return enhanced || argument;
  } catch (e) {
    console.error('Error enhancing argument', e);
    return argument;
  }
};

export const searchDebates = async (
  query: string,
  topics: any[]
): Promise<{ exactMatchId?: string; similarMatchIds: string[] }> => {
  try {
    const result = await post<{ exactMatchId: string | null; similarMatchIds: string[] }>(
      '/api/debate-search',
      { query, topics: topics.map((t) => ({ id: t.id, title: t.title, description: t.description, tags: t.tags })) },
    );
    return {
      exactMatchId: result.exactMatchId ?? undefined,
      similarMatchIds: Array.isArray(result.similarMatchIds) ? result.similarMatchIds : [],
    };
  } catch (e) {
    console.error('Error searching debates', e);
    return { similarMatchIds: [] };
  }
};

export const generateTopicResearch = async (
  title: string,
  description: string,
  excludeUrls: string[] = []
): Promise<TopicResearchData> => {
  try {
    return await post<TopicResearchData>('/api/research', { title, description, excludeUrls });
  } catch (e) {
    console.error('Error generating topic research', e);
    return { for: [], neutral: [], against: [] };
  }
};

export interface SynthesisSource {
  hostname: string;
  category: SourceCategory;
  title?: string;
  excerpt?: string;
}

export const generateResearchSynthesis = async (
  title: string,
  description: string,
  sources: SynthesisSource[]
): Promise<ResearchSynthesis> => {
  if (sources.length === 0) {
    return SYNTHESIS_FALLBACK;
  }

  try {
    return await post<ResearchSynthesis>('/api/research-synthesis', { title, description, sources });
  } catch (e) {
    console.error('Error generating research synthesis', e);
    return SYNTHESIS_FALLBACK;
  }
};

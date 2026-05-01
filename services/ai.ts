import OpenAI from 'openai';
import type { Response, ResponseOutputText } from 'openai/resources/responses/responses';
import { AIAnalysis, FactRating, ResearchSynthesis, SourceCategory, TopicResearchData } from '../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

const MODELS = {
  factCheck: 'gpt-5',
  research: 'gpt-5',
  enhance: 'gpt-4o-mini',
} as const;

const WEB_SEARCH_TOOL = { type: 'web_search' } as const;

const normalizeUrlForComparison = (url: string) => {
  try {
    return new URL(url).href.replace(/\/$/, '').toLowerCase();
  } catch {
    return url.toLowerCase();
  }
};

const collectURLCitations = (response: Response): { title: string; uri: string }[] => {
  const out: { title: string; uri: string }[] = [];
  const seen = new Set<string>();
  for (const item of response.output ?? []) {
    if (item.type !== 'message') continue;
    for (const part of item.content ?? []) {
      if ((part as ResponseOutputText).type !== 'output_text') continue;
      const annotations = (part as ResponseOutputText).annotations ?? [];
      for (const annotation of annotations) {
        if (annotation.type !== 'url_citation') continue;
        if (!annotation.url || seen.has(annotation.url)) continue;
        seen.add(annotation.url);
        out.push({ title: annotation.title || 'Source', uri: annotation.url });
      }
    }
  }
  return out;
};

// gpt-5 often returns URLs inside JSON rather than prose, leaving `annotations` empty even when web_search ran.
// `web_search_call.action.sources` surfaces every URL the search tool actually visited, so we union both sets for trust-checking.
const collectSearchedURLs = (response: Response): Set<string> => {
  const urls = new Set<string>();
  for (const item of response.output ?? []) {
    if ((item as any).type === 'web_search_call') {
      const sources = (item as any).action?.sources;
      if (Array.isArray(sources)) {
        for (const s of sources) {
          if (s?.url) urls.add(normalizeUrlForComparison(s.url));
        }
      }
    }
    if (item.type === 'message') {
      for (const part of item.content ?? []) {
        if ((part as ResponseOutputText).type !== 'output_text') continue;
        for (const annotation of (part as ResponseOutputText).annotations ?? []) {
          if (annotation.type === 'url_citation' && annotation.url) {
            urls.add(normalizeUrlForComparison(annotation.url));
          }
        }
      }
    }
  }
  return urls;
};

const extractJSONObject = (text: string): string => {
  let s = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const firstBrace = s.indexOf('{');
  const lastBrace = s.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    s = s.substring(firstBrace, lastBrace + 1);
  }
  return s;
};

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  try {
    const binary = atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const ext = mimeType.split('/')[1]?.split(';')[0] || 'webm';
    const file = new File([bytes], `recording.${ext}`, { type: mimeType });

    const result = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    });

    const transcribedText = (result.text || '').trim();
    if (!transcribedText) {
      throw new Error('Empty transcription response');
    }
    return transcribedText;
  } catch (error: any) {
    console.error('Error transcribing audio:', error);

    const status = error?.status ?? error?.error?.code;
    const msg = error?.message || '';

    if (status === 404 || msg.includes('404') || msg.includes('not found')) {
      throw new Error(
        'Audio transcription is not available. The model may not support audio input, or your API key may not have access to audio transcription features. ' +
        'Please check: 1) Your API key has access to multimodal models, 2) The model supports audio transcription, 3) Your billing is enabled if required.'
      );
    }

    if (status === 400 || msg.includes('400')) {
      throw new Error(
        'Invalid audio format. The audio file may be corrupted or in an unsupported format. ' +
        'Supported formats include: audio/webm, audio/mp3, audio/wav, audio/ogg'
      );
    }

    throw new Error(`Failed to transcribe audio: ${error?.message || 'Unknown error'}`);
  }
};

export const verifyStatement = async (
  statement: string,
  context: string,
  existingStatements: string[] = []
): Promise<AIAnalysis> => {
  try {
    // Truncate each prior argument so the full debate fits comfortably; duplicate detection runs against ALL of them, not a recent window.
    const truncated = existingStatements.map((t) =>
      t.length > 280 ? `${t.slice(0, 277)}…` : t
    );

    const prompt = `
      Analyze the following statement in the context of the debate topic: "${context}".
      Statement to verify: "${statement}"

      Existing Arguments in this debate (full list, oldest first; each may be truncated to ~280 chars):
      ${truncated.length > 0 ? JSON.stringify(truncated) : 'None yet.'}

      1. Use the web_search tool to verify the factual accuracy of this statement against reliable, current sources.
      2. Determine the stance of the statement regarding the topic. Is it supporting the topic (FOR), opposing it (AGAINST), or NEUTRAL/Unclear?
      3. Rate the truthfulness on a scale of 0-5:
         0 = Unrelated to the topic (e.g. spam, off-topic, nonsense)
         1 = False
         2 = Misleading
         3 = Unverifiable / Opinion
         4 = Somewhat True
         5 = True
      4. Provide a concise reasoning for your rating (max 3 sentences).
      5. Check if the new statement is a semantic duplicate of ANY of the "Existing Arguments" listed above (compare against the full list, not just the most recent ones).

      Output strictly valid JSON (no markdown formatting).
      Format:
      {
        "rating": number,
        "ratingLabel": string,
        "detectedStance": "FOR" | "AGAINST" | "NEUTRAL",
        "reasoning": string,
        "isDuplicate": boolean
      }
    `;

    const response = await openai.responses.create({
      model: MODELS.factCheck,
      input: prompt,
      tools: [WEB_SEARCH_TOOL],
      include: ['web_search_call.action.sources'],
    });

    const resultText = extractJSONObject(response.output_text || '{}');

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(resultText);
    } catch {
      console.error('Failed to parse JSON from AI verification', resultText);
      throw new Error('Invalid JSON response');
    }

    const groundingSources = collectURLCitations(response);

    let rating = parsedResult.rating;
    if (rating < 0) rating = 0;
    if (rating > 5) rating = 5;

    // RULE: If the AI Fact Checker cannot provide a reliable source, the AI must mark the argument as an unverifiable argument rating.
    const factualRatings = [FactRating.TRUE, FactRating.SOMEWHAT_TRUE, FactRating.MISLEADING, FactRating.FALSE];

    if (factualRatings.includes(rating as FactRating) && groundingSources.length === 0) {
      rating = FactRating.NEUTRAL;
      parsedResult.ratingLabel = 'Unverifiable';
      parsedResult.reasoning =
        parsedResult.reasoning + ' (Note: No reliable sources were found to verify this claim, so it has been marked as unverifiable.)';
    }

    return {
      rating: rating as FactRating,
      ratingLabel: parsedResult.ratingLabel || 'Unknown',
      detectedStance: parsedResult.detectedStance || 'NEUTRAL',
      reasoning: parsedResult.reasoning || 'No reasoning provided.',
      groundingSources,
      isDuplicate: parsedResult.isDuplicate || false,
    };
  } catch (error) {
    console.error('Error verifying statement:', error);
    return {
      rating: FactRating.NEUTRAL,
      ratingLabel: 'Unverified',
      detectedStance: 'NEUTRAL',
      reasoning: 'AI service is currently unavailable or could not verify this claim.',
      groundingSources: [],
      isDuplicate: false,
    };
  }
};

export const suggestSupportingSources = async (
  statement: string,
  context: string,
  stance: string
): Promise<{ title: string; uri: string }[]> => {
  try {
    if (statement.length < 15) return [];

    const prompt = `
      You are a debate assistant.
      User Stance: "${stance}"
      Topic: "${context}"
      Argument: "${statement}"

      Use the web_search tool to find reputable sources that explicitly SUPPORT the User Stance.
      Do NOT include sources that refute the stance.

      If you find supporting sources, write a response citing them.
      If you cannot find sources that support this specific stance, simply state "No supporting sources found."
    `;

    const response = await openai.responses.create({
      model: MODELS.factCheck,
      input: prompt,
      tools: [WEB_SEARCH_TOOL],
      include: ['web_search_call.action.sources'],
    });

    const sources = collectURLCitations(response);
    return sources.slice(0, 3);
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
    const totalArgs = forArgs.length + againstArgs.length + neutralArgs.length;
    if (totalArgs === 0) {
      return "There are currently no verified 'True' arguments to generate a consensus summary. Add verified arguments to see an analysis here.";
    }

    const prompt = `
      Analyze the following top-rated, fact-verified arguments for the debate topic: "${topicTitle}".
      Topic Description: "${topicDescription}"

      Top Verified Arguments FOR:
      ${forArgs.length > 0 ? forArgs.join('\n- ') : 'None'}

      Top Verified Arguments AGAINST:
      ${againstArgs.length > 0 ? againstArgs.join('\n- ') : 'None'}

      Top Verified Arguments NEUTRAL:
      ${neutralArgs.length > 0 ? neutralArgs.join('\n- ') : 'None'}

      Provide a concise summary (max 3-4 sentences) of the current consensus based *only* on these high-quality arguments.
      Focus on what the majority of verified facts suggest is the truth or the most reasonable conclusion.
      Do not mention "users" or "commenters", just synthesize the arguments into a coherent viewpoint.
      If the arguments are conflicting, highlight the key points of contention that are factual.
    `;

    const response = await openai.responses.create({
      model: MODELS.enhance,
      input: prompt,
    });

    return (response.output_text || '').trim() || 'Unable to generate summary.';
  } catch (error) {
    console.error('Error generating consensus:', error);
    return 'Consensus generation unavailable at the moment.';
  }
};

export const suggestTags = async (title: string, description: string): Promise<string[]> => {
  try {
    const prompt = `
      Generate 5 relevant, short tags for a debate topic.
      Title: "${title}"
      Description: "${description}"

      Return the tags inside the "tags" array of the JSON response. Example: { "tags": ["Politics", "Economy", "USA"] }
    `;

    const response = await openai.responses.create({
      model: MODELS.enhance,
      input: prompt,
      text: {
        format: {
          type: 'json_schema',
          name: 'TagSuggestion',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              tags: { type: 'array', items: { type: 'string' } },
            },
            required: ['tags'],
          },
          strict: true,
        },
      },
    });

    const text = response.output_text;
    if (!text) return [];
    const parsed = JSON.parse(text);
    return Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [];
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
    const prompt = `
      You are an expert debater and editor.
      Topic: "${topic}"
      Stance: "${stance}"
      Draft Argument: "${argument}"

      Rewrite the draft argument to be more clear, persuasive, and grammatically correct.
      Maintain the original intent and stance. Do not add new facts, just improve the delivery.
      Return only the enhanced text.
    `;

    const response = await openai.responses.create({
      model: MODELS.enhance,
      input: prompt,
    });

    return (response.output_text || '').trim() || argument;
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
    const prompt = `
      User Search Query: "${query}"

      Available Debate Topics:
      ${JSON.stringify(topics.map((t) => ({ id: t.id, title: t.title, description: t.description, tags: t.tags })))}

      Instructions:
      1. Analyze the User Query against the Available Debate Topics.
      2. If there is a debate topic that matches the query significantly (title or main concept), identify its ID as "exactMatchId". If not, return null.
      3. Identify up to 3 other debate topics that are semantically relevant or similar to the query. Return their IDs in "similarMatchIds".

      Return JSON.
    `;

    const response = await openai.responses.create({
      model: MODELS.enhance,
      input: prompt,
      text: {
        format: {
          type: 'json_schema',
          name: 'DebateSearch',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              exactMatchId: { type: ['string', 'null'] },
              similarMatchIds: { type: 'array', items: { type: 'string' } },
            },
            required: ['exactMatchId', 'similarMatchIds'],
          },
          strict: true,
        },
      },
    });

    const text = response.output_text;
    if (!text) return { similarMatchIds: [] };
    const parsed = JSON.parse(text);
    return {
      exactMatchId: parsed.exactMatchId ?? undefined,
      similarMatchIds: Array.isArray(parsed.similarMatchIds) ? parsed.similarMatchIds : [],
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
    const prompt = `
      Act as a comprehensive researcher for the debate topic: "${title}".
      Context: "${description}".

      Goal: Find high-quality, reliable, and up-to-date sources.
      Organize findings into three categories: FOR, NEUTRAL, and AGAINST.

      For EACH category, find 2 distinct sources (total 6 sources).

      ${excludeUrls.length > 0 ? `Do NOT include these URLs: ${excludeUrls.slice(-10).join(', ')}` : ''}

      CRITICAL INSTRUCTIONS:
      1. Use the web_search tool to find real, active links.
      2. The "uri" field must contain ONLY a valid URL string. Do NOT include descriptions, titles, or summaries in the "uri" field.
      3. Keep "snippet" brief (max 30 words).
      4. Do NOT output search redirect links.
      5. If a direct URL cannot be found, omit that source entirely.
      6. VERIFY that the links work. Do not invent links.

      Return the result as a strictly formatted JSON object with the following structure (no markdown):
      {
          "for": [ { "title": "...", "snippet": "...", "uri": "...", "sourceName": "..." } ],
          "neutral": [ { "title": "...", "snippet": "...", "uri": "...", "sourceName": "..." } ],
          "against": [ { "title": "...", "snippet": "...", "uri": "...", "sourceName": "..." } ]
      }
    `;

    const response = await openai.responses.create({
      model: MODELS.factCheck,
      input: prompt,
      tools: [WEB_SEARCH_TOOL],
      include: ['web_search_call.action.sources'],
    });

    let text = response.output_text;
    if (!text) {
      throw new Error('Empty response text');
    }

    text = extractJSONObject(text);

    try {
      const parsed = JSON.parse(text);

      const trustedUris = collectSearchedURLs(response);

      const cleanAndValidateItems = (items: any[]) => {
        if (!Array.isArray(items)) return [];
        return items.filter((item) => {
          if (!item.uri || !item.uri.startsWith('http')) return false;
          if (item.uri.length > 500) return false;
          if (item.uri.includes('grounding-api-redirect')) return false;

          // STRICT MODE: only return URLs the model actually cited via web_search annotations.
          if (trustedUris.size === 0) return false;

          const norm = normalizeUrlForComparison(item.uri);
          const isTrusted = [...trustedUris].some(
            (trusted) => trusted === norm || trusted.includes(norm) || norm.includes(trusted)
          );
          return isTrusted;
        });
      };

      return {
        for: cleanAndValidateItems(parsed.for),
        neutral: cleanAndValidateItems(parsed.neutral),
        against: cleanAndValidateItems(parsed.against),
      };
    } catch {
      console.error('JSON Parse Error. Raw Text length:', text.length);
      return { for: [], neutral: [], against: [] };
    }
  } catch (e) {
    console.error('Error generating topic research', e);
    return { for: [], neutral: [], against: [] };
  }
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
    const sourceList = sources
      .slice(0, 40)
      .map((s, i) => {
        const head = `[${i + 1}] ${s.hostname} · ${s.category}`;
        const titleLine = s.title ? ` · ${s.title}` : '';
        const excerptLine = s.excerpt ? `\n    ${s.excerpt}` : '';
        return `${head}${titleLine}${excerptLine}`;
      })
      .join('\n');

    const prompt = `
Act as an editorial researcher synthesizing a body of sources covering the debate: "${title}".
Context: "${description}".

Below is the list of sources cited or surfaced in the debate. Each source is labeled with its category.

${sourceList}

Produce three short, evidence-grounded takeaways:
1. Where the sources broadly AGREE — the consensus point.
2. Where they DISAGREE — the genuine point of contention. Note which categories of sources lean which way (e.g., "academic sources skew skeptical, industry sources optimistic").
3. What is UNDEREXPLORED — a question or angle the sources collectively neglect.

Then estimate three percentages summing to 100:
- agreementPct: how much of the body of sources broadly agrees on the consensus point.
- disagreementPct: how much explicitly takes the contrary side.
- underexploredPct: the share of sources that are tangential or that don't engage the central question.

Optionally, fill agreeAcademicSupportPct with the share of ACADEMIC sources that support the consensus point, and underexploredSourceCount with the integer number of sources that touch the underexplored angle.

Finally, rate confidence in this synthesis: low / medium-low / medium / medium-high / high.

Each takeaway must be ONE sentence, max 35 words. No hedging filler. No "the sources suggest" preambles — state the substance.

Return strict JSON. No prose outside the JSON.
`;

    const response = await openai.responses.create({
      model: MODELS.research,
      input: prompt,
      text: {
        format: {
          type: 'json_schema',
          name: 'ResearchSynthesis',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              agree: { type: 'string' },
              disagree: { type: 'string' },
              underexplored: { type: 'string' },
              agreementPct: { type: 'number' },
              disagreementPct: { type: 'number' },
              underexploredPct: { type: 'number' },
              agreeAcademicSupportPct: { type: ['number', 'null'] },
              underexploredSourceCount: { type: ['number', 'null'] },
              confidence: { type: 'string' },
            },
            required: [
              'agree',
              'disagree',
              'underexplored',
              'agreementPct',
              'disagreementPct',
              'underexploredPct',
              'agreeAcademicSupportPct',
              'underexploredSourceCount',
              'confidence',
            ],
          },
          strict: true,
        },
      },
    });

    const text = response.output_text;
    if (!text) {
      return SYNTHESIS_FALLBACK;
    }

    const parsed = JSON.parse(text) as Partial<ResearchSynthesis>;

    const clampPct = (n: unknown): number => {
      const v = typeof n === 'number' && Number.isFinite(n) ? n : 0;
      return Math.max(0, Math.min(100, Math.round(v)));
    };

    let agreementPct = clampPct(parsed.agreementPct);
    let disagreementPct = clampPct(parsed.disagreementPct);
    let underexploredPct = clampPct(parsed.underexploredPct);
    const sum = agreementPct + disagreementPct + underexploredPct;
    if (sum > 0 && sum !== 100) {
      agreementPct = Math.round((agreementPct / sum) * 100);
      disagreementPct = Math.round((disagreementPct / sum) * 100);
      underexploredPct = Math.max(0, 100 - agreementPct - disagreementPct);
    }

    const allowedConfidence: ResearchSynthesis['confidence'][] = [
      'low', 'medium-low', 'medium', 'medium-high', 'high',
    ];
    const confidence = allowedConfidence.includes(
      parsed.confidence as ResearchSynthesis['confidence']
    )
      ? (parsed.confidence as ResearchSynthesis['confidence'])
      : 'medium';

    return {
      agree: typeof parsed.agree === 'string' ? parsed.agree.trim() : '',
      disagree: typeof parsed.disagree === 'string' ? parsed.disagree.trim() : '',
      underexplored: typeof parsed.underexplored === 'string' ? parsed.underexplored.trim() : '',
      agreementPct,
      disagreementPct,
      underexploredPct,
      agreeAcademicSupportPct:
        typeof parsed.agreeAcademicSupportPct === 'number'
          ? clampPct(parsed.agreeAcademicSupportPct)
          : undefined,
      underexploredSourceCount:
        typeof parsed.underexploredSourceCount === 'number'
          ? Math.max(0, Math.round(parsed.underexploredSourceCount))
          : undefined,
      confidence,
    };
  } catch (e) {
    console.error('Error generating research synthesis', e);
    return SYNTHESIS_FALLBACK;
  }
};



import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis, FactRating, ResearchSynthesis, SourceCategory, TopicResearchData } from "../types";

// Initialize Gemini Client
// Note: In a real app, ensure process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Helper to normalize URL for comparison
const normalizeUrlForComparison = (url: string) => {
    try {
        return new URL(url).href.replace(/\/$/, '').toLowerCase();
    } catch {
        return url.toLowerCase();
    }
};

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  try {
    // Use gemini-3-flash-preview which is working for other operations
    // Note: Audio transcription support may vary by model and API version
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: audioBase64
              }
            },
            {
              text: "Transcribe the speech in this audio to text. Return only the transcription text, no other commentary."
            }
          ]
        }
      ]
    });
    
    const transcribedText = response.text?.trim() || "";
    if (!transcribedText) {
      throw new Error("Empty transcription response");
    }
    
    return transcribedText;
  } catch (error: any) {
    console.error("Error transcribing audio:", error);
    
    // Provide helpful error message based on error type
    if (error?.error?.code === 404 || error?.message?.includes('404') || error?.message?.includes('not found')) {
      throw new Error(
        "Audio transcription is not available. The model may not support audio input, or your API key may not have access to audio transcription features. " +
        "Please check: 1) Your API key has access to multimodal models, 2) The model supports audio transcription, 3) Your billing is enabled if required."
      );
    }
    
    if (error?.error?.code === 400 || error?.message?.includes('400')) {
      throw new Error(
        "Invalid audio format. The audio file may be corrupted or in an unsupported format. " +
        "Supported formats include: audio/webm, audio/mp3, audio/wav, audio/ogg"
      );
    }
    
    throw new Error(`Failed to transcribe audio: ${error?.message || 'Unknown error'}`);
  }
};

export const verifyStatement = async (statement: string, context: string, existingStatements: string[] = []): Promise<AIAnalysis> => {
  try {
    // Limit existing statements to avoid huge prompt context, passing the last 20.
    const recentStatements = existingStatements.slice(-20);

    const prompt = `
      Analyze the following statement in the context of the debate topic: "${context}".
      Statement to verify: "${statement}"

      Existing Arguments in this debate:
      ${recentStatements.length > 0 ? JSON.stringify(recentStatements) : "None yet."}

      1. Search the web using Google Search to verify the factual accuracy of this statement.
      2. Determine the stance of the statement regarding the topic. Is it supporting the topic (FOR), opposing it (AGAINST), or NEUTRAL/Unclear?
      3. Rate the truthfulness on a scale of 0-5:
         0 = Unrelated to the topic (e.g. spam, off-topic, nonsense)
         1 = False
         2 = Misleading
         3 = Unverifiable / Opinion
         4 = Somewhat True
         5 = True
      4. Provide a concise reasoning for your rating (max 3 sentences).
      5. Check if the new statement is a semantic duplicate of any of the "Existing Arguments" listed above.

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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // We do not use responseSchema here to ensure the Search tool is free to return grounding metadata
        // which sometimes gets suppressed when strict JSON schema is enforced.
      },
    });

    let resultText = response.text || "{}";
    // Clean up markdown code blocks if present
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Find first '{' and last '}'
    const firstBrace = resultText.indexOf('{');
    const lastBrace = resultText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        resultText = resultText.substring(firstBrace, lastBrace + 1);
    }
    
    let parsedResult;
    try {
        parsedResult = JSON.parse(resultText);
    } catch (e) {
        console.error("Failed to parse JSON from AI verification", resultText);
        throw new Error("Invalid JSON response");
    }

    // Extract grounding chunks for sources
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingSources = groundingChunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri)
      .map((web: any) => ({
        title: web.title || 'Source',
        uri: web.uri
      }));

    // Ensure rating is within enum bounds
    let rating = parsedResult.rating;
    if (rating < 0) rating = 0;
    if (rating > 5) rating = 5;

    // RULE: If the AI Fact Checker cannot provide a reliable source, the AI must mark the argument as an unverifiable argument rating.
    const factualRatings = [FactRating.TRUE, FactRating.SOMEWHAT_TRUE, FactRating.MISLEADING, FactRating.FALSE];
    
    if (factualRatings.includes(rating as FactRating) && groundingSources.length === 0) {
      rating = FactRating.NEUTRAL;
      parsedResult.ratingLabel = "Unverifiable";
      parsedResult.reasoning = parsedResult.reasoning + " (Note: No reliable sources were found to verify this claim, so it has been marked as unverifiable.)";
    }

    return {
      rating: rating as FactRating,
      ratingLabel: parsedResult.ratingLabel || "Unknown",
      detectedStance: parsedResult.detectedStance || "NEUTRAL",
      reasoning: parsedResult.reasoning || "No reasoning provided.",
      groundingSources: groundingSources,
      isDuplicate: parsedResult.isDuplicate || false,
    };

  } catch (error) {
    console.error("Error verifying statement:", error);
    // Fallback in case of error
    return {
      rating: FactRating.NEUTRAL,
      ratingLabel: "Unverified",
      detectedStance: "NEUTRAL",
      reasoning: "AI service is currently unavailable or could not verify this claim.",
      groundingSources: [],
      isDuplicate: false,
    };
  }
};

export const suggestSupportingSources = async (statement: string, context: string, stance: string): Promise<{title: string, uri: string}[]> => {
  try {
    if (statement.length < 15) return [];

    const prompt = `
      You are a debate assistant.
      User Stance: "${stance}"
      Topic: "${context}"
      Argument: "${statement}"

      Perform a Google Search to find reputable sources that explicitly SUPPORT the User Stance.
      Do NOT include sources that refute the stance.
      
      If you find supporting sources, write a response citing them.
      If you cannot find sources that support this specific stance, simply state "No supporting sources found."
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Note: When using googleSearch, do NOT force responseMimeType: 'application/json' 
        // for source retrieval as it can interfere with groundingMetadata population.
      }
    });

    // Extract sources from grounding metadata - this is the reliable way to get Search tool results
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Use a Map to deduplicate by URI
    const uniqueSourcesMap = new Map<string, {title: string, uri: string}>();

    groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
            uniqueSourcesMap.set(chunk.web.uri, {
                title: chunk.web.title,
                uri: chunk.web.uri
            });
        }
    });

    return Array.from(uniqueSourcesMap.values()).slice(0, 3);
  } catch (e) {
    console.error("Error suggesting sources", e);
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "Unable to generate summary.";
  } catch (error) {
    console.error("Error generating consensus:", error);
    return "Consensus generation unavailable at the moment.";
  }
};

export const suggestTags = async (title: string, description: string): Promise<string[]> => {
    try {
        const prompt = `
            Generate 5 relevant, short tags for a debate topic.
            Title: "${title}"
            Description: "${description}"
            
            Return the tags as a JSON array of strings. Example: ["Politics", "Economy", "USA"]
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        return [];
    } catch (e) {
        console.error("Error generating tags", e);
        return [];
    }
};

export const enhanceArgument = async (argument: string, topic: string, stance: string): Promise<string> => {
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || argument;
  } catch (e) {
    console.error("Error enhancing argument", e);
    return argument;
  }
};

export const searchDebates = async (query: string, topics: any[]): Promise<{ exactMatchId?: string, similarMatchIds: string[] }> => {
    try {
        const prompt = `
            User Search Query: "${query}"
            
            Available Debate Topics:
            ${JSON.stringify(topics.map(t => ({ id: t.id, title: t.title, description: t.description, tags: t.tags })))}

            Instructions:
            1. Analyze the User Query against the Available Debate Topics.
            2. If there is a debate topic that matches the query significantly (title or main concept), identify its ID as "exactMatchId". If not, return null.
            3. Identify up to 3 other debate topics that are semantically relevant or similar to the query. Return their IDs in "similarMatchIds".
            
            Return JSON.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        exactMatchId: { type: Type.STRING, nullable: true },
                        similarMatchIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        return { similarMatchIds: [] };
    } catch (e) {
        console.error("Error searching debates", e);
        return { similarMatchIds: [] };
    }
};

export const generateTopicResearch = async (title: string, description: string, excludeUrls: string[] = []): Promise<TopicResearchData> => {
    try {
        const prompt = `
            Act as a comprehensive researcher for the debate topic: "${title}".
            Context: "${description}".

            Goal: Find high-quality, reliable, and up-to-date sources.
            Organize findings into three categories: FOR, NEUTRAL, and AGAINST.

            For EACH category, find 2 distinct sources (total 6 sources).
            
            ${excludeUrls.length > 0 ? `Do NOT include these URLs: ${excludeUrls.slice(-10).join(', ')}` : ''}

            CRITICAL INSTRUCTIONS: 
            1. Use Google Search to find real, active links.
            2. The "uri" field must contain ONLY a valid URL string. Do NOT include descriptions, titles, or summaries in the "uri" field.
            3. Keep "snippet" brief (max 30 words).
            4. Do NOT output Google search redirect links or internal grounding URIs.
            5. If a direct URL cannot be found, omit that source entirely.
            6. VERIFY that the links work. Do not invent links.

            Return the result as a strictly formatted JSON object with the following structure:
            {
                "for": [ { "title": "...", "snippet": "...", "uri": "...", "sourceName": "..." } ],
                "neutral": [ { "title": "...", "snippet": "...", "uri": "...", "sourceName": "..." } ],
                "against": [ { "title": "...", "snippet": "...", "uri": "...", "sourceName": "..." } ]
            }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: 'application/json',
                maxOutputTokens: 4000, // Limit token output to prevent loops/massive output
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        for: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    snippet: { type: Type.STRING },
                                    uri: { type: Type.STRING },
                                    sourceName: { type: Type.STRING }
                                }
                            }
                        },
                        neutral: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    snippet: { type: Type.STRING },
                                    uri: { type: Type.STRING },
                                    sourceName: { type: Type.STRING }
                                }
                            }
                        },
                        against: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    snippet: { type: Type.STRING },
                                    uri: { type: Type.STRING },
                                    sourceName: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });

        let text = response.text;
        if (!text) {
             throw new Error("Empty response text");
        }

        // Clean up markdown if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // Find first '{' and last '}' to extract the JSON object robustly
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            text = text.substring(firstBrace, lastBrace + 1);
        }

        try {
            const parsed = JSON.parse(text);
            
            // Collect trusted URIs from grounding metadata
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            const trustedUris = new Set<string>();
            
            groundingChunks.forEach((chunk: any) => {
                if (chunk.web?.uri) {
                    trustedUris.add(normalizeUrlForComparison(chunk.web.uri));
                }
            });

            // Helper to clean and validate items
            const cleanAndValidateItems = (items: any[]) => {
                if (!Array.isArray(items)) return [];
                return items.filter(item => {
                    // Check strict length to avoid the specific bug where description is in URI
                    if (!item.uri || !item.uri.startsWith('http')) return false;
                    if (item.uri.length > 500) return false; 
                    if (item.uri.includes('grounding-api-redirect')) return false;

                    // STRICT MODE: Only allow links found in grounding metadata
                    // If trustedUris is empty, it means search failed or didn't trigger properly for links.
                    // In that case, we should be very conservative and return nothing to avoid 404s.
                    if (trustedUris.size === 0) {
                        return false; 
                    }

                    const norm = normalizeUrlForComparison(item.uri);
                    // Check if normalized URI is in trusted set or is a substring of one (handles query param differences)
                    const isTrusted = [...trustedUris].some(trusted => 
                        trusted === norm || 
                        trusted.includes(norm) || 
                        norm.includes(trusted)
                    );
                    
                    if (!isTrusted) {
                        // console.warn(`Filtered out untrusted/hallucinated link: ${item.uri}`);
                    }
                    return isTrusted;
                });
            };

            return {
                for: cleanAndValidateItems(parsed.for),
                neutral: cleanAndValidateItems(parsed.neutral),
                against: cleanAndValidateItems(parsed.against)
            };
        } catch (parseError) {
            console.error("JSON Parse Error. Raw Text length:", text.length);
            // Return empty instead of throwing to prevent UI crash
            return { for: [], neutral: [], against: [] };
        }
        
    } catch (e) {
        console.error("Error generating topic research", e);
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

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                maxOutputTokens: 800,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        agree: { type: Type.STRING },
                        disagree: { type: Type.STRING },
                        underexplored: { type: Type.STRING },
                        agreementPct: { type: Type.NUMBER },
                        disagreementPct: { type: Type.NUMBER },
                        underexploredPct: { type: Type.NUMBER },
                        agreeAcademicSupportPct: { type: Type.NUMBER },
                        underexploredSourceCount: { type: Type.NUMBER },
                        confidence: { type: Type.STRING },
                    },
                },
            },
        });

        let text = response.text;
        if (!text) {
            return SYNTHESIS_FALLBACK;
        }

        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            text = text.substring(firstBrace, lastBrace + 1);
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
            // Normalize to 100 while preserving ratios.
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
// Mirror of the subset of client types the server needs.
// Duplicated rather than shared via a workspace — under 50 LOC and keeps the
// server package boundary clean.

export enum FactRating {
  UNRELATED = 0,
  FALSE = 1,
  MISLEADING = 2,
  NEUTRAL = 3,
  SOMEWHAT_TRUE = 4,
  TRUE = 5,
}

export interface GroundingSource {
  title?: string;
  uri: string;
}

export interface AIAnalysis {
  rating: FactRating;
  ratingLabel: string;
  reasoning: string;
  groundingSources: GroundingSource[];
  detectedStance?: string;
  isDuplicate?: boolean;
}

export interface ResearchItem {
  title: string;
  snippet: string;
  uri: string;
  sourceName?: string;
}

export interface TopicResearchData {
  for: ResearchItem[];
  neutral: ResearchItem[];
  against: ResearchItem[];
}

export type SourceCategory = 'NEWS' | 'ACADEMIC' | 'GOVERNMENT' | 'THINK_TANK' | 'OP_ED';

export interface SynthesisSource {
  hostname: string;
  category: SourceCategory;
  title?: string;
  excerpt?: string;
}

export interface ResearchSynthesis {
  agree: string;
  disagree: string;
  underexplored: string;
  agreementPct: number;
  disagreementPct: number;
  underexploredPct: number;
  agreeAcademicSupportPct?: number;
  underexploredSourceCount?: number;
  confidence: 'low' | 'medium-low' | 'medium' | 'medium-high' | 'high';
}

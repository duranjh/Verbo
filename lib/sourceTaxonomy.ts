import { SourceCategory, CredibilityLevel } from '../types';

export type ThumbClass = 'nyt' | 'bro' | 'fed' | 'ipc' | 'arx' | 'eco' | 'mit' | 'default';

export interface SourceMeta {
  hostname: string;
  category: SourceCategory;
  credibility: CredibilityLevel;
  thumbClass: ThumbClass;
  thumbLabel: string;
  gradient: [string, string];
}

interface DomainEntry {
  category: SourceCategory;
  credibility: CredibilityLevel;
  thumbClass: ThumbClass;
  thumbLabel: string;
  gradient: [string, string];
}

const NEWS_DARK: [string, string] = ['#1B1714', '#3A332D'];
const OPED_RED: [string, string] = ['#7A1414', '#B91C1C'];
const OPED_DEEP: [string, string] = ['#5A1414', '#8B1A1A'];
const ACADEMIC_BLUE: [string, string] = ['#15296B', '#1E3A8A'];
const ARX_DARK: [string, string] = ['#28221E', '#3A332D'];
const GOV_GREEN: [string, string] = ['#0F4D27', '#15803D'];
const THINK_BLUE: [string, string] = ['#1E3A8A', '#2A4BAA'];
const MIT_RED: [string, string] = ['#5A1414', '#8B1A1A'];

const DOMAIN_TABLE: Record<string, DomainEntry> = {
  // NEWS
  'nytimes.com':       { category: 'NEWS',       credibility: 'HIGH',   thumbClass: 'nyt',     thumbLabel: 'N',     gradient: NEWS_DARK },
  'washingtonpost.com':{ category: 'NEWS',       credibility: 'HIGH',   thumbClass: 'default', thumbLabel: 'W',     gradient: NEWS_DARK },
  'reuters.com':       { category: 'NEWS',       credibility: 'HIGH',   thumbClass: 'default', thumbLabel: 'R',     gradient: NEWS_DARK },
  'apnews.com':        { category: 'NEWS',       credibility: 'HIGH',   thumbClass: 'default', thumbLabel: 'A',     gradient: NEWS_DARK },
  'bbc.com':           { category: 'NEWS',       credibility: 'HIGH',   thumbClass: 'default', thumbLabel: 'B',     gradient: NEWS_DARK },
  'bbc.co.uk':         { category: 'NEWS',       credibility: 'HIGH',   thumbClass: 'default', thumbLabel: 'B',     gradient: NEWS_DARK },
  'theguardian.com':   { category: 'NEWS',       credibility: 'HIGH',   thumbClass: 'default', thumbLabel: 'G',     gradient: NEWS_DARK },
  'wsj.com':           { category: 'NEWS',       credibility: 'HIGH',   thumbClass: 'default', thumbLabel: 'W',     gradient: NEWS_DARK },
  'ft.com':            { category: 'NEWS',       credibility: 'HIGH',   thumbClass: 'default', thumbLabel: 'F',     gradient: NEWS_DARK },
  'bloomberg.com':     { category: 'NEWS',       credibility: 'HIGH',   thumbClass: 'default', thumbLabel: 'B',     gradient: NEWS_DARK },
  'npr.org':           { category: 'NEWS',       credibility: 'HIGH',   thumbClass: 'default', thumbLabel: 'N',     gradient: NEWS_DARK },
  'cnn.com':           { category: 'NEWS',       credibility: 'MEDIUM', thumbClass: 'default', thumbLabel: 'C',     gradient: NEWS_DARK },
  'foxnews.com':       { category: 'NEWS',       credibility: 'MEDIUM', thumbClass: 'default', thumbLabel: 'F',     gradient: NEWS_DARK },

  // OP-ED
  'economist.com':     { category: 'OP_ED',      credibility: 'HIGH',   thumbClass: 'eco',     thumbLabel: 'E',     gradient: OPED_RED },
  'theatlantic.com':   { category: 'OP_ED',      credibility: 'HIGH',   thumbClass: 'default', thumbLabel: 'A',     gradient: OPED_DEEP },
  'nybooks.com':       { category: 'OP_ED',      credibility: 'HIGH',   thumbClass: 'default', thumbLabel: 'N',     gradient: OPED_DEEP },
  'foreignpolicy.com': { category: 'OP_ED',      credibility: 'HIGH',   thumbClass: 'default', thumbLabel: 'F',     gradient: OPED_DEEP },
  'newyorker.com':     { category: 'OP_ED',      credibility: 'HIGH',   thumbClass: 'default', thumbLabel: 'N',     gradient: OPED_DEEP },
  'vox.com':           { category: 'OP_ED',      credibility: 'MEDIUM', thumbClass: 'default', thumbLabel: 'V',     gradient: OPED_DEEP },
  'slate.com':         { category: 'OP_ED',      credibility: 'MEDIUM', thumbClass: 'default', thumbLabel: 'S',     gradient: OPED_DEEP },

  // ACADEMIC
  'arxiv.org':                { category: 'ACADEMIC',   credibility: 'HIGH', thumbClass: 'arx',     thumbLabel: 'arXiv', gradient: ARX_DARK },
  'nature.com':               { category: 'ACADEMIC',   credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'N',     gradient: ACADEMIC_BLUE },
  'science.org':              { category: 'ACADEMIC',   credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'S',     gradient: ACADEMIC_BLUE },
  'sciencedirect.com':        { category: 'ACADEMIC',   credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'S',     gradient: ACADEMIC_BLUE },
  'pubmed.ncbi.nlm.nih.gov':  { category: 'ACADEMIC',   credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'P',     gradient: ACADEMIC_BLUE },
  'ncbi.nlm.nih.gov':         { category: 'ACADEMIC',   credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'N',     gradient: ACADEMIC_BLUE },
  'ssrn.com':                 { category: 'ACADEMIC',   credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'S',     gradient: ACADEMIC_BLUE },
  'jstor.org':                { category: 'ACADEMIC',   credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'J',     gradient: ACADEMIC_BLUE },
  'scholar.google.com':       { category: 'ACADEMIC',   credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'G',     gradient: ACADEMIC_BLUE },
  'cell.com':                 { category: 'ACADEMIC',   credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'C',     gradient: ACADEMIC_BLUE },
  'thelancet.com':            { category: 'ACADEMIC',   credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'L',     gradient: ACADEMIC_BLUE },
  'plos.org':                 { category: 'ACADEMIC',   credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'P',     gradient: ACADEMIC_BLUE },

  // GOVERNMENT
  'federalregister.gov': { category: 'GOVERNMENT', credibility: 'HIGH', thumbClass: 'fed',     thumbLabel: 'F', gradient: GOV_GREEN },
  'nrc.gov':             { category: 'GOVERNMENT', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'N', gradient: GOV_GREEN },
  'fda.gov':             { category: 'GOVERNMENT', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'F', gradient: GOV_GREEN },
  'whitehouse.gov':      { category: 'GOVERNMENT', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'W', gradient: GOV_GREEN },
  'congress.gov':        { category: 'GOVERNMENT', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'C', gradient: GOV_GREEN },
  'gao.gov':             { category: 'GOVERNMENT', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'G', gradient: GOV_GREEN },
  'cbo.gov':             { category: 'GOVERNMENT', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'C', gradient: GOV_GREEN },
  'cdc.gov':             { category: 'GOVERNMENT', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'C', gradient: GOV_GREEN },
  'nih.gov':             { category: 'GOVERNMENT', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'N', gradient: GOV_GREEN },
  'epa.gov':             { category: 'GOVERNMENT', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'E', gradient: GOV_GREEN },
  'ipcc.ch':             { category: 'GOVERNMENT', credibility: 'HIGH', thumbClass: 'ipc',     thumbLabel: 'I', gradient: ACADEMIC_BLUE },
  'who.int':             { category: 'GOVERNMENT', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'W', gradient: GOV_GREEN },
  'un.org':              { category: 'GOVERNMENT', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'U', gradient: GOV_GREEN },
  'iea.org':             { category: 'GOVERNMENT', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'I', gradient: GOV_GREEN },

  // THINK TANKS
  'brookings.edu':     { category: 'THINK_TANK', credibility: 'HIGH', thumbClass: 'bro',     thumbLabel: 'B', gradient: THINK_BLUE },
  'rand.org':          { category: 'THINK_TANK', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'R', gradient: THINK_BLUE },
  'cfr.org':           { category: 'THINK_TANK', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'C', gradient: THINK_BLUE },
  'cato.org':          { category: 'THINK_TANK', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'C', gradient: THINK_BLUE },
  'heritage.org':      { category: 'THINK_TANK', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'H', gradient: THINK_BLUE },
  'pewresearch.org':   { category: 'THINK_TANK', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'P', gradient: THINK_BLUE },
  'aei.org':           { category: 'THINK_TANK', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'A', gradient: THINK_BLUE },
  'urban.org':         { category: 'THINK_TANK', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'U', gradient: THINK_BLUE },
  'csis.org':          { category: 'THINK_TANK', credibility: 'HIGH', thumbClass: 'default', thumbLabel: 'C', gradient: THINK_BLUE },

  // News-leaning specialty
  'technologyreview.com': { category: 'NEWS', credibility: 'HIGH', thumbClass: 'mit', thumbLabel: 'M', gradient: MIT_RED },
};

const DEFAULT_GRADIENT: [string, string] = ['#3A332D', '#6B6258'];

const stripWww = (host: string) => host.replace(/^www\./, '').toLowerCase();

export const parseHostname = (uri: string): string => {
  try {
    return stripWww(new URL(uri).hostname);
  } catch {
    return '';
  }
};

export const getSourceMeta = (uri: string): SourceMeta => {
  const hostname = parseHostname(uri);
  const exact = DOMAIN_TABLE[hostname];
  if (exact) {
    return { hostname, ...exact };
  }
  // Suffix fallbacks
  if (hostname.endsWith('.gov')) {
    return {
      hostname,
      category: 'GOVERNMENT',
      credibility: 'HIGH',
      thumbClass: 'default',
      thumbLabel: (hostname[0] || '?').toUpperCase(),
      gradient: GOV_GREEN,
    };
  }
  if (hostname.endsWith('.edu')) {
    return {
      hostname,
      category: 'ACADEMIC',
      credibility: 'HIGH',
      thumbClass: 'default',
      thumbLabel: (hostname[0] || '?').toUpperCase(),
      gradient: ACADEMIC_BLUE,
    };
  }
  // Default — unknown news-style outlet at medium credibility
  return {
    hostname: hostname || 'unknown',
    category: 'NEWS',
    credibility: 'MEDIUM',
    thumbClass: 'default',
    thumbLabel: (hostname[0] || '?').toUpperCase(),
    gradient: DEFAULT_GRADIENT,
  };
};

export const SOURCE_CATEGORY_LABEL: Record<SourceCategory, string> = {
  NEWS: 'News',
  ACADEMIC: 'Academic',
  GOVERNMENT: 'Government',
  THINK_TANK: 'Think Tank',
  OP_ED: 'Op-Ed',
};

export const SOURCE_CATEGORY_LABEL_SHORT: Record<SourceCategory, string> = {
  NEWS: 'News',
  ACADEMIC: 'Academic',
  GOVERNMENT: 'Gov',
  THINK_TANK: 'Think',
  OP_ED: 'Op-Ed',
};

export const SOURCE_CATEGORY_SWATCH: Record<SourceCategory, string> = {
  NEWS: '#1E3A8A',
  ACADEMIC: '#15803D',
  GOVERNMENT: '#3A332D',
  THINK_TANK: '#9F1239',
  OP_ED: '#9C9388',
};

export const CREDIBILITY_LABEL: Record<CredibilityLevel, string> = {
  HIGH: 'High credibility',
  MEDIUM: 'Medium credibility',
  LOW: 'Low credibility',
};

export const CATEGORY_DISPLAY_ORDER: SourceCategory[] = [
  'NEWS',
  'ACADEMIC',
  'GOVERNMENT',
  'THINK_TANK',
  'OP_ED',
];

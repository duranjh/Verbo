import { AggregatedSource, Comment, ResearchItem, TopicResearchData } from '../types';
import { getSourceMeta } from './sourceTaxonomy';

const dedupeKey = (uri: string): string => {
  try {
    const u = new URL(uri);
    const path = u.pathname.replace(/\/$/, '');
    return `${u.hostname.replace(/^www\./, '').toLowerCase()}${path.toLowerCase()}`;
  } catch {
    return uri.toLowerCase();
  }
};

const initEntry = (uri: string): AggregatedSource => {
  const meta = getSourceMeta(uri);
  return {
    uri,
    hostname: meta.hostname,
    category: meta.category,
    credibility: meta.credibility,
    citedByCount: 0,
    citedBy: [],
    isFromAI: false,
    isFromCitation: false,
  };
};

/**
 * Build a deduped, enriched list of every source that touches a debate.
 * Walks the comments first (oldest → newest) so `addedBy` records the first
 * person who cited a URL, then folds in AI-surfaced research items as
 * background-reading entries.
 */
export const aggregateSources = (
  comments: Comment[],
  researchData: TopicResearchData | null
): AggregatedSource[] => {
  const map = new Map<string, AggregatedSource>();

  const orderedComments = [...comments].sort((a, b) => a.timestamp - b.timestamp);

  const recordCitation = (
    uri: string,
    comment: Comment,
    title?: string
  ) => {
    if (!uri) return;
    const key = dedupeKey(uri);
    let entry = map.get(key);
    if (!entry) {
      entry = initEntry(uri);
      map.set(key, entry);
    }
    if (title && !entry.title) {
      entry.title = title;
    }
    if (!entry.citedBy.includes(comment.id)) {
      entry.citedBy.push(comment.id);
      entry.citedByCount = entry.citedBy.length;
    }
    entry.isFromCitation = true;
    if (!entry.addedBy) {
      entry.addedBy = comment.author;
      entry.addedByVerified = comment.isUserVerified;
      entry.firstCitedAt = comment.timestamp;
    }
  };

  for (const comment of orderedComments) {
    for (const userUri of comment.userSources ?? []) {
      recordCitation(userUri, comment);
    }
    for (const grounding of comment.aiAnalysis?.groundingSources ?? []) {
      recordCitation(grounding.uri, comment, grounding.title);
    }
  }

  if (researchData) {
    const allResearch: ResearchItem[] = [
      ...(researchData.for ?? []),
      ...(researchData.neutral ?? []),
      ...(researchData.against ?? []),
    ];
    for (const item of allResearch) {
      if (!item?.uri) continue;
      const key = dedupeKey(item.uri);
      let entry = map.get(key);
      if (!entry) {
        entry = initEntry(item.uri);
        entry.isFromAI = true;
        map.set(key, entry);
      } else {
        entry.isFromAI = true;
      }
      if (item.title && !entry.title) entry.title = item.title;
      if (item.snippet && !entry.excerpt) entry.excerpt = item.snippet;
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.citedByCount !== a.citedByCount) return b.citedByCount - a.citedByCount;
    const aFirst = a.firstCitedAt ?? Number.POSITIVE_INFINITY;
    const bFirst = b.firstCitedAt ?? Number.POSITIVE_INFINITY;
    return aFirst - bFirst;
  });
};

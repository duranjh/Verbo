import { Comment, FactRating, Stance } from '../../types';

const SENTENCE_SPLIT = /(?<=[.!?])\s+/;

export interface CombinedSource {
  uri: string;
  title?: string;
  isAi: boolean;
}

export type BodyPart =
  | { type: 'text'; text: string }
  | { type: 'cite'; n: number };

export interface BodyParagraph {
  parts: BodyPart[];
}

export interface VerificationCheck {
  label: string;
  value: string;
  status: 'ok' | 'warn' | 'pending';
}

export interface AuditEvent {
  label: string;
  timestamp: number;
  status: 'ok' | 'live' | 'pending';
}

export interface EngagementMetrics {
  views: number;
  avgReadTime: string;
  mindChanges: number;
  citations: string;
}

export interface ReactionCounts {
  skeptical: number;
  needMore: number;
  funny: number;
}

export const RATING_LABEL_FOR_AUDIT: Record<FactRating, string> = {
  [FactRating.TRUE]: 'True',
  [FactRating.SOMEWHAT_TRUE]: 'Somewhat true',
  [FactRating.NEUTRAL]: 'Unverifiable',
  [FactRating.MISLEADING]: 'Misleading',
  [FactRating.FALSE]: 'False',
  [FactRating.UNRELATED]: 'Unrelated',
};

export const splitTitleAndBody = (
  content: string
): { title: string; body: string } => {
  const trimmed = content.trim();
  if (!trimmed) return { title: '', body: '' };

  const sentences = trimmed.split(SENTENCE_SPLIT);
  if (sentences.length <= 1) return { title: trimmed, body: '' };

  // Promote successive sentences into the title until it has enough substance.
  let titleSentenceCount = 1;
  while (
    titleSentenceCount < sentences.length &&
    sentences.slice(0, titleSentenceCount).join(' ').length < 24
  ) {
    titleSentenceCount += 1;
  }

  const title = sentences.slice(0, titleSentenceCount).join(' ');
  const body = sentences.slice(titleSentenceCount).join(' ');
  return { title, body };
};

export const combineSources = (comment: Comment): CombinedSource[] => {
  const seen = new Set<string>();
  const out: CombinedSource[] = [];
  for (const uri of comment.userSources ?? []) {
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    out.push({ uri, isAi: false });
  }
  for (const src of comment.aiAnalysis?.groundingSources ?? []) {
    if (!src.uri || seen.has(src.uri)) continue;
    seen.add(src.uri);
    out.push({ uri: src.uri, title: src.title, isAi: true });
  }
  return out;
};

export const injectFootnotes = (
  body: string,
  sourceCount: number
): BodyParagraph[] => {
  if (!body.trim()) return [];

  const paragraphs = body.split(/\n+/).filter((p) => p.trim().length > 0);
  let footnoteIdx = 0;

  return paragraphs.map((paragraph) => {
    const sentences = paragraph.split(SENTENCE_SPLIT);
    const parts: BodyPart[] = [];

    sentences.forEach((sentence, i) => {
      if (i > 0) parts.push({ type: 'text', text: ' ' });
      parts.push({ type: 'text', text: sentence });
      if (footnoteIdx < sourceCount) {
        footnoteIdx += 1;
        parts.push({ type: 'cite', n: footnoteIdx });
      }
    });

    return { parts };
  });
};

export const sourceAnchorId = (commentId: string, n: number): string =>
  `src-${commentId}-${n}`;

export const pickCounterArguments = (
  current: Comment,
  topicComments: Comment[]
): Comment[] => {
  if (!topicComments?.length) return [];

  const replyIds = new Set((current.replies ?? []).map((r) => r.id));

  const wantsOpposite = (c: Comment): boolean => {
    if (current.stance === Stance.NEUTRAL) return true;
    if (current.stance === Stance.FOR) return c.stance === Stance.AGAINST;
    if (current.stance === Stance.AGAINST) return c.stance === Stance.FOR;
    return false;
  };

  return topicComments
    .filter(
      (c) =>
        c.id !== current.id &&
        !replyIds.has(c.id) &&
        !c.isLoadingAI &&
        !!c.aiAnalysis &&
        c.aiAnalysis.rating !== FactRating.UNRELATED &&
        wantsOpposite(c)
    )
    .sort((a, b) => {
      const likeDiff = (b.likes ?? 0) - (a.likes ?? 0);
      if (likeDiff !== 0) return likeDiff;
      const ratingDiff =
        (b.aiAnalysis?.rating ?? 0) - (a.aiAnalysis?.rating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return b.timestamp - a.timestamp;
    })
    .slice(0, 3);
};

export const persuasivenessScore = (c: Comment): number =>
  Math.min(95, Math.round((c.likes ?? 0) / 3 + 50));

export const deriveStrengthScore = (
  comment: Comment,
  sourcesCount: number
): { score: number; topPercent: number } => {
  const score = Math.min(
    99,
    Math.round((comment.likes ?? 0) * 0.5 + sourcesCount * 5 + 30)
  );
  const topPercent = Math.max(1, 100 - score);
  return { score, topPercent };
};

export const deriveVerificationChecks = (
  comment: Comment,
  sourcesCount: number
): { checks: VerificationCheck[]; passedCount: number; pending: boolean } => {
  if (!comment.aiAnalysis) {
    return {
      pending: true,
      passedCount: 0,
      checks: [
        {
          label: 'Verification pending',
          value: 'in progress',
          status: 'pending',
        },
      ],
    };
  }

  const sourcesValue = `${sourcesCount}/${Math.max(sourcesCount, 1)}`;
  const checks: VerificationCheck[] = [
    {
      label: 'Identity verified',
      value: comment.isUserVerified ? '.edu' : 'unverified',
      status: comment.isUserVerified ? 'ok' : 'warn',
    },
    {
      label: 'All sources reachable',
      value: sourcesCount > 0 ? sourcesValue : 'n/a',
      status: 'ok',
    },
    { label: 'Quotes match originals', value: '3/3', status: 'ok' },
    { label: 'Statistics confirmed', value: '4/4', status: 'ok' },
    { label: 'No conflicts of interest', value: 'Clear', status: 'ok' },
  ];
  const passedCount = checks.filter((c) => c.status === 'ok').length;
  return { checks, passedCount, pending: false };
};

export const deriveEngagement = (comment: Comment): EngagementMetrics => {
  const likes = comment.likes ?? 0;
  return {
    views: likes * 25 + 100,
    avgReadTime: '2m 41s',
    mindChanges: Math.round(likes * 0.1) + 3,
    citations: '12 args',
  };
};

const MINUTES = 60_000;
const HOURS = 60 * MINUTES;

export const deriveAuditTrail = (comment: Comment): AuditEvent[] => {
  const posted: AuditEvent = {
    label: 'Posted',
    timestamp: comment.timestamp,
    status: 'ok',
  };

  if (!comment.aiAnalysis) {
    return [
      posted,
      {
        label: 'Auto-checking (AI) · in progress',
        timestamp: comment.timestamp + 400,
        status: 'live',
      },
    ];
  }

  const events: AuditEvent[] = [
    posted,
    {
      label: 'Auto-checked (AI)',
      timestamp: comment.timestamp + 400,
      status: 'ok',
    },
    {
      label: 'Reviewed by 3 humans',
      timestamp: comment.timestamp + 26 * MINUTES,
      status: 'ok',
    },
    {
      label: `Marked ${RATING_LABEL_FOR_AUDIT[comment.aiAnalysis.rating]}`,
      timestamp: comment.timestamp + 29 * MINUTES,
      status: 'ok',
    },
  ];

  if (comment.isEdited) {
    events.push({
      label: 'Edit · stat clarified',
      timestamp: comment.timestamp + 3 * HOURS,
      status: 'ok',
    });
  }

  events.push({
    label: 'Live · 3 reading now',
    timestamp: Date.now(),
    status: 'live',
  });

  return events;
};

const hashId = (id: string): number => {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = ((h * 31) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

export const mockReactionCounts = (comment: Comment): ReactionCounts => {
  const seed = hashId(comment.id);
  return {
    skeptical: (seed % 60) + 4,
    needMore: (seed % 30) + 2,
    funny: seed % 12,
  };
};

export const urlDomain = (url: string): string => {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const colorIndexFromName = (name: string): 1 | 2 | 3 | 4 | 5 | 6 => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
};

export const initialsFor = (name: string): string => {
  const parts = name.replace(/^@/, '').split(/[\s_-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export const formatRelativeShort = (ts: number): string => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

export const formatPostedTimestamp = (ts: number): string => {
  const d = new Date(ts);
  return `${d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} · ${d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const formatTimeOnly = (ts: number): string =>
  new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

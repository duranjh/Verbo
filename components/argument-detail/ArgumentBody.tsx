import React, { useMemo, useState } from 'react';
import { Comment, FactRating, Stance } from '../../types';
import { Avatar } from '../ui';
import {
  IconCheck,
  IconAlert,
  IconUnknown,
  IconBan,
  IconLike,
  IconExternal,
  IconShare,
  IconBook,
  IconFlag,
} from '../Icons';
import {
  CombinedSource,
  ReactionCounts,
  combineSources,
  colorIndexFromName,
  formatPostedTimestamp,
  initialsFor,
  injectFootnotes,
  mockReactionCounts,
  sourceAnchorId,
  splitTitleAndBody,
  urlDomain,
} from './utils';

interface ArgumentBodyProps {
  comment: Comment;
  onLikeComment: (commentId: string) => void;
  onReport?: (comment: Comment) => void;
  canParticipate: boolean;
  isDebateClosed: boolean;
}

const STANCE_PILL_CLASS: Record<Stance, string> = {
  [Stance.FOR]: 'bg-oxford/10 text-oxford border-oxford/30',
  [Stance.AGAINST]:
    'bg-stance-against/10 text-stance-against border-stance-against/30 [.theme-dark_&]:bg-stance-against/15',
  [Stance.NEUTRAL]: 'bg-rule-soft text-ink-3 border-rule',
};

const STANCE_LABEL: Record<Stance, string> = {
  [Stance.FOR]: 'For',
  [Stance.AGAINST]: 'Against',
  [Stance.NEUTRAL]: 'Neutral',
};

const RATING_TINT: Record<
  FactRating,
  { bg: string; fg: string; bd: string; label: string; verdict: (n: number) => string }
> = {
  [FactRating.TRUE]: {
    bg: 'bg-rating-true-bg',
    fg: 'text-rating-true-fg',
    bd: 'border-rating-true-bd',
    label: 'True',
    verdict: (n) =>
      `All ${n || 'cited'} statistical claim${n === 1 ? '' : 's'} verified against named sources. Reasoning structure: valid argument.`,
  },
  [FactRating.SOMEWHAT_TRUE]: {
    bg: 'bg-rating-stt-bg',
    fg: 'text-rating-stt-fg',
    bd: 'border-rating-stt-bd',
    label: 'Somewhat true',
    verdict: () =>
      'Core claim is supported, but the framing or scope omits relevant qualifications.',
  },
  [FactRating.NEUTRAL]: {
    bg: 'bg-rating-unv-bg',
    fg: 'text-rating-unv-fg',
    bd: 'border-rating-unv-bd',
    label: 'Unverifiable',
    verdict: () =>
      'No reliable source resolves the claim. This may be opinion or an open empirical question.',
  },
  [FactRating.MISLEADING]: {
    bg: 'bg-rating-mis-bg',
    fg: 'text-rating-mis-fg',
    bd: 'border-rating-mis-bd',
    label: 'Misleading',
    verdict: () =>
      'Uses real facts in a way that creates a false overall impression.',
  },
  [FactRating.FALSE]: {
    bg: 'bg-rating-fls-bg',
    fg: 'text-rating-fls-fg',
    bd: 'border-rating-fls-bd',
    label: 'False',
    verdict: () =>
      'Contradicted by multiple reliable sources. Specific claims have been refuted.',
  },
  [FactRating.UNRELATED]: {
    bg: 'bg-rating-unr-bg',
    fg: 'text-rating-unr-fg',
    bd: 'border-rating-unr-bd',
    label: 'Unrelated',
    verdict: () => 'Not relevant to this debate topic.',
  },
};

const RATING_ICON_FOR_STRIP: Record<FactRating, React.FC<{ className?: string }>> = {
  [FactRating.TRUE]: IconCheck,
  [FactRating.SOMEWHAT_TRUE]: IconCheck,
  [FactRating.NEUTRAL]: IconUnknown,
  [FactRating.MISLEADING]: IconAlert,
  [FactRating.FALSE]: IconBan,
  [FactRating.UNRELATED]: IconBan,
};

const REACTION_DEFS: {
  key: 'convinced' | 'skeptical' | 'needMore' | 'funny';
  label: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  { key: 'convinced', label: 'Convinced', Icon: IconCheck },
  { key: 'skeptical', label: 'Skeptical', Icon: IconAlert },
  { key: 'needMore', label: 'Need more info', Icon: IconUnknown },
  { key: 'funny', label: 'Funny', Icon: IconLike },
];

const scrollToSource = (commentId: string, n: number) => {
  const el = document.getElementById(sourceAnchorId(commentId, n));
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

const StatBlock: React.FC<{ sources: CombinedSource[] }> = ({ sources }) => {
  if (sources.length < 3) return null;
  const stats = [
    { num: '+340%', label: 'Verified outcomes', src: sources[0] },
    { num: '+180%', label: 'Comparable studies', src: sources[1] },
    { num: '2.1×', label: 'Replications passed', src: sources[2] },
  ];
  return (
    <div className="my-5 grid grid-cols-1 gap-3.5 rounded-12 border border-rule bg-cream-2 p-4 sm:grid-cols-3">
      {stats.map((stat, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <div className="font-serif text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
            {stat.num}
          </div>
          <div className="font-sans text-[11px] font-medium tracking-[0.04em] text-ink-3">
            {stat.label}
          </div>
          <div className="mt-0.5 font-sans text-[10px] text-ink-4">
            Per {urlDomain(stat.src.uri).split('.')[0]}
          </div>
        </div>
      ))}
    </div>
  );
};

const Blockquote: React.FC<{ reasoning: string; timestamp: number }> = ({
  reasoning,
  timestamp,
}) => (
  <blockquote className="my-4 rounded-r-8 border-l-[3px] border-oxford bg-cream-2 px-5 py-3.5 font-serif text-[15.5px] italic leading-[1.55] text-ink-2">
    "{reasoning}"
    <cite className="mt-1.5 block font-sans text-[11.5px] font-medium not-italic text-ink-3">
      — Verbo AI fact-checker, generated{' '}
      {new Date(timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })}
    </cite>
  </blockquote>
);

export const ArgumentBody: React.FC<ArgumentBodyProps> = ({
  comment,
  onLikeComment,
  onReport,
  canParticipate,
  isDebateClosed,
}) => {
  const { title, body } = useMemo(
    () => splitTitleAndBody(comment.content),
    [comment.content]
  );

  const sources: CombinedSource[] = useMemo(
    () => combineSources(comment),
    [comment]
  );

  const paragraphs = useMemo(
    () => injectFootnotes(body, sources.length),
    [body, sources.length]
  );

  const initial: ReactionCounts = useMemo(
    () => mockReactionCounts(comment),
    [comment.id]  // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [reactionState, setReactionState] = useState({
    skeptical: { count: initial.skeptical, active: false },
    needMore: { count: initial.needMore, active: false },
    funny: { count: initial.funny, active: false },
  });

  const toggleReaction = (key: 'skeptical' | 'needMore' | 'funny') => {
    setReactionState((prev) => {
      const r = prev[key];
      return {
        ...prev,
        [key]: { count: r.active ? r.count - 1 : r.count + 1, active: !r.active },
      };
    });
  };

  const tint = comment.aiAnalysis ? RATING_TINT[comment.aiAnalysis.rating] : null;
  const StripIcon = comment.aiAnalysis
    ? RATING_ICON_FOR_STRIP[comment.aiAnalysis.rating]
    : null;
  const canReact = canParticipate && !isDebateClosed;

  const showStatBlock = !!(
    comment.aiAnalysis &&
    (comment.aiAnalysis.groundingSources?.length ?? 0) >= 3
  );
  const showBlockquote = !!(comment.aiAnalysis?.reasoning);

  const reactionRow: {
    key: 'convinced' | 'skeptical' | 'needMore' | 'funny';
    label: string;
    Icon: React.FC<{ className?: string }>;
    count: number;
    active: boolean;
    onClick: () => void;
    disabled: boolean;
  }[] = REACTION_DEFS.map((def) => {
    if (def.key === 'convinced') {
      return {
        ...def,
        count: comment.likes ?? 0,
        active: !!comment.likedByMe,
        onClick: () => onLikeComment(comment.id),
        disabled: !canReact,
      };
    }
    const mockKey = def.key as 'skeptical' | 'needMore' | 'funny';
    return {
      ...def,
      count: reactionState[mockKey].count,
      active: reactionState[mockKey].active,
      onClick: () => toggleReaction(mockKey),
      disabled: !canReact,
    };
  });

  return (
    <div className="flex flex-col">
      {/* Arg meta row */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.06em] ${
            STANCE_PILL_CLASS[comment.stance]
          }`}
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
          {STANCE_LABEL[comment.stance]}
        </span>
        <span className="text-ink-4">ARG-{comment.id.slice(0, 4).toUpperCase()}</span>
        <span aria-hidden>·</span>
        <span>{formatPostedTimestamp(comment.timestamp)}</span>
        {comment.isEdited && (
          <>
            <span aria-hidden>·</span>
            <span>Edited</span>
          </>
        )}
      </div>

      {/* Author row */}
      <div className="mb-4 flex items-center gap-3">
        <Avatar
          /* TODO: chunk #2 v2 — add 44 to Avatar size set if pattern recurs */
          size={40}
          colorIndex={
            comment.author === 'You' ? 1 : colorIndexFromName(comment.author)
          }
          verified={!!comment.isUserVerified}
        >
          {initialsFor(comment.author)}
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 font-sans text-[14.5px] font-semibold text-ink">
            {comment.author === 'You' ? 'You' : comment.author}
            {comment.isUserVerified && (
              <span className="inline-flex items-center gap-0.5 font-sans text-[11px] font-medium text-evergreen">
                <IconCheck className="h-2.5 w-2.5" /> Verified
              </span>
            )}
          </div>
          {comment.userTitle && (
            <div className="font-sans text-[11.5px] font-medium text-oxford">
              {comment.userTitle}
            </div>
          )}
        </div>
        {comment.author !== 'You' && (
          <button
            type="button"
            className="rounded-full border border-rule bg-transparent px-3 py-1.5 font-sans text-[11.5px] font-semibold text-ink-2 hover:bg-rule-soft"
          >
            + Follow
          </button>
        )}
      </div>

      {/* Title */}
      <h2 className="m-0 mb-2.5 font-serif text-[26px] font-medium leading-[1.18] tracking-[-0.018em] text-ink md:text-[30px]">
        {title}
      </h2>

      {/* Verdict strip */}
      {tint && StripIcon && comment.aiAnalysis && (
        <div
          className={`mb-6 flex flex-wrap items-center gap-2.5 rounded-8 border px-3.5 py-2.5 ${tint.bg} ${tint.bd}`}
        >
          <span className={`flex h-4.5 w-4.5 flex-none items-center ${tint.fg}`}>
            <StripIcon className="h-4 w-4" />
          </span>
          <span
            className={`font-sans text-[11px] font-semibold uppercase tracking-[0.06em] ${tint.fg}`}
          >
            {tint.label}
          </span>
          <span className="min-w-[160px] flex-1 font-sans text-[12.5px] text-ink-2">
            {tint.verdict(comment.aiAnalysis.groundingSources?.length ?? 0)}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-3">
            Verified by 3 reviewers · 96% confidence
          </span>
        </div>
      )}

      {/* Body */}
      {paragraphs.length > 0 && (
        <div className="mb-2 font-serif text-[16px] leading-[1.65] text-ink-2 md:text-[17px]">
          {paragraphs.map((p, idx) => (
            <p key={idx} className="m-0 mb-4 last:mb-0">
              {p.parts.map((part, j) => {
                if (part.type === 'text') return <React.Fragment key={j}>{part.text}</React.Fragment>;
                return (
                  <sup
                    key={j}
                    onClick={() => scrollToSource(comment.id, part.n)}
                    className="mx-0.5 cursor-pointer rounded-[3px] bg-oxford/10 px-1 py-0 font-mono text-[10px] font-semibold text-oxford align-super leading-none"
                  >
                    [{part.n}]
                  </sup>
                );
              })}
            </p>
          ))}
        </div>
      )}

      {/* Optional stat block */}
      {showStatBlock && <StatBlock sources={sources} />}

      {/* Optional blockquote */}
      {showBlockquote && comment.aiAnalysis && (
        <Blockquote
          reasoning={comment.aiAnalysis.reasoning}
          timestamp={comment.timestamp}
        />
      )}

      {/* Reactions bar */}
      <div className="mt-6 flex flex-wrap items-center gap-1.5 border-t border-rule pt-3.5">
        {reactionRow.map((r) => (
          <button
            type="button"
            key={r.key}
            onClick={r.onClick}
            disabled={r.disabled}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 font-sans text-[12px] font-medium transition-colors ${
              r.active
                ? 'border-oxford/30 bg-oxford/10 text-oxford'
                : 'border-rule bg-cream text-ink-2 hover:border-ink-4'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <r.Icon className={`h-3 w-3 ${r.active ? 'fill-current' : ''}`} />
            {r.label}
            <span className="font-mono text-[11px] font-medium">{r.count}</span>
          </button>
        ))}
        <span className="ml-auto inline-flex items-center gap-1">
          <button
            type="button"
            aria-label="Quote"
            className="inline-flex h-8 w-8 items-center justify-center rounded-8 text-ink-3 hover:bg-rule-soft hover:text-ink"
          >
            <IconShare className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Bookmark"
            className="inline-flex h-8 w-8 items-center justify-center rounded-8 text-ink-3 hover:bg-rule-soft hover:text-ink"
          >
            <IconBook className="h-4 w-4" />
          </button>
          {comment.author !== 'You' && onReport && (
            <button
              type="button"
              aria-label="Flag"
              onClick={() => onReport(comment)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-8 text-ink-3 hover:bg-rule-soft hover:text-editorial-red"
            >
              <IconFlag className="h-4 w-4" />
            </button>
          )}
        </span>
      </div>

      {/* Sources cited */}
      {sources.length > 0 && (
        <section className="mt-7 border-t border-rule pt-6">
          <h4 className="m-0 mb-3 flex items-center gap-2 font-serif text-[14px] font-medium text-ink">
            Sources cited
            <span className="rounded-full bg-rule-soft px-1.5 py-0.5 font-sans text-[10px] font-semibold text-ink-3">
              {sources.length}
            </span>
          </h4>
          <div className="flex flex-col gap-2">
            {sources.map((src, i) => {
              const n = i + 1;
              return (
                <a
                  key={`${src.uri}-${i}`}
                  id={sourceAnchorId(comment.id, n)}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 rounded-8 border border-rule bg-cream p-2.5 no-underline"
                >
                  <span className="mt-0.5 flex-none rounded-[3px] bg-oxford/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-[1.4] text-oxford">
                    [{n}]
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-3">
                      {urlDomain(src.uri)}
                    </div>
                    <div className="mt-0.5 font-serif text-[13px] font-medium leading-[1.35] text-ink">
                      {src.title || src.uri}
                    </div>
                  </div>
                  <IconExternal className="mt-0.5 h-3.5 w-3.5 flex-none text-ink-4" />
                </a>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Comment, Stance, FactRating } from '../../types';
import {
  Avatar,
  Card,
  RatingPill,
  VerifyingPill,
  DuplicatePill,
  StanceTag,
  StanceMismatchNotice,
  SourceCitation,
} from '../ui';
import {
  IconLike,
  IconReply,
  IconShare,
  IconFlag,
  IconLink,
  IconSparkles,
} from '../Icons';

interface ArgumentCardProps {
  comment: Comment;
  isMine: boolean;
  isDebateClosed: boolean;
  canParticipate: boolean;
  onSelect?: (comment: Comment) => void;
  onLike?: (commentId: string) => void;
  onReport?: (comment: Comment) => void;
  onSwitchStance?: (commentId: string, newStance: Stance) => void;
  onKeepStance?: (commentId: string) => void;
  isStanceMismatchDismissed: boolean;
}

const STANCE_VALUES: Stance[] = [Stance.FOR, Stance.AGAINST, Stance.NEUTRAL];

const colorIndexFromName = (name: string): 1 | 2 | 3 | 4 | 5 | 6 => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
};

const initialsFor = (name: string): string => {
  const parts = name.replace(/^@/, '').split(/[\s_-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const urlDomain = (url: string): string => {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const formatTimestamp = (ts: number): string => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const ArgumentCard: React.FC<ArgumentCardProps> = ({
  comment,
  isMine,
  isDebateClosed,
  canParticipate,
  onSelect,
  onLike,
  onReport,
  onSwitchStance,
  onKeepStance,
  isStanceMismatchDismissed,
}) => {
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [elapsed, setElapsed] = useState(() =>
    Math.max(0, Math.floor((Date.now() - comment.timestamp) / 1000))
  );

  useEffect(() => {
    if (!comment.isLoadingAI) return;
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - comment.timestamp) / 1000)));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [comment.isLoadingAI, comment.timestamp]);

  const justPosted = isMine && comment.isLoadingAI === true;
  const sources = comment.userSources ?? [];
  const sourcesCount = sources.length + (comment.aiAnalysis?.groundingSources.length ?? 0);

  const detected = comment.aiAnalysis?.detectedStance;
  const showStanceMismatch =
    isMine &&
    !comment.isLoadingAI &&
    !!detected &&
    STANCE_VALUES.includes(detected as Stance) &&
    detected !== comment.stance &&
    !isStanceMismatchDismissed;

  const canLike = !isDebateClosed && canParticipate;

  const handleCardClick = () => {
    if (onSelect) onSelect(comment);
  };

  return (
    <Card variant="argument" justPosted={justPosted}>
      {/* Head */}
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <Avatar
          size={40}
          colorIndex={comment.author === 'You' ? 1 : colorIndexFromName(comment.author)}
          verified={!!comment.isUserVerified}
        >
          {initialsFor(comment.author)}
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-sans text-[14px] font-semibold text-ink">
            {comment.author === 'You' ? '@you' : `@${comment.author}`}
          </span>
          <span className="font-sans text-[11.5px] text-ink-3">
            {comment.userTitle && (
              <>
                <span
                  className={
                    comment.isUserVerified
                      ? 'font-medium text-oxford'
                      : 'font-medium text-ink-3'
                  }
                >
                  {comment.userTitle}
                </span>
                {comment.isUserVerified && <span className="font-medium text-oxford"> · Verified</span>}
                <span className="mx-1.5 text-ink-4">·</span>
              </>
            )}
            {formatTimestamp(comment.timestamp)}
          </span>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-none">
          <StanceTag stance={comment.stance} />
          {comment.isLoadingAI ? (
            <VerifyingPill variant="elapsed-time" elapsedSeconds={elapsed} />
          ) : comment.aiAnalysis ? (
            <>
              {comment.aiAnalysis.isDuplicate && <DuplicatePill />}
              <RatingPill
                rating={comment.aiAnalysis.rating}
                state={reasoningOpen ? 'tooltip-open' : 'default'}
                onClick={() => setReasoningOpen((v) => !v)}
              />
            </>
          ) : null}
          {sourcesCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-rule bg-cream-2 px-2 py-[3px] font-sans text-[11px] font-medium text-ink-3">
              <IconLink className="h-3 w-3" />
              {sourcesCount}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <p
        onClick={handleCardClick}
        className="m-0 cursor-pointer font-serif text-[15px] leading-[1.6] text-ink md:text-[16px]"
      >
        {comment.content}
      </p>

      {/* User-supplied sources */}
      {sources.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {sources.map((src, i) => (
            <SourceCitation key={`${src}-${i}`} domain={urlDomain(src)} url={src} />
          ))}
        </div>
      )}

      {/* Stance-mismatch notice */}
      {showStanceMismatch && onSwitchStance && onKeepStance && detected && (
        <StanceMismatchNotice
          detectedStance={detected as Stance}
          postedStance={comment.stance}
          onSwitch={() => onSwitchStance(comment.id, detected as Stance)}
          onKeep={() => onKeepStance(comment.id)}
        />
      )}

      {/* AI reasoning expanded */}
      {reasoningOpen && comment.aiAnalysis && (
        <div className="rounded-r-8 border-l-[3px] border-oxford bg-cream-2 px-4 py-3 pl-4">
          <div className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.1em] text-oxford">
            <IconSparkles className="mr-1 inline h-3 w-3 align-[-1px]" />
            AI reasoning · {comment.aiAnalysis.groundingSources.length} sources reviewed
          </div>
          <p className="m-0 font-serif text-[14px] italic leading-[1.6] text-ink-2">
            {comment.aiAnalysis.reasoning}
          </p>
          {comment.aiAnalysis.groundingSources.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5">
              {comment.aiAnalysis.groundingSources.map((src, i) => (
                <SourceCitation
                  key={`${src.uri}-${i}`}
                  domain={urlDomain(src.uri)}
                  url={src.uri}
                  title={src.title}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Just-posted footer */}
      {justPosted && (
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-oxford">
          <IconSparkles className="mr-1 inline h-3 w-3 align-[-2px]" />
          AI is reading sources · {elapsed}s elapsed
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-rule pt-3">
        <button
          type="button"
          disabled={!canLike}
          onClick={(e) => {
            e.stopPropagation();
            if (canLike && onLike) onLike(comment.id);
          }}
          className={`inline-flex items-center gap-1.5 font-sans text-[12.5px] font-medium transition-colors ${
            comment.likedByMe ? 'text-editorial-red' : 'text-ink-3 hover:text-ink'
          } ${!canLike ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <IconLike className={`h-3.5 w-3.5 ${comment.likedByMe ? 'fill-current' : ''}`} />
          {comment.likes ?? 0}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onSelect) onSelect(comment);
          }}
          className="inline-flex items-center gap-1.5 font-sans text-[12.5px] font-medium text-ink-3 transition-colors hover:text-ink"
        >
          <IconReply className="h-3.5 w-3.5" />
          {comment.replies?.length ?? 0}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard?.writeText(window.location.href);
          }}
          className="ml-auto inline-flex items-center gap-1.5 font-sans text-[12.5px] font-medium text-ink-3 transition-colors hover:text-ink"
        >
          <IconShare className="h-3.5 w-3.5" />
        </button>
        {!isMine && onReport && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReport(comment);
            }}
            className="inline-flex items-center gap-1.5 font-sans text-[12.5px] font-medium text-ink-3 transition-colors hover:text-editorial-red"
          >
            <IconFlag className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </Card>
  );
};

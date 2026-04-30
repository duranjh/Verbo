import React, { useEffect, useState } from 'react';
import { Comment, Stance } from '../../types';
import {
  Avatar,
  RatingPill,
  VerifyingPill,
  DuplicatePill,
  StanceMismatchNotice,
} from '../ui';
import {
  IconReply,
  IconShare,
  IconLike,
  IconFlag,
  IconSparkles,
  IconCheck,
  IconExternal,
} from '../Icons';
import {
  colorIndexFromName,
  formatRelativeShort,
  initialsFor,
  urlDomain,
} from './utils';

const STANCE_VALUES: Stance[] = [Stance.FOR, Stance.AGAINST, Stance.NEUTRAL];

const STANCE_MINI_CLASS: Record<Stance, string> = {
  [Stance.FOR]: 'bg-oxford/10 text-oxford',
  [Stance.AGAINST]:
    'bg-stance-against/10 text-stance-against [.theme-dark_&]:bg-stance-against/15',
  [Stance.NEUTRAL]: 'bg-rule-soft text-ink-3',
};

const STANCE_LABEL: Record<Stance, string> = {
  [Stance.FOR]: 'For',
  [Stance.AGAINST]: 'Against',
  [Stance.NEUTRAL]: 'Neutral',
};

interface ReplyCardProps {
  reply: Comment;
  isMine: boolean;
  canParticipate: boolean;
  isDebateClosed: boolean;
  isStanceMismatchDismissed: boolean;
  onLike?: (commentId: string) => void;
  onSwitchStance?: (commentId: string, newStance: Stance) => void;
  onKeepStance?: (commentId: string) => void;
  onReport?: (reply: Comment) => void;
}

export const ReplyCard: React.FC<ReplyCardProps> = ({
  reply,
  isMine,
  canParticipate,
  isDebateClosed,
  isStanceMismatchDismissed,
  onLike,
  onSwitchStance,
  onKeepStance,
  onReport,
}) => {
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [elapsed, setElapsed] = useState(() =>
    Math.max(0, Math.floor((Date.now() - reply.timestamp) / 1000))
  );

  useEffect(() => {
    if (!reply.isLoadingAI) return;
    const tick = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - reply.timestamp) / 1000)));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [reply.isLoadingAI, reply.timestamp]);

  const detected = reply.aiAnalysis?.detectedStance;
  const showStanceMismatch =
    isMine &&
    !reply.isLoadingAI &&
    !!detected &&
    STANCE_VALUES.includes(detected as Stance) &&
    detected !== reply.stance &&
    !isStanceMismatchDismissed;

  const canLike = canParticipate && !isDebateClosed;
  const userSources = reply.userSources ?? [];

  return (
    <article
      className={`relative ml-0 rounded-12 border p-3.5 md:ml-9 ${
        isMine
          ? 'border-oxford/40 bg-gradient-to-b from-oxford/[0.08] to-cream'
          : 'border-rule bg-cream'
      }`}
    >
      <span
        aria-hidden
        className="absolute left-[-18px] top-6 hidden h-px w-[18px] bg-rule md:block"
      />

      {/* Head */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Avatar
          size={24}
          colorIndex={isMine ? 4 : colorIndexFromName(reply.author)}
          verified={!!reply.isUserVerified}
        >
          {initialsFor(reply.author)}
        </Avatar>
        <span className="inline-flex items-center gap-1 font-sans text-[12.5px] font-semibold text-ink">
          {reply.author}
          {reply.isUserVerified && (
            <IconCheck className="h-2.5 w-2.5 text-evergreen" />
          )}
        </span>
        {isMine && (
          <span className="rounded-4 bg-oxford/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-oxford">
            Your reply
          </span>
        )}
        {reply.userTitle && (
          <span className="font-sans text-[11px] font-medium text-oxford">
            {reply.userTitle}
            {reply.isUserVerified && ' · Verified'}
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-sans text-[9.5px] font-semibold uppercase tracking-[0.06em] ${
            STANCE_MINI_CLASS[reply.stance]
          }`}
        >
          <span aria-hidden className="h-1 w-1 rounded-full bg-current" />
          {STANCE_LABEL[reply.stance]}
        </span>
        {reply.isLoadingAI ? (
          <VerifyingPill variant="elapsed-time" elapsedSeconds={elapsed} />
        ) : reply.aiAnalysis ? (
          <>
            {reply.aiAnalysis.isDuplicate && <DuplicatePill />}
            <RatingPill
              rating={reply.aiAnalysis.rating}
              state={reasoningOpen ? 'tooltip-open' : 'default'}
              onClick={() => setReasoningOpen((v) => !v)}
            />
          </>
        ) : null}
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.04em] text-ink-3">
          {formatRelativeShort(reply.timestamp)}
        </span>
      </div>

      {/* Body */}
      <p className="m-0 font-serif text-[13.5px] leading-[1.55] text-ink-2">
        {reply.content}
        {userSources.slice(0, 2).map((src, i) => (
          <a
            key={`${src}-${i}`}
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1.5 inline-flex items-baseline gap-1 rounded-[3px] bg-oxford/10 px-1.5 py-px font-sans text-[10.5px] font-medium text-oxford no-underline align-baseline"
          >
            {urlDomain(src)}
            <IconExternal className="h-2.5 w-2.5" />
          </a>
        ))}
      </p>

      {/* Stance-mismatch notice */}
      {showStanceMismatch && onSwitchStance && onKeepStance && detected && (
        <div className="mt-3">
          <StanceMismatchNotice
            detectedStance={detected as Stance}
            postedStance={reply.stance}
            onSwitch={() => onSwitchStance(reply.id, detected as Stance)}
            onKeep={() => onKeepStance(reply.id)}
          />
        </div>
      )}

      {/* AI reasoning expanded */}
      {reasoningOpen && reply.aiAnalysis && (
        <div className="mt-3 rounded-r-8 border-l-[3px] border-oxford bg-cream-2 px-3.5 py-3">
          <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-oxford">
            <IconSparkles className="h-3 w-3" />
            AI reasoning · {reply.aiAnalysis.groundingSources.length} sources reviewed
          </div>
          <p className="m-0 font-serif text-[13px] italic leading-[1.55] text-ink-2">
            {reply.aiAnalysis.reasoning}
          </p>
          {reply.aiAnalysis.groundingSources.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {reply.aiAnalysis.groundingSources.map((src, i) => (
                <a
                  key={`${src.uri}-${i}`}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-oxford/10 px-2 py-0.5 font-sans text-[10.5px] font-medium text-oxford no-underline"
                >
                  {src.title || urlDomain(src.uri)}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Just-posted footer */}
      {reply.isLoadingAI && isMine && (
        <div className="mt-2.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-oxford">
          <IconSparkles className="h-3 w-3 animate-pulse-soft" />
          AI is reading sources · {elapsed}s elapsed
        </div>
      )}

      {/* Foot actions */}
      {!reply.isLoadingAI && (
        <div className="mt-2.5 flex flex-wrap items-center gap-3.5 font-mono text-[10px] uppercase tracking-[0.04em] text-ink-3">
          <button
            type="button"
            disabled={!canLike}
            onClick={() => canLike && onLike?.(reply.id)}
            className={`inline-flex items-center gap-1 transition-colors ${
              reply.likedByMe
                ? 'text-editorial-red'
                : canLike
                ? 'hover:text-ink'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <IconLike className={`h-3 w-3 ${reply.likedByMe ? 'fill-current' : ''}`} />
            {reply.likes ?? 0}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-ink"
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
          >
            <IconShare className="h-3 w-3" />
            Quote
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-ink"
          >
            <IconReply className="h-3 w-3" />
            Reply
          </button>
          {!isMine && onReport && (
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-editorial-red"
              onClick={() => onReport(reply)}
            >
              <IconFlag className="h-3 w-3" />
              Flag
            </button>
          )}
        </div>
      )}
    </article>
  );
};

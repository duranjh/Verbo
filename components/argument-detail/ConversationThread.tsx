import React, { useState } from 'react';
import { Comment, Stance, FactRating, AIAnalysis, Attachment } from '../../types';
import { verifyStatement } from '../../services/ai';
import { Avatar } from '../ui';
import { IconChevronDown, IconCheck, IconSparkles } from '../Icons';
import { ReplyCard } from './ReplyCard';
import { initialsFor } from './utils';

const generateId = () => Math.random().toString(36).slice(2, 11);

const RATING_FILTERS: { value: FactRating | 'DUPLICATE'; label: string }[] = [
  { value: FactRating.TRUE, label: 'True' },
  { value: FactRating.SOMEWHAT_TRUE, label: 'Somewhat true' },
  { value: FactRating.NEUTRAL, label: 'Unverifiable' },
  { value: FactRating.MISLEADING, label: 'Misleading' },
  { value: FactRating.FALSE, label: 'False' },
  { value: FactRating.UNRELATED, label: 'Unrelated' },
  { value: 'DUPLICATE', label: 'Duplicates' },
];

const STANCE_OPTIONS: { value: Stance; label: string }[] = [
  { value: Stance.FOR, label: 'For' },
  { value: Stance.NEUTRAL, label: 'Neutral' },
  { value: Stance.AGAINST, label: 'Against' },
];

interface ConversationThreadProps {
  parent: Comment;
  parentPossessive: string;
  topicTitle: string;
  canParticipate: boolean;
  isDebateClosed: boolean;
  areAiToolsEnabled: boolean;
  currentUserInitials: string;
  onReply: (parentId: string, reply: Comment) => void;
  onLikeReply: (replyId: string) => void;
  onSwitchReplyStance: (replyId: string, newStance: Stance) => void;
  onReport?: (reply: Comment) => void;
}

export const ConversationThread: React.FC<ConversationThreadProps> = ({
  parent,
  parentPossessive,
  topicTitle,
  canParticipate,
  isDebateClosed,
  areAiToolsEnabled: _areAiToolsEnabled,
  currentUserInitials,
  onReply,
  onLikeReply,
  onSwitchReplyStance,
  onReport,
}) => {
  const replies = parent.replies ?? [];
  const verifiedCount = replies.filter(
    (r) => r.aiAnalysis && !r.isLoadingAI
  ).length;

  const [stance, setStance] = useState<Stance>(Stance.NEUTRAL);
  const [text, setText] = useState('');
  const [filterOpen, setFilterOpen] = useState(replies.length === 0);
  const [activeFilters, setActiveFilters] = useState<Set<FactRating | 'DUPLICATE'>>(
    () =>
      new Set<FactRating | 'DUPLICATE'>([
        FactRating.TRUE,
        FactRating.SOMEWHAT_TRUE,
        FactRating.NEUTRAL,
        FactRating.MISLEADING,
        FactRating.FALSE,
        FactRating.UNRELATED,
        'DUPLICATE',
      ])
  );
  const [dismissedMismatch, setDismissedMismatch] = useState<Set<string>>(
    () => new Set()
  );

  const toggleFilter = (key: FactRating | 'DUPLICATE') => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filtered = replies.filter((r) => {
    if (r.isLoadingAI || !r.aiAnalysis) return true;
    if (r.aiAnalysis.isDuplicate) return activeFilters.has('DUPLICATE');
    return activeFilters.has(r.aiAnalysis.rating);
  });

  const handleKeepStance = (replyId: string) => {
    setDismissedMismatch((prev) => {
      const next = new Set(prev);
      next.add(replyId);
      return next;
    });
  };

  const handleSwitchStance = (replyId: string, newStance: Stance) => {
    onSwitchReplyStance(replyId, newStance);
    setDismissedMismatch((prev) => {
      const next = new Set(prev);
      next.add(replyId);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canParticipate || isDebateClosed) return;
    const body = text.trim();
    if (!body) return;

    const tempId = generateId();
    const attachments: Attachment[] = [];
    const optimistic: Comment = {
      id: tempId,
      topicId: parent.topicId,
      author: 'You',
      content: body,
      stance,
      timestamp: Date.now(),
      userSources: [],
      userAttachments: attachments,
      isLoadingAI: true,
      likes: 0,
      replies: [],
      isEdited: false,
      isAiGenerated: false,
    };

    // 1. Add immediately. Reset form synchronously — post button never spins.
    onReply(parent.id, optimistic);
    setText('');
    setStance(Stance.NEUTRAL);

    // 2. Fire background verification. Build a fresh object on resolve.
    const existingReplies = replies.map((r) => r.content);
    verifyStatement(body, topicTitle, existingReplies)
      .then((analysis: AIAnalysis) => {
        onReply(parent.id, {
          ...optimistic,
          isLoadingAI: false,
          aiAnalysis: analysis,
        });
      })
      .catch((err) => {
        console.error('verifyStatement failed', err);
        onReply(parent.id, {
          ...optimistic,
          isLoadingAI: false,
          aiAnalysis: {
            rating: FactRating.NEUTRAL,
            ratingLabel: 'Verification unavailable',
            reasoning: 'AI service is currently unavailable. Please try again later.',
            groundingSources: [],
            detectedStance: 'NEUTRAL',
            isDuplicate: false,
          },
        });
      });
  };

  const composerLocked = !canParticipate || isDebateClosed;

  return (
    <section className="mt-7 border-t border-rule pt-6">
      <header className="relative mb-4 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <h4 className="m-0 font-serif text-[17px] font-medium tracking-[-0.005em] text-ink">
            Conversation thread
          </h4>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'} · {verifiedCount} verified
          </span>
        </div>
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-8 border border-rule px-2.5 py-1.5 font-sans text-[12px] font-medium ${
            filterOpen ? 'bg-rule-soft text-ink' : 'bg-cream text-ink-2'
          }`}
        >
          Filter replies
          <IconChevronDown className="h-3 w-3" />
        </button>
        {filterOpen && (
          <div className="absolute right-0 top-9 z-20 w-56 rounded-12 border border-rule bg-cream p-1.5 shadow-lg">
            <div className="px-2.5 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3">
              Show ratings
            </div>
            {RATING_FILTERS.map((opt) => {
              const checked = activeFilters.has(opt.value);
              return (
                <button
                  type="button"
                  key={String(opt.value)}
                  onClick={() => toggleFilter(opt.value)}
                  className="flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left font-sans text-[12.5px] font-medium text-ink-2 hover:bg-rule-soft"
                >
                  <span
                    className={`flex h-3.5 w-3.5 flex-none items-center justify-center rounded-[3px] border ${
                      checked
                        ? 'border-ink bg-ink text-cream'
                        : 'border-ink-3 bg-cream'
                    }`}
                  >
                    {checked && <IconCheck className="h-2.5 w-2.5" />}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Inline reply composer */}
      {!composerLocked && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 flex gap-2.5 rounded-12 border border-rule bg-cream-2 p-3.5"
        >
          <Avatar size={32} colorIndex={4}>
            {currentUserInitials || 'YO'}
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <div className="inline-flex w-fit gap-0.5 rounded-full border border-rule bg-cream p-[3px]">
              {STANCE_OPTIONS.map((opt) => {
                const selected = opt.value === stance;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setStance(opt.value)}
                    className={`rounded-full px-2.5 py-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.04em] ${
                      selected
                        ? 'bg-oxford text-cream'
                        : 'text-ink-3 hover:text-ink'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder={`Reply to ${parentPossessive} argument. Verbo will fact-check it after you post — you don't have to wait.`}
              className="w-full resize-none rounded-8 border border-rule bg-cream px-3 py-2.5 font-serif text-[13.5px] leading-[1.5] text-ink outline-none focus:border-oxford focus:ring-1 focus:ring-oxford"
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-3">
                <IconSparkles className="mr-1 inline h-3 w-3 align-[-2px]" />
                Async fact-check on post
              </span>
              <button
                type="submit"
                disabled={!text.trim()}
                className="ml-auto rounded-full bg-ink px-3.5 py-1.5 font-sans text-[12px] font-semibold text-cream disabled:opacity-40"
              >
                Post reply
              </button>
            </div>
          </div>
        </form>
      )}
      {composerLocked && (
        <div className="mb-4 rounded-12 border border-dashed border-rule bg-cream-2/40 px-4 py-5 text-center font-serif italic text-ink-3">
          {isDebateClosed
            ? 'Debate is closed. No new replies allowed.'
            : 'You are in spectator mode and cannot reply.'}
        </div>
      )}

      {/* Reply list with left rule connector */}
      {filtered.length === 0 ? (
        <div className="rounded-12 border border-dashed border-rule bg-cream-2/40 px-5 py-8 text-center font-serif italic text-ink-3">
          {replies.length === 0
            ? 'No replies yet. Be the first.'
            : 'No replies match the current filters.'}
        </div>
      ) : (
        <div className="relative flex flex-col gap-3">
          <span
            aria-hidden
            className="absolute bottom-2 left-[18px] top-2 hidden w-px bg-rule md:block"
          />
          {filtered.map((reply) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              isMine={reply.author === 'You'}
              canParticipate={canParticipate}
              isDebateClosed={isDebateClosed}
              isStanceMismatchDismissed={dismissedMismatch.has(reply.id)}
              onLike={onLikeReply}
              onSwitchStance={handleSwitchStance}
              onKeepStance={handleKeepStance}
              onReport={onReport}
            />
          ))}
        </div>
      )}

      {replies.length > 0 && (
        <button
          type="button"
          className="mt-3.5 flex w-full flex-col items-center gap-1.5 rounded-8 border border-rule bg-transparent p-3 font-sans text-[12.5px] font-medium text-ink-2 hover:bg-rule-soft"
        >
          Load more replies
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-3">
            Showing {filtered.length} of {replies.length}{' '}
            {replies.length === 1 ? 'reply' : 'replies'}
          </span>
        </button>
      )}
    </section>
  );
};

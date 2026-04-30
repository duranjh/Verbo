import React, { useEffect } from 'react';
import { Comment, Stance } from '../types';
import { IconClose, IconLink, IconShare, IconMoreHorizontal } from './Icons';
import { ArgumentBody } from './argument-detail/ArgumentBody';
import { CounterArgumentList } from './argument-detail/CounterArgumentList';
import { ConversationThread } from './argument-detail/ConversationThread';
import {
  StrengthScoreCard,
  VerificationAuditCard,
  EngagementCard,
  AuditTrailCard,
} from './argument-detail/SidebarCards';
import { combineSources } from './argument-detail/utils';

interface ArgumentDetailProps {
  comment: Comment | null;
  topicComments: Comment[];
  topicTitle: string;
  topicTag?: string;
  currentUserInitials: string;
  onClose: () => void;
  onReply: (parentId: string, reply: Comment) => void;
  onLikeComment: (commentId: string) => void;
  onSelectComment: (comment: Comment) => void;
  canParticipate?: boolean;
  isDebateClosed?: boolean;
  areAiToolsEnabled?: boolean;
  onReport?: (comment: Comment) => void;
}

export const ArgumentDetail: React.FC<ArgumentDetailProps> = ({
  comment,
  topicComments,
  topicTitle,
  topicTag,
  currentUserInitials,
  onClose,
  onReply,
  onLikeComment,
  onSelectComment,
  canParticipate = true,
  isDebateClosed = false,
  areAiToolsEnabled = true,
  onReport,
}) => {
  // Modal chrome behavior: scroll-lock + escape close.
  useEffect(() => {
    if (!comment) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [comment, onClose]);

  if (!comment) return null;

  const sourcesCount = combineSources(comment).length;
  const argId = `ARG-${comment.id.slice(0, 4).toUpperCase()}`;
  const firstCrumb =
    topicTag ||
    (comment.topicId
      ? topicTitle.split(/\s+/).slice(0, 2).join(' ') || 'Debate'
      : 'Debate');

  // For replies: wire likes + stance-switch through the existing onReply, which
  // App.tsx's handleReply deduplicates by reply.id and propagates to selectedComment.
  const handleLikeReply = (replyId: string) => {
    const reply = (comment.replies ?? []).find((r) => r.id === replyId);
    if (!reply) return;
    const liked = !!reply.likedByMe;
    onReply(comment.id, {
      ...reply,
      likes: liked ? Math.max(0, (reply.likes ?? 0) - 1) : (reply.likes ?? 0) + 1,
      likedByMe: !liked,
    });
  };

  const handleSwitchReplyStance = (replyId: string, newStance: Stance) => {
    const reply = (comment.replies ?? []).find((r) => r.id === replyId);
    if (!reply || reply.stance === newStance) return;
    onReply(comment.id, { ...reply, stance: newStance });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Argument detail"
      className="animate-fade-in fixed inset-0 z-50 flex items-stretch justify-center bg-[rgba(15,23,42,0.55)] p-0 backdrop-blur-[2px] md:items-center md:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative mt-[60px] flex w-full flex-col overflow-hidden border border-rule bg-cream text-ink shadow-2xl md:mt-0 md:max-h-[1180px] md:w-[920px] md:max-w-[920px] md:rounded-16"
        style={{ borderRadius: '14px 14px 0 0' }}
      >
        {/* Decorative drag-handle on mobile */}
        <div className="flex justify-center py-2 md:hidden">
          <span aria-hidden className="h-1 w-9 rounded-full bg-rule" />
        </div>

        {/* Header — breadcrumb + actions */}
        <header className="flex items-center justify-between gap-3.5 border-b border-rule bg-cream px-4 py-3 md:px-7 md:pb-4 md:pt-5">
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 flex-1 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3"
          >
            <span className="hidden truncate text-ink-2 md:inline-block md:max-w-[160px]">
              {firstCrumb}
            </span>
            <span aria-hidden className="hidden text-ink-4 md:inline">›</span>
            <span className="truncate text-ink-2 md:max-w-[260px]">
              {topicTitle}
            </span>
            <span aria-hidden className="hidden text-ink-4 md:inline">›</span>
            <span className="hidden text-ink-4 md:inline">{argId}</span>
          </nav>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Permalink"
              className="inline-flex h-8 w-8 items-center justify-center rounded-8 text-ink-3 hover:bg-rule-soft hover:text-ink"
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
            >
              <IconLink className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Share"
              className="inline-flex h-8 w-8 items-center justify-center rounded-8 text-ink-3 hover:bg-rule-soft hover:text-ink"
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
            >
              <IconShare className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="More"
              className="inline-flex h-8 w-8 items-center justify-center rounded-8 text-ink-3 hover:bg-rule-soft hover:text-ink"
            >
              <IconMoreHorizontal className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-8 text-ink-3 hover:bg-rule-soft hover:text-ink"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Body grid */}
        <div className="grid flex-1 min-h-0 grid-cols-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex flex-col px-4 py-6 md:px-9 md:pb-8 md:pt-7">
            <ArgumentBody
              comment={comment}
              onLikeComment={onLikeComment}
              onReport={onReport}
              canParticipate={canParticipate}
              isDebateClosed={isDebateClosed}
            />

            <CounterArgumentList
              current={comment}
              topicComments={topicComments}
              onSelect={onSelectComment}
            />

            <ConversationThread
              parent={comment}
              parentPossessive={comment.author === 'You' ? 'your' : `${comment.author}'s`}
              topicTitle={topicTitle}
              canParticipate={canParticipate}
              isDebateClosed={isDebateClosed}
              areAiToolsEnabled={areAiToolsEnabled}
              currentUserInitials={currentUserInitials}
              onReply={onReply}
              onLikeReply={handleLikeReply}
              onSwitchReplyStance={handleSwitchReplyStance}
              onReport={onReport}
            />
          </div>

          <aside className="flex flex-col gap-4 border-t border-rule bg-cream-2 px-4 py-6 md:border-l md:border-t-0 md:px-6 md:pb-8 md:pt-6">
            <StrengthScoreCard comment={comment} sourcesCount={sourcesCount} />
            <VerificationAuditCard
              comment={comment}
              sourcesCount={sourcesCount}
            />
            <EngagementCard comment={comment} />
            <AuditTrailCard comment={comment} />
          </aside>
        </div>
      </div>
    </div>
  );
};

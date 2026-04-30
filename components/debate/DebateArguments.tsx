import React, { useState } from 'react';
import {
  Comment,
  Stance,
  FactRating,
  Topic,
  Attachment,
  AIAnalysis,
  ReportData,
  DebateType,
} from '../../types';
import {
  verifyStatement,
  enhanceArgument,
  suggestSupportingSources,
} from '../../services/gemini';
import { ArgumentCompose } from './ArgumentCompose';
import { ArgumentList, SortOption, ViewMode } from './ArgumentList';
import { ArgumentSidebar, MobileFilterTrigger } from './ArgumentSidebar';

const DEFAULT_RATINGS: FactRating[] = [
  FactRating.TRUE,
  FactRating.SOMEWHAT_TRUE,
  FactRating.NEUTRAL,
  FactRating.MISLEADING,
  FactRating.FALSE,
  FactRating.UNRELATED,
];

const generateId = () => Math.random().toString(36).slice(2, 11);

interface DebateArgumentsProps {
  topic: Topic;
  comments: Comment[];
  canParticipate: boolean;
  consensusCache?: { text: string; generatedAt: number };
  onCacheConsensus: (topicId: string, text: string) => void;
  onAddComment: (comment: Comment) => void;
  onLikeComment: (commentId: string) => void;
  onSelectComment: (comment: Comment) => void;
  onSwitchStance: (commentId: string, newStance: Stance) => void;
  onReport?: (target: ReportData) => void;
}

export const DebateArguments: React.FC<DebateArgumentsProps> = ({
  topic,
  comments,
  canParticipate,
  consensusCache,
  onCacheConsensus,
  onAddComment,
  onLikeComment,
  onSelectComment,
  onSwitchStance,
  onReport,
}) => {
  const [enabledRatings, setEnabledRatings] = useState<Set<FactRating>>(
    () => new Set(DEFAULT_RATINGS)
  );
  const [hideDuplicates, setHideDuplicates] = useState(false);
  const [hideUnrelated, setHideUnrelated] = useState(false);
  const [sort, setSort] = useState<SortOption>('RECENT');
  const [view, setView] = useState<ViewMode>('TIMELINE');
  const [dismissedStanceMismatch, setDismissedStanceMismatch] = useState<Set<string>>(
    () => new Set()
  );
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const isDebateClosed = !!(
    topic.type === DebateType.TIMED &&
    topic.closesAt &&
    Date.now() > topic.closesAt
  );
  const aiToolsEnabled = topic.areAiToolsEnabled ?? true;

  const toggleRating = (r: FactRating) => {
    setEnabledRatings((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });
  };

  const handlePost = (input: {
    text: string;
    stance: Stance;
    sources: string[];
    usedAi: boolean;
  }) => {
    const tempId = generateId();
    const attachments: Attachment[] = [];
    const newComment: Comment = {
      id: tempId,
      topicId: topic.id,
      author: 'You',
      content: input.text,
      stance: input.stance,
      timestamp: Date.now(),
      userSources: input.sources,
      userAttachments: attachments,
      isLoadingAI: true,
      likes: 0,
      replies: [],
      isEdited: false,
      isAiGenerated: input.usedAi,
    };

    // 1. Add immediately, optimistically
    onAddComment(newComment);

    // 2. Fire background verification
    const existingArguments = comments.map((c) => c.content);
    verifyStatement(input.text, topic.title, existingArguments)
      .then((analysis: AIAnalysis) => {
        onAddComment({
          ...newComment,
          isLoadingAI: false,
          aiAnalysis: analysis,
        });
      })
      .catch((err) => {
        console.error('verifyStatement failed', err);
        onAddComment({
          ...newComment,
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

  const handleKeepStance = (commentId: string) => {
    setDismissedStanceMismatch((prev) => {
      const next = new Set(prev);
      next.add(commentId);
      return next;
    });
  };

  const handleSwitchStance = (commentId: string, newStance: Stance) => {
    onSwitchStance(commentId, newStance);
    setDismissedStanceMismatch((prev) => {
      const next = new Set(prev);
      next.add(commentId);
      return next;
    });
  };

  const handleReport = onReport
    ? (c: Comment) =>
        onReport({
          targetId: c.id,
          targetType: 'ARGUMENT',
          targetContent: c.content,
        })
    : undefined;

  return (
    <div className="grid grid-cols-1 gap-6 px-4 pb-12 md:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-4">
        <MobileFilterTrigger
          enabledCount={enabledRatings.size}
          onOpen={() => setMobileSheetOpen(true)}
        />
        <ArgumentCompose
          topicTitle={topic.title}
          topicAreAiToolsEnabled={aiToolsEnabled}
          isDebateClosed={isDebateClosed}
          canParticipate={canParticipate}
          onPost={handlePost}
          onEnhance={(text, stance) => enhanceArgument(text, topic.title, stance)}
          onFindSources={(text, stance) =>
            suggestSupportingSources(text, topic.title, stance)
          }
        />
        <ArgumentList
          comments={comments}
          enabledRatings={enabledRatings}
          hideDuplicates={hideDuplicates}
          hideUnrelated={hideUnrelated}
          sort={sort}
          view={view}
          isDebateClosed={isDebateClosed}
          canParticipate={canParticipate}
          onSelect={onSelectComment}
          onLike={onLikeComment}
          onReport={handleReport}
          onSwitchStance={handleSwitchStance}
          onKeepStance={handleKeepStance}
          dismissedStanceMismatch={dismissedStanceMismatch}
        />
      </div>
      <ArgumentSidebar
        topic={topic}
        comments={comments}
        consensusCache={consensusCache}
        onCacheConsensus={onCacheConsensus}
        enabledRatings={enabledRatings}
        toggleRating={toggleRating}
        hideDuplicates={hideDuplicates}
        setHideDuplicates={setHideDuplicates}
        hideUnrelated={hideUnrelated}
        setHideUnrelated={setHideUnrelated}
        sort={sort}
        setSort={setSort}
        view={view}
        setView={setView}
        mobileSheetOpen={mobileSheetOpen}
        onCloseMobileSheet={() => setMobileSheetOpen(false)}
      />
    </div>
  );
};

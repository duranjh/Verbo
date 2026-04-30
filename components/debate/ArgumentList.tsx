import React from 'react';
import { Comment, Stance, FactRating } from '../../types';
import { ArgumentCard } from './ArgumentCard';

export type SortOption = 'RECENT' | 'MOST_RATED';
export type ViewMode = 'TIMELINE' | 'COLUMNS';

interface ArgumentListProps {
  comments: Comment[];
  enabledRatings: Set<FactRating>;
  hideDuplicates: boolean;
  hideUnrelated: boolean;
  sort: SortOption;
  view: ViewMode;
  isDebateClosed: boolean;
  canParticipate: boolean;
  onSelect?: (comment: Comment) => void;
  onLike?: (commentId: string) => void;
  onReport?: (comment: Comment) => void;
  onSwitchStance?: (commentId: string, newStance: Stance) => void;
  onKeepStance?: (commentId: string) => void;
  dismissedStanceMismatch: Set<string>;
}

const STANCE_RANK: Record<Stance, number> = {
  [Stance.FOR]: 0,
  [Stance.NEUTRAL]: 1,
  [Stance.AGAINST]: 2,
};

export const ArgumentList: React.FC<ArgumentListProps> = ({
  comments,
  enabledRatings,
  hideDuplicates,
  hideUnrelated,
  sort,
  view,
  isDebateClosed,
  canParticipate,
  onSelect,
  onLike,
  onReport,
  onSwitchStance,
  onKeepStance,
  dismissedStanceMismatch,
}) => {
  const filtered = comments.filter((c) => {
    // Always show verifying comments
    if (c.isLoadingAI) return true;
    if (!c.aiAnalysis) return true;
    if (hideDuplicates && c.aiAnalysis.isDuplicate) return false;
    if (hideUnrelated && c.aiAnalysis.rating === FactRating.UNRELATED) return false;
    return enabledRatings.has(c.aiAnalysis.rating);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'RECENT') return b.timestamp - a.timestamp;
    // Most rated: verifying comments to the top, then by rating desc, likes, timestamp
    const aRating = a.isLoadingAI || !a.aiAnalysis ? 999 : a.aiAnalysis.rating;
    const bRating = b.isLoadingAI || !b.aiAnalysis ? 999 : b.aiAnalysis.rating;
    if (aRating !== bRating) return bRating - aRating;
    const likeDiff = (b.likes ?? 0) - (a.likes ?? 0);
    if (likeDiff !== 0) return likeDiff;
    return b.timestamp - a.timestamp;
  });

  const renderCard = (c: Comment) => (
    <ArgumentCard
      key={c.id}
      comment={c}
      isMine={c.author === 'You'}
      isDebateClosed={isDebateClosed}
      canParticipate={canParticipate}
      onSelect={onSelect}
      onLike={onLike}
      onReport={onReport}
      onSwitchStance={onSwitchStance}
      onKeepStance={onKeepStance}
      isStanceMismatchDismissed={dismissedStanceMismatch.has(c.id)}
    />
  );

  if (sorted.length === 0) {
    return (
      <div className="rounded-12 border border-dashed border-rule bg-cream-2/40 px-6 py-12 text-center font-serif italic text-ink-3">
        No arguments match the current filters.
      </div>
    );
  }

  if (view === 'TIMELINE') {
    return <div className="flex flex-col gap-3">{sorted.map(renderCard)}</div>;
  }

  // Columns: 3 stance columns
  const byStance: Record<Stance, Comment[]> = {
    [Stance.FOR]: [],
    [Stance.NEUTRAL]: [],
    [Stance.AGAINST]: [],
  };
  for (const c of sorted) byStance[c.stance].push(c);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {([Stance.FOR, Stance.NEUTRAL, Stance.AGAINST] as const).map((stance) => (
        <div key={stance} className="flex flex-col gap-3">
          {byStance[stance].length === 0 ? (
            <div className="rounded-12 border border-dashed border-rule bg-cream-2/40 px-4 py-8 text-center font-sans text-[12px] italic text-ink-3">
              No arguments
            </div>
          ) : (
            byStance[stance].map(renderCard)
          )}
        </div>
      ))}
    </div>
  );
};

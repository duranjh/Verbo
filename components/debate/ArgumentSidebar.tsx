import React, { useState } from 'react';
import { Comment, FactRating, Topic } from '../../types';
import { RatingPill, SegmentedToggle, Checkbox } from '../ui';
import { AIConsensusCard } from './AIConsensusCard';
import type { SortOption, ViewMode } from './ArgumentList';
import { IconFilter, IconClose } from '../Icons';

const RATING_ORDER: FactRating[] = [
  FactRating.TRUE,
  FactRating.SOMEWHAT_TRUE,
  FactRating.NEUTRAL,
  FactRating.MISLEADING,
  FactRating.FALSE,
  FactRating.UNRELATED,
];

interface ArgumentSidebarProps {
  topic: Topic;
  comments: Comment[];
  consensusCache?: { text: string; generatedAt: number };
  onCacheConsensus: (topicId: string, text: string) => void;
  enabledRatings: Set<FactRating>;
  toggleRating: (r: FactRating) => void;
  hideDuplicates: boolean;
  setHideDuplicates: (v: boolean) => void;
  hideUnrelated: boolean;
  setHideUnrelated: (v: boolean) => void;
  sort: SortOption;
  setSort: (v: SortOption) => void;
  view: ViewMode;
  setView: (v: ViewMode) => void;
}

export const MobileFilterTrigger: React.FC<{
  enabledCount: number;
  onOpen: () => void;
}> = ({ enabledCount, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    className="sticky top-2 z-10 flex w-full items-center justify-between gap-2 rounded-full border border-rule bg-cream px-3.5 py-2 font-sans text-[12px] font-semibold text-ink shadow-sm lg:hidden"
  >
    <span className="inline-flex items-center gap-1.5">
      <IconFilter className="h-3.5 w-3.5" />
      Filters &amp; AI Consensus
    </span>
    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
      {enabledCount}/6 ratings
    </span>
  </button>
);

export const ArgumentSidebar: React.FC<
  ArgumentSidebarProps & { mobileSheetOpen: boolean; onCloseMobileSheet: () => void }
> = (props) => {
  const { mobileSheetOpen, onCloseMobileSheet, ...body } = props;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-6 hidden flex-col gap-3 self-start lg:flex">
        <SidebarBody {...body} />
      </aside>

      {/* Mobile sheet */}
      {mobileSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col lg:hidden">
          <div
            className="flex-1 bg-ink/40 backdrop-blur-sm"
            onClick={onCloseMobileSheet}
          />
          <div className="animate-fade-in flex max-h-[85vh] flex-col gap-3 overflow-y-auto rounded-t-16 border-t border-rule bg-cream px-4 py-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-[16px] font-medium text-ink">Filters &amp; AI Consensus</h3>
              <button
                type="button"
                onClick={onCloseMobileSheet}
                className="rounded-full p-2 text-ink-3 hover:bg-cream-2 hover:text-ink"
                aria-label="Close"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>
            <SidebarBody {...body} />
          </div>
        </div>
      )}
    </>
  );
};

const SidebarBody: React.FC<ArgumentSidebarProps> = ({
  topic,
  comments,
  consensusCache,
  onCacheConsensus,
  enabledRatings,
  toggleRating,
  hideDuplicates,
  setHideDuplicates,
  hideUnrelated,
  setHideUnrelated,
  sort,
  setSort,
  view,
  setView,
}) => {
  const ratingCount = (r: FactRating) =>
    comments.filter((c) => c.aiAnalysis?.rating === r).length;
  const duplicatesCount = comments.filter((c) => c.aiAnalysis?.isDuplicate).length;
  const unrelatedCount = comments.filter(
    (c) => c.aiAnalysis?.rating === FactRating.UNRELATED
  ).length;

  return (
    <>
      <AIConsensusCard topic={topic} comments={comments} cached={consensusCache} onCache={onCacheConsensus} />

      {/* Filter card */}
      <div className="rounded-12 border border-rule bg-cream px-5 py-[18px]">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-serif text-[14px] font-medium text-ink">Filter by rating</h4>
          <span className="rounded-full bg-rule-soft px-2 py-0.5 font-mono text-[10px] text-ink-3">
            {enabledRatings.size} active
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {RATING_ORDER.map((r) => (
            <label
              key={r}
              className="flex cursor-pointer items-center gap-2 rounded-[6px] py-1 font-sans text-[12.5px] text-ink-2 hover:bg-cream-2/60"
            >
              <Checkbox checked={enabledRatings.has(r)} onChange={() => toggleRating(r)} />
              <RatingPill rating={r} />
              <span className="ml-auto font-mono text-[10px] text-ink-3">{ratingCount(r)}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 border-t border-rule pt-3">
          <Checkbox
            label={
              <span className="flex w-full items-center gap-1 font-sans text-[12.5px] uppercase tracking-[0.04em] text-ink-2">
                Hide duplicates
                <span className="ml-auto font-mono text-[10px] normal-case tracking-normal text-ink-3">
                  {duplicatesCount}
                </span>
              </span>
            }
            checked={hideDuplicates}
            onChange={(e) => setHideDuplicates((e.target as HTMLInputElement).checked)}
            className="w-full"
          />
          <div className="mt-1.5">
            <Checkbox
              label={
                <span className="flex w-full items-center gap-1 font-sans text-[12.5px] uppercase tracking-[0.04em] text-ink-2">
                  Hide unrelated
                  <span className="ml-auto font-mono text-[10px] normal-case tracking-normal text-ink-3">
                    {unrelatedCount}
                  </span>
                </span>
              }
              checked={hideUnrelated}
              onChange={(e) => setHideUnrelated((e.target as HTMLInputElement).checked)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Sort card */}
      <div className="rounded-12 border border-rule bg-cream px-5 py-[18px]">
        <h4 className="mb-3 font-serif text-[14px] font-medium text-ink">Sort</h4>
        <SegmentedToggle<SortOption>
          fullWidth
          options={[
            { value: 'RECENT', label: 'Recent' },
            { value: 'MOST_RATED', label: 'Most rated' },
          ]}
          value={sort}
          onChange={setSort}
        />
      </div>

      {/* View card */}
      <div className="rounded-12 border border-rule bg-cream px-5 py-[18px]">
        <h4 className="mb-3 font-serif text-[14px] font-medium text-ink">View</h4>
        <SegmentedToggle<ViewMode>
          fullWidth
          options={[
            { value: 'TIMELINE', label: 'Timeline' },
            { value: 'COLUMNS', label: 'Columns' },
          ]}
          value={view}
          onChange={setView}
        />
      </div>
    </>
  );
};

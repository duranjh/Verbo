import React, { useMemo, useState } from 'react';
import { AggregatedSource, Comment, ResearchSynthesis, SourceCategory, Topic, TopicResearchData } from '../../types';
import { aggregateSources } from '../../lib/aggregateSources';
import {
  CATEGORY_DISPLAY_ORDER,
  SOURCE_CATEGORY_LABEL,
  SOURCE_CATEGORY_LABEL_SHORT,
} from '../../lib/sourceTaxonomy';
import { Button } from '../ui/Button';
import { IconBook, IconPlus, IconSparkles } from '../Icons';
import { ResearchSynthesisCard } from './ResearchSynthesisCard';
import { ResearchSidebar } from './ResearchSidebar';
import { SourceResearchCard } from './SourceResearchCard';

interface ResearchTabProps {
  topic: Topic;
  comments: Comment[];
  researchData: TopicResearchData | null;
  isLoadingResearch: boolean;
  isLoadingSynthesis: boolean;
  isLoadingMoreResearch: boolean;
  synthesisCache?: { synthesis: ResearchSynthesis; generatedAt: number };
  readingListUris: string[];
  onToggleReadingList: (uri: string) => void;
  onLoadMoreResearch: () => void;
  onGenerateAll: () => void;
  onAddSourceStub: (uri: string) => void;
}

type Filter = SourceCategory | 'ALL';
type Sort = 'most-cited' | 'most-recent';

const SortLabel: Record<Sort, string> = {
  'most-cited': 'Most cited',
  'most-recent': 'Most recent',
};

const FilterChip: React.FC<{
  selected: boolean;
  onClick: () => void;
  count?: number;
  children: React.ReactNode;
}> = ({ selected, onClick, count, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-sans text-[11.5px] font-medium transition-colors ${
      selected
        ? 'border-ink bg-ink text-cream'
        : 'border-rule bg-cream-2 text-ink-2 hover:border-ink-4'
    }`}
  >
    {children}
    {typeof count === 'number' && (
      <span className={selected ? 'opacity-70' : 'opacity-60'}>{count}</span>
    )}
  </button>
);

const SectionHeader: React.FC<{ title: string; count: number; caption: string }> = ({
  title,
  count,
  caption,
}) => (
  <div className="flex flex-wrap items-baseline justify-between gap-2">
    <h3 className="m-0 inline-flex items-center gap-2 font-serif text-[19px] font-medium text-ink">
      {title}
      <span className="rounded-full bg-rule-soft px-2 py-0.5 font-sans text-[11px] font-semibold text-ink-3">
        {count}
      </span>
    </h3>
    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">{caption}</span>
  </div>
);

export const ResearchTab: React.FC<ResearchTabProps> = ({
  topic,
  comments,
  researchData,
  isLoadingResearch,
  isLoadingSynthesis,
  isLoadingMoreResearch,
  synthesisCache,
  readingListUris,
  onToggleReadingList,
  onLoadMoreResearch,
  onGenerateAll,
  onAddSourceStub,
}) => {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [sort, setSort] = useState<Sort>('most-cited');
  const [addInput, setAddInput] = useState('');

  void topic; // currently used only via parent; kept in props for future surfaces

  const aggregated = useMemo(() => aggregateSources(comments, researchData), [comments, researchData]);

  const counts = useMemo(() => {
    const c: Record<SourceCategory, number> = {
      NEWS: 0,
      ACADEMIC: 0,
      GOVERNMENT: 0,
      THINK_TANK: 0,
      OP_ED: 0,
    };
    for (const s of aggregated) c[s.category] += 1;
    return c;
  }, [aggregated]);

  const filtered = useMemo(() => {
    let list = aggregated;
    if (filter !== 'ALL') list = list.filter((s) => s.category === filter);
    if (sort === 'most-cited') {
      list = [...list].sort((a, b) => {
        if (b.citedByCount !== a.citedByCount) return b.citedByCount - a.citedByCount;
        return (a.firstCitedAt ?? Number.POSITIVE_INFINITY) - (b.firstCitedAt ?? Number.POSITIVE_INFINITY);
      });
    } else {
      list = [...list].sort((a, b) => (b.firstCitedAt ?? 0) - (a.firstCitedAt ?? 0));
    }
    return list;
  }, [aggregated, filter, sort]);

  const cited = useMemo(() => filtered.filter((s) => s.isFromCitation), [filtered]);
  const background = useMemo(
    () => filtered.filter((s) => !s.isFromCitation && s.isFromAI),
    [filtered]
  );

  const readingListSet = useMemo(() => new Set(readingListUris), [readingListUris]);
  const readingListSources = useMemo(() => {
    return aggregated.filter((s) => readingListSet.has(s.uri));
  }, [aggregated, readingListSet]);

  const handleAdd = () => {
    const value = addInput.trim();
    if (!value) return;
    onAddSourceStub(value);
    setAddInput('');
  };

  // Empty state — no comments with sources, no research generated yet, not loading.
  const isEmpty = aggregated.length === 0 && !isLoadingResearch && !isLoadingSynthesis;

  if (isEmpty) {
    return (
      <div className="px-4 py-12 md:px-8">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-12 border border-rule bg-cream px-6 py-12 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-oxford/10 text-oxford">
            <IconBook className="h-6 w-6" />
          </span>
          <h3 className="m-0 font-serif text-[20px] font-medium text-ink">
            Research not generated yet
          </h3>
          <p className="m-0 font-sans text-[13px] leading-[1.55] text-ink-2">
            Pull current sources covering every side of this debate. Verbo will fetch articles, score
            credibility, and synthesize where the evidence agrees and disagrees.
          </p>
          <Button onClick={onGenerateAll} variant="primary" size="md">
            Generate research
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 px-4 py-6 md:grid-cols-[minmax(0,1fr)_320px] md:px-8 md:pb-12">
      {/* MAIN COLUMN */}
      <div className="flex min-w-0 flex-col gap-4">
        <ResearchSynthesisCard
          synthesis={synthesisCache?.synthesis}
          isLoading={isLoadingSynthesis}
          totalSources={aggregated.length}
          generatedAt={synthesisCache?.generatedAt}
        />

        {/* Add a source compose bar */}
        <div className="flex items-center gap-3 rounded-12 border border-rule bg-cream px-4 py-3.5 md:px-[18px]">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-none text-ink-3"
            aria-hidden
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <input
            type="url"
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
            placeholder="Add a source — paste any URL. Verbo extracts metadata, scores credibility, and pulls excerpts."
            className="min-w-0 flex-1 bg-transparent font-sans text-[13px] text-ink outline-none placeholder:text-ink-3 md:text-[14px]"
          />
          <span className="hidden flex-none items-center rounded-[4px] bg-oxford/10 px-2 py-0.5 font-sans text-[9.5px] font-semibold uppercase tracking-[0.06em] text-oxford md:inline-flex">
            ✦ AI metadata
          </span>
          <Button onClick={handleAdd} variant="primary" size="sm">
            Add
          </Button>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            selected={filter === 'ALL'}
            onClick={() => setFilter('ALL')}
            count={aggregated.length}
          >
            All
          </FilterChip>
          {CATEGORY_DISPLAY_ORDER.map((cat) => (
            <React.Fragment key={cat}>
              <FilterChip
                selected={filter === cat}
                onClick={() => setFilter(cat)}
                count={counts[cat]}
              >
                <span className="hidden sm:inline">{SOURCE_CATEGORY_LABEL[cat]}</span>
                <span className="inline sm:hidden">{SOURCE_CATEGORY_LABEL_SHORT[cat]}</span>
              </FilterChip>
            </React.Fragment>
          ))}
          <span className="ml-auto" />
          <button
            type="button"
            onClick={() => setSort((s) => (s === 'most-cited' ? 'most-recent' : 'most-cited'))}
            className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3 transition-colors hover:text-ink-2"
          >
            Sort: {SortLabel[sort]}
          </button>
        </div>

        {/* CITED */}
        <SectionHeader
          title="Cited in arguments"
          count={cited.length}
          caption="Sources referenced by 1+ argument"
        />
        {cited.length === 0 ? (
          <div className="rounded-12 border border-dashed border-rule px-4 py-6 text-center font-sans text-[12.5px] italic text-ink-3">
            No arguments have cited sources matching this filter yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {cited.map((s, i) => (
              <SourceResearchCard
                key={s.uri}
                source={s}
                featured={i === 0}
                saved={readingListSet.has(s.uri)}
                onToggleSave={onToggleReadingList}
              />
            ))}
          </div>
        )}

        {/* BACKGROUND */}
        <SectionHeader
          title="Background reading"
          count={background.length}
          caption="Added but not yet cited"
        />
        {isLoadingResearch && background.length === 0 ? (
          <div className="flex items-center justify-center gap-2 rounded-12 border border-dashed border-rule px-4 py-8 font-sans text-[12.5px] italic text-ink-3">
            <IconSparkles className="h-3.5 w-3.5 animate-spin text-oxford" />
            Pulling background reading…
          </div>
        ) : background.length === 0 ? (
          <div className="rounded-12 border border-dashed border-rule px-4 py-6 text-center font-sans text-[12.5px] italic text-ink-3">
            No background-reading sources for this filter.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {background.map((s) => (
              <SourceResearchCard
                key={s.uri}
                source={s}
                saved={readingListSet.has(s.uri)}
                onToggleSave={onToggleReadingList}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMoreResearch}
            disabled={isLoadingMoreResearch}
            className="inline-flex items-center gap-2 rounded-full border border-rule bg-cream px-5 py-2.5 font-sans text-[12.5px] font-semibold text-ink-2 transition-all hover:border-oxford/30 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoadingMoreResearch ? (
              <>
                <IconSparkles className="h-3.5 w-3.5 animate-spin" />
                Finding more sources…
              </>
            ) : (
              <>
                <IconPlus className="h-3.5 w-3.5" />
                Find more sources
              </>
            )}
          </button>
        </div>
      </div>

      {/* SIDEBAR */}
      <ResearchSidebar
        aggregated={aggregated}
        readingList={readingListSources}
        onRemoveFromReadingList={onToggleReadingList}
      />
    </div>
  );
};

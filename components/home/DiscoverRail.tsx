import React from 'react';
import { Topic } from '../../types';

interface DiscoverRailProps {
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void;
}

const truncate = (text: string, max: number): string =>
  text.length <= max ? text : `${text.slice(0, max - 1)}…`;

const Chip: React.FC<{
  topic: Topic;
  onSelect: (topic: Topic) => void;
  titleClassName?: string;
  titleMax?: number;
  className?: string;
}> = ({ topic, onSelect, titleClassName = 'max-w-[210px] text-[13px]', titleMax, className = '' }) => (
  <button
    type="button"
    onClick={() => onSelect(topic)}
    className={`inline-flex flex-none cursor-pointer items-center gap-2.5 rounded-full border border-rule bg-cream-2 px-3.5 py-2 transition-colors hover:border-oxford/40 ${className}`}
  >
    <span className={`truncate font-serif font-medium leading-[1.3] text-ink ${titleClassName}`}>
      {titleMax ? truncate(topic.title, titleMax) : topic.title}
    </span>
    <span className="rounded-full border border-rule bg-cream px-[7px] py-[2px] font-mono text-[10px] text-ink-3">
      {topic.trendingScore ?? 0}
    </span>
  </button>
);

export const DiscoverRail: React.FC<DiscoverRailProps> = ({ topics, onSelectTopic }) => {
  const trending = [...topics]
    .sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0))
    .slice(0, 4);
  const trendingMobile = trending.slice(0, 3);

  if (trending.length === 0) return null;

  return (
    <>
      {/* Desktop / tablet */}
      <div className="hidden gap-3.5 overflow-hidden px-6 pt-5 sm:flex lg:px-8">
        <span className="flex flex-none items-center self-center border-r border-rule pr-3.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          Discover
        </span>
        {trending.map((topic) => (
          <Chip key={topic.id} topic={topic} onSelect={onSelectTopic} />
        ))}
      </div>
      {/* Mobile */}
      <div className="flex gap-2.5 overflow-x-auto px-4 pt-3.5 sm:hidden">
        {trendingMobile.map((topic) => (
          <Chip
            key={topic.id}
            topic={topic}
            onSelect={onSelectTopic}
            titleClassName="max-w-[160px] text-[12px]"
            titleMax={28}
            className="px-2.5 py-1.5"
          />
        ))}
      </div>
    </>
  );
};

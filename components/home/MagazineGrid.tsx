import React from 'react';
import { Topic } from '../../types';
import { TopicCard } from './TopicCard';

interface MagazineGridProps {
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void;
  featured?: Topic;
}

const Eyebrow: React.FC = () => (
  <div className="col-span-1 mb-1 flex items-baseline justify-between border-b border-rule pb-2.5 lg:col-span-12">
    <h2 className="m-0 font-serif text-[22px] font-medium tracking-[-0.012em] text-ink">Today on Verbo</h2>
    <div className="hidden items-center gap-3.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-3 sm:flex">
      <button type="button" className="font-semibold text-ink">Trending</button>
      <button type="button" className="hover:text-ink">Recent</button>
      <button type="button" className="hover:text-ink">Following</button>
      <span className="text-ink-4">·</span>
      <button type="button" className="hover:text-ink">All categories ▾</button>
    </div>
  </div>
);

export const MagazineGrid: React.FC<MagazineGridProps> = ({ topics, onSelectTopic, featured }) => {
  if (!featured) {
    return (
      <div className="grid grid-cols-1 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-12 lg:px-8 lg:pb-8 lg:pt-6">
        {topics.map((topic) => (
          <TopicCard key={topic.id} topic={topic} variant="standard" onSelect={onSelectTopic} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 px-4 pb-24 pt-5 sm:px-6 lg:grid-cols-12 lg:px-8 lg:pb-8 lg:pt-6">
      <Eyebrow />
      <TopicCard topic={featured} variant="lead" onSelect={onSelectTopic} />
      {topics.map((topic) => (
        <TopicCard key={topic.id} topic={topic} variant="standard" onSelect={onSelectTopic} />
      ))}
    </div>
  );
};

import React from 'react';
import { Topic, DebateType } from '../../types';
import { Avatar, MetaPill } from '../ui';

interface TopicCardProps {
  topic: Topic;
  variant: 'lead' | 'standard';
  onSelect: (topic: Topic) => void;
}

const formatShortDate = (timestamp: number): string =>
  new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const formatLongDate = (timestamp: number): string =>
  new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatTimedSuffix = (closesAt: number): string => {
  const ms = closesAt - Date.now();
  if (ms <= 0) return 'closed';
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `closes in ${days}d ${hours}h`;
  return `closes in ${hours}h`;
};

const verifiedArgumentCount = (topic: Topic): number =>
  Math.round((topic.stats.for + topic.stats.against) * 0.3);

const initialsFor = (author: string): string => {
  const cleaned = author.replace(/[^a-zA-Z]/g, '').toUpperCase();
  return cleaned.slice(0, 2) || '??';
};

const VerifiedCountIcon: React.FC = () => (
  <svg
    aria-hidden
    width="9"
    height="9"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const LeadSparkline: React.FC = () => (
  <svg
    width="80%"
    height="100%"
    viewBox="0 0 600 160"
    preserveAspectRatio="xMidYMid meet"
    className="text-ink-3 opacity-50"
    aria-hidden
  >
    <g stroke="currentColor" strokeWidth="1.2" fill="none">
      <path d="M30 130 Q 100 60, 170 100 T 310 70 T 450 110 T 580 60" />
      <path d="M30 140 Q 100 90, 170 120 T 310 100 T 450 130 T 580 90" opacity="0.5" />
      <line x1="30" y1="150" x2="580" y2="150" />
      <g fontFamily="JetBrains Mono" fontSize="9" fill="currentColor" stroke="none">
        <text x="30" y="20">FOR · 847 verified arguments</text>
        <text x="380" y="20">AGAINST · 412</text>
      </g>
    </g>
  </svg>
);

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex rounded-4 bg-rule-soft px-2 py-[3px] font-sans text-[11px] font-medium text-ink-3">
    {children}
  </span>
);

const renderTags = (tags: string[] | undefined, max?: number): React.ReactNode => {
  if (!tags || tags.length === 0) return null;
  const shown = max ? tags.slice(0, max) : tags;
  const overflow = max && tags.length > max ? tags.length - max : 0;
  return (
    <>
      {shown.map((tag) => (
        <Tag key={tag}>{tag}</Tag>
      ))}
      {overflow > 0 && (
        <span className="self-center font-sans text-[11px] text-ink-4">+{overflow}</span>
      )}
    </>
  );
};

const isClosed = (topic: Topic): boolean =>
  topic.type === DebateType.TIMED && !!topic.closesAt && Date.now() > topic.closesAt;

const LeadCard: React.FC<{ topic: Topic; onSelect: (topic: Topic) => void }> = ({ topic, onSelect }) => {
  const closed = isClosed(topic);
  const timedLabel = topic.type === DebateType.TIMED && topic.closesAt && !closed
    ? `Timed · ${formatTimedSuffix(topic.closesAt)}`
    : null;

  return (
    <article
      onClick={() => onSelect(topic)}
      className="group relative col-span-1 flex cursor-pointer flex-col gap-[18px] rounded-[14px] border border-oxford/20 bg-cream p-6 transition-all duration-150 hover:-translate-y-0.5 hover:border-oxford hover:shadow-[0_12px_28px_rgba(30,58,138,0.14)] lg:col-span-6 lg:row-span-2 lg:border-rule lg:p-8"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 rounded-t-[14px] bg-oxford opacity-0 transition-opacity group-hover:opacity-100"
      />

      <span className="inline-flex items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-editorial-red">
        <span aria-hidden className="inline-block h-2 w-2 flex-none rounded-full bg-current animate-pulse-soft" />
        Trending now
      </span>

      <div className="flex flex-wrap gap-2">
        <MetaPill>{topic.type === DebateType.TIMED ? 'Timed-Debate' : 'Debate'}</MetaPill>
        {timedLabel && <MetaPill kind="timed">{timedLabel}</MetaPill>}
        {closed && <MetaPill kind="closed">Closed</MetaPill>}
        {topic.isAgeRestricted && <MetaPill kind="warn">18+</MetaPill>}
        <MetaPill>{formatLongDate(topic.createdAt)}</MetaPill>
      </div>

      <h3 className="m-0 font-serif text-[28px] font-medium leading-[1.08] tracking-[-0.018em] text-ink lg:text-[38px]">
        {topic.title}
      </h3>

      <p className="m-0 max-w-[54ch] font-sans text-[15px] leading-[1.6] text-ink-2">
        {topic.description}
      </p>

      {topic.tags && topic.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">{renderTags(topic.tags)}</div>
      )}

      <div className="flex h-[160px] items-center justify-center overflow-hidden rounded-[10px] border border-rule bg-cream-2">
        <LeadSparkline />
      </div>

      <div className="mt-auto flex flex-col gap-3 border-t border-rule pt-[18px] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 font-sans text-[12.5px] font-medium text-ink-3">
          <Avatar size={28} colorIndex={1} verified={!!topic.authorVerified}>
            {initialsFor(topic.author)}
          </Avatar>
          <span>
            Started by <strong className="font-semibold text-ink-2">@{topic.author}</strong>
            {topic.authorOccupation && <> · {topic.authorOccupation}</>}
            {topic.authorVerified ? ' · Verified' : ''}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-sans text-[12.5px] font-medium text-ink-3">
          <span>
            <strong className="mr-1 font-serif text-[15px] font-semibold text-oxford">{topic.stats.for}</strong>
            For
          </span>
          <span>
            <strong className="mr-1 font-serif text-[15px] font-semibold text-stance-against">{topic.stats.against}</strong>
            Against
          </span>
          <MetaPill kind="verified-count">
            <VerifiedCountIcon />
            {verifiedArgumentCount(topic)} verified arguments
          </MetaPill>
        </div>
      </div>
    </article>
  );
};

const StandardCard: React.FC<{ topic: Topic; onSelect: (topic: Topic) => void }> = ({ topic, onSelect }) => {
  const closed = isClosed(topic);

  return (
    <article
      onClick={() => onSelect(topic)}
      className="group relative col-span-1 flex cursor-pointer flex-col gap-3 rounded-12 border border-rule bg-cream p-[22px_22px_18px] transition-all duration-150 hover:-translate-y-0.5 hover:border-oxford hover:shadow-[0_12px_28px_rgba(30,58,138,0.14)] lg:col-span-4"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 rounded-t-12 bg-oxford opacity-0 transition-opacity group-hover:opacity-100"
      />

      <div className="flex flex-wrap gap-1.5">
        {topic.type === DebateType.TIMED ? (
          <MetaPill kind="timed">Timed</MetaPill>
        ) : (
          <MetaPill>Debate</MetaPill>
        )}
        {closed && <MetaPill kind="closed">Closed</MetaPill>}
        {topic.isAgeRestricted && <MetaPill kind="warn">18+</MetaPill>}
        <MetaPill>{formatShortDate(topic.createdAt)}</MetaPill>
      </div>

      <h3 className="m-0 font-serif text-[19px] font-medium leading-[1.2] tracking-[-0.01em] text-ink">
        {topic.title}
      </h3>

      <p className="m-0 line-clamp-2 font-sans text-[13.5px] leading-[1.55] text-ink-2">
        {topic.description}
      </p>

      {topic.tags && topic.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">{renderTags(topic.tags, 3)}</div>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-rule pt-3">
        <div className="flex items-center gap-3.5 font-sans text-[12px] font-medium text-ink-3">
          <span>
            <strong className="mr-[3px] font-serif text-[14.5px] font-semibold text-oxford">{topic.stats.for}</strong>
            For
          </span>
          <span>
            <strong className="mr-[3px] font-serif text-[14.5px] font-semibold text-stance-against">{topic.stats.against}</strong>
            Against
          </span>
        </div>
        <MetaPill kind="verified-count">{verifiedArgumentCount(topic)} verified</MetaPill>
      </div>
    </article>
  );
};

export const TopicCard: React.FC<TopicCardProps> = ({ topic, variant, onSelect }) => {
  if (variant === 'lead') {
    return <LeadCard topic={topic} onSelect={onSelect} />;
  }
  return <StandardCard topic={topic} onSelect={onSelect} />;
};

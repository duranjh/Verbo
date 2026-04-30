import React, { useEffect, useState } from 'react';
import { DebateType, PrivacyStatus, Topic } from '../../types';
import { Avatar, MetaPill } from '../ui';
import { StatsBar } from './StatsBar';
import {
  IconArrowLeft,
  IconStar,
  IconShare,
  IconSettings,
} from '../Icons';

interface DebateHeaderProps {
  topic: Topic;
  isStarred: boolean;
  onToggleStar: () => void;
  onBack: () => void;
  onShare: () => void;
  onManageDebate?: () => void;
}

const formatRemaining = (closesAt: number): string => {
  const ms = closesAt - Date.now();
  if (ms <= 0) return 'closed';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `closes in ${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `closes in ${hours}h ${mins}m`;
  return `closes in ${mins}m`;
};

const formatCreatedAt = (ts: number): string =>
  new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const colorIndexFromName = (name: string): 1 | 2 | 3 | 4 | 5 | 6 => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
};

const initialsFor = (name: string): string => {
  const parts = name.replace(/^@/, '').split(/[\s_-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export const DebateHeader: React.FC<DebateHeaderProps> = ({
  topic,
  isStarred,
  onToggleStar,
  onBack,
  onShare,
  onManageDebate,
}) => {
  const isCreator = topic.author === 'You';
  const [tick, setTick] = useState(0);

  // Re-render countdown every minute when timed
  useEffect(() => {
    if (topic.type !== DebateType.TIMED || !topic.closesAt) return;
    const interval = window.setInterval(() => setTick((t) => t + 1), 60000);
    return () => window.clearInterval(interval);
  }, [topic.type, topic.closesAt]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _tick = tick;

  return (
    <section className="flex flex-col gap-5 px-4 pb-6 pt-5 md:px-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1.5 font-sans text-[12.5px] font-medium text-ink-3 transition-colors hover:text-ink"
      >
        <IconArrowLeft className="h-3.5 w-3.5" />
        Back to debates
      </button>

      {/* Pill row + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {topic.type === DebateType.TIMED && topic.closesAt ? (
            <MetaPill kind="timed">Timed · {formatRemaining(topic.closesAt)}</MetaPill>
          ) : (
            <MetaPill>Open debate</MetaPill>
          )}
          <MetaPill kind={topic.privacy === PrivacyStatus.PRIVATE ? 'warn' : 'default'}>
            {topic.privacy === PrivacyStatus.PRIVATE ? 'Private' : 'Public'}
          </MetaPill>
          {topic.isAgeRestricted && <MetaPill kind="warn">18+</MetaPill>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleStar}
            className={`inline-flex items-center gap-1.5 rounded-8 border border-rule bg-cream px-2.5 py-1.5 font-sans text-[12px] font-medium transition-colors hover:bg-cream-2 ${
              isStarred ? 'text-oxford' : 'text-ink-2'
            }`}
          >
            <IconStar className={`h-3.5 w-3.5 ${isStarred ? 'fill-current' : ''}`} />
            {isStarred ? 'Following · 1.2K' : 'Follow · 1.2K'}
          </button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 rounded-8 border border-rule bg-cream px-2.5 py-1.5 font-sans text-[12px] font-medium text-ink-2 transition-colors hover:bg-cream-2"
          >
            <IconShare className="h-3.5 w-3.5" />
            Share
          </button>
          {isCreator && onManageDebate && (
            <button
              type="button"
              onClick={onManageDebate}
              className="inline-flex items-center gap-1.5 rounded-8 border border-rule bg-cream px-2.5 py-1.5 font-sans text-[12px] font-medium text-ink-2 transition-colors hover:bg-cream-2"
            >
              <IconSettings className="h-3.5 w-3.5" />
              Manage
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <h1 className="m-0 font-serif text-[24px] font-medium leading-[1.08] tracking-[-0.018em] text-ink md:text-[38px]">
        {topic.title}
      </h1>

      {/* Description */}
      <p className="m-0 max-w-[70ch] font-sans text-[13.5px] leading-[1.6] text-ink-2 md:text-[15px]">
        {topic.description}
      </p>

      {/* Byline */}
      <div className="flex items-center gap-2.5">
        <Avatar
          size={28}
          colorIndex={topic.author === 'You' ? 1 : colorIndexFromName(topic.author)}
          verified={!!topic.authorVerified}
        >
          {initialsFor(topic.author)}
        </Avatar>
        <span className="font-sans text-[12.5px] font-medium text-ink-3">
          Started by{' '}
          <span className="text-ink">@{topic.author}</span>
          {topic.authorOccupation && (
            <>
              {' · '}
              <span className={topic.authorVerified ? 'font-semibold text-oxford' : ''}>
                {topic.authorOccupation}
              </span>
              {topic.authorVerified && <span className="font-semibold text-oxford"> · Verified</span>}
            </>
          )}
          {' · '}
          {formatCreatedAt(topic.createdAt)}
        </span>
      </div>

      {/* Stats bar */}
      <StatsBar stats={topic.stats} />
    </section>
  );
};

import React from 'react';
import { Comment, Stance } from '../../types';
import { Avatar, RatingPill } from '../ui';
import {
  colorIndexFromName,
  formatRelativeShort,
  initialsFor,
  persuasivenessScore,
  pickCounterArguments,
} from './utils';

interface CounterArgumentListProps {
  current: Comment;
  topicComments: Comment[];
  onSelect: (comment: Comment) => void;
}

const STANCE_CHIP_CLASS: Record<Stance, string> = {
  [Stance.FOR]: 'text-oxford',
  [Stance.AGAINST]: 'text-stance-against',
  [Stance.NEUTRAL]: 'text-ink-3',
};

const STANCE_LABEL: Record<Stance, string> = {
  [Stance.FOR]: 'For',
  [Stance.AGAINST]: 'Against',
  [Stance.NEUTRAL]: 'Neutral',
};

export const CounterArgumentList: React.FC<CounterArgumentListProps> = ({
  current,
  topicComments,
  onSelect,
}) => {
  const counters = pickCounterArguments(current, topicComments);
  if (counters.length === 0) return null;

  return (
    <section className="mt-7 rounded-12 border border-rule bg-cream-2 p-5">
      <h4 className="m-0 mb-1.5 flex items-center gap-2 font-serif text-[14px] font-medium text-ink">
        Strongest counter-arguments
        <span className="rounded-full bg-stance-against px-1.5 py-0.5 font-sans text-[10px] font-semibold text-cream">
          {counters.length}
        </span>
      </h4>
      <p className="m-0 mb-3.5 font-sans text-[12.5px] leading-[1.5] text-ink-3">
        From the opposing side, ranked by persuasiveness score (community + AI). Engaging
        with these is the fastest way to test your view.
      </p>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {counters.map((c) => (
          <li
            key={c.id}
            className="cursor-pointer rounded-8 border border-rule bg-cream p-3.5 transition-colors hover:border-oxford/40"
            onClick={() => onSelect(c)}
          >
            <header className="mb-1.5 flex flex-wrap items-center gap-2">
              <Avatar
                size={24}
                colorIndex={colorIndexFromName(c.author)}
                verified={!!c.isUserVerified}
              >
                {initialsFor(c.author)}
              </Avatar>
              <span className="font-sans text-[11.5px] font-semibold text-ink-2">
                {c.author}
              </span>
              {c.userTitle && (
                <span className="font-sans text-[10px] font-medium text-oxford">
                  {c.userTitle}
                  {c.isUserVerified && ' · Verified'}
                </span>
              )}
              <span
                className={`font-mono text-[9px] uppercase tracking-[0.06em] font-semibold ${
                  STANCE_CHIP_CLASS[c.stance]
                }`}
              >
                {STANCE_LABEL[c.stance]}
              </span>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.06em] text-ink-3">
                ★ {persuasivenessScore(c)}
              </span>
            </header>
            <p className="m-0 font-serif text-[13.5px] leading-[1.5] text-ink-2">
              {c.content}
            </p>
            <footer className="mt-2 flex flex-wrap gap-3.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-3">
              <span>↩ {c.replies?.length ?? 0} replies</span>
              <span>★ {persuasivenessScore(c)} persuasive</span>
              <span>{formatRelativeShort(c.timestamp)}</span>
              <span className="ml-auto">
                {c.aiAnalysis && (
                  <RatingPill rating={c.aiAnalysis.rating} />
                )}
              </span>
            </footer>
          </li>
        ))}
      </ul>
    </section>
  );
};

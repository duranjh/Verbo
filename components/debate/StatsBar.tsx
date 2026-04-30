import React from 'react';
import { Topic } from '../../types';

interface StatsBarProps {
  stats: Topic['stats'];
}

const segPct = (n: number, total: number) => (total > 0 ? (n / total) * 100 : 0);

export const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  const total = stats.for + stats.neutral + stats.against;
  const forPct = segPct(stats.for, total);
  const neuPct = segPct(stats.neutral, total);
  const agaPct = segPct(stats.against, total);

  return (
    <>
      {/* Desktop: 3-column grid */}
      <div className="hidden grid-cols-3 gap-6 border-t border-rule pt-[18px] md:grid">
        <Column
          label="For"
          count={stats.for}
          pct={forPct}
          numColor="text-oxford"
          segments={{ forPct, neuPct, agaPct }}
        />
        <Column
          label="Neutral"
          count={stats.neutral}
          pct={neuPct}
          numColor="text-ink-2"
          segments={{ forPct, neuPct, agaPct }}
        />
        <Column
          label="Against"
          count={stats.against}
          pct={agaPct}
          numColor="text-stance-against"
          segments={{ forPct, neuPct, agaPct }}
        />
      </div>

      {/* Mobile: single horizontal stacked bar */}
      <div className="flex flex-col gap-2.5 border-t border-rule pt-3.5 md:hidden">
        <div className="flex h-2 overflow-hidden rounded-full bg-rule-soft">
          <span style={{ width: `${forPct}%` }} className="h-full bg-oxford" />
          <span style={{ width: `${neuPct}%` }} className="h-full bg-ink-3" />
          <span style={{ width: `${agaPct}%` }} className="h-full bg-stance-against" />
        </div>
        <div className="flex justify-between font-sans text-[12px] font-medium text-ink-3">
          <span className="text-oxford">
            <strong className="font-semibold">{stats.for}</strong> For · {Math.round(forPct)}%
          </span>
          <span>
            <strong className="font-semibold">{stats.neutral}</strong> Neutral
          </span>
          <span className="text-stance-against">
            <strong className="font-semibold">{stats.against}</strong> Against · {Math.round(agaPct)}%
          </span>
        </div>
      </div>
    </>
  );
};

interface ColumnProps {
  label: string;
  count: number;
  pct: number;
  numColor: string;
  segments: { forPct: number; neuPct: number; agaPct: number };
}

const Column: React.FC<ColumnProps> = ({ label, count, pct, numColor, segments }) => (
  <div className="flex flex-col gap-2">
    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
      {label}
    </span>
    <div className="flex items-baseline gap-2">
      <span className={`font-serif text-[26px] font-semibold leading-none ${numColor}`}>
        {count}
      </span>
      <span className="font-sans text-[12px] font-medium text-ink-3">
        {Math.round(pct)}%
      </span>
    </div>
    <div className="flex h-1 overflow-hidden rounded-full bg-rule-soft">
      <span style={{ width: `${segments.forPct}%` }} className="h-full bg-oxford" />
      <span style={{ width: `${segments.neuPct}%` }} className="h-full bg-ink-3" />
      <span style={{ width: `${segments.agaPct}%` }} className="h-full bg-stance-against" />
    </div>
  </div>
);

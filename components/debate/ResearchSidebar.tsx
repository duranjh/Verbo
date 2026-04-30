import React, { useMemo } from 'react';
import { AggregatedSource, SourceCategory } from '../../types';
import {
  CATEGORY_DISPLAY_ORDER,
  SOURCE_CATEGORY_LABEL,
  SOURCE_CATEGORY_SWATCH,
  parseHostname,
} from '../../lib/sourceTaxonomy';
import { Avatar } from '../ui/Avatar';

interface ResearchSidebarProps {
  aggregated: AggregatedSource[];
  readingList: AggregatedSource[];
  onRemoveFromReadingList: (uri: string) => void;
}

const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return (parts[0][0] || '?').toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const colorIndexFromName = (name: string): 1 | 2 | 3 | 4 | 5 | 6 => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return ((Math.abs(hash) % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
};

interface ContributorRow {
  name: string;
  count: number;
  verified: boolean;
  occupationOrHandle: string;
}

const SourceMixCard: React.FC<{ aggregated: AggregatedSource[] }> = ({ aggregated }) => {
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

  const total = aggregated.length;
  const max = Math.max(1, ...(Object.values(counts) as number[]));
  const academicGovPct = total > 0
    ? Math.round(((counts.ACADEMIC + counts.GOVERNMENT) / total) * 100)
    : 0;
  const median = 28;
  const aboveMedian = academicGovPct >= median;

  return (
    <div className="rounded-12 border border-rule bg-cream p-5">
      <div className="mb-2.5 flex items-center justify-between">
        <h4 className="m-0 font-serif text-[14px] font-medium text-ink">Source mix</h4>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-3">
          {total} total
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {CATEGORY_DISPLAY_ORDER.map((cat) => {
          const n = counts[cat];
          const pct = max > 0 ? (n / max) * 100 : 0;
          return (
            <div key={cat} className="flex items-center gap-2.5 font-sans text-[12.5px] text-ink-2">
              <span
                className="h-2.5 w-2.5 flex-none rounded-[2px]"
                style={{ background: SOURCE_CATEGORY_SWATCH[cat] }}
                aria-hidden
              />
              <span className="flex-1 font-medium">{SOURCE_CATEGORY_LABEL[cat]}</span>
              <div className="h-1 flex-1 max-w-[100px] overflow-hidden rounded-full bg-rule-soft">
                <div
                  className="h-full"
                  style={{
                    width: `${pct}%`,
                    background: SOURCE_CATEGORY_SWATCH[cat],
                  }}
                />
              </div>
              <span className="font-mono text-[10px] text-ink-3">{n}</span>
            </div>
          );
        })}
      </div>
      {total > 0 && (
        <div className="mt-3.5 border-t border-rule pt-3.5 font-sans text-[11.5px] leading-[1.5] text-ink-3">
          {aboveMedian ? 'Healthy mix.' : 'Light mix.'} Academic + Government share is {academicGovPct}% — {aboveMedian ? 'above' : 'below'} the platform median of {median}%.
        </div>
      )}
    </div>
  );
};

const TopContributorsCard: React.FC<{ aggregated: AggregatedSource[] }> = ({ aggregated }) => {
  const rows = useMemo<ContributorRow[]>(() => {
    const tally = new Map<string, ContributorRow>();
    for (const s of aggregated) {
      if (!s.addedBy) continue;
      const existing = tally.get(s.addedBy);
      if (existing) {
        existing.count += 1;
        if (s.addedByVerified) existing.verified = true;
      } else {
        tally.set(s.addedBy, {
          name: s.addedBy,
          count: 1,
          verified: !!s.addedByVerified,
          occupationOrHandle: `@${s.addedBy.toLowerCase().replace(/\s+/g, '_')}`,
        });
      }
    }
    return Array.from(tally.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [aggregated]);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-12 border border-rule bg-cream p-5">
      <div className="mb-2.5 flex items-center justify-between">
        <h4 className="m-0 font-serif text-[14px] font-medium text-ink">Top contributors</h4>
      </div>
      <div className="flex flex-col">
        {rows.map((r, i) => (
          <div
            key={r.name}
            className={`flex items-center gap-2.5 py-2 ${
              i < rows.length - 1 ? 'border-b border-rule' : ''
            }`}
          >
            <Avatar size={28} colorIndex={colorIndexFromName(r.name)} verified={r.verified}>
              {initialsFromName(r.name)}
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-sans text-[12.5px] font-semibold text-ink">{r.name}</div>
              <div className="font-sans text-[11px] text-oxford">{r.occupationOrHandle}</div>
            </div>
            <div className="font-serif text-[14px] font-semibold text-ink-2">{r.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReadingListCard: React.FC<{
  readingList: AggregatedSource[];
  onRemove: (uri: string) => void;
}> = ({ readingList, onRemove }) => {
  return (
    <div className="rounded-12 border border-rule bg-cream p-5">
      <div className="mb-2.5 flex items-center justify-between">
        <h4 className="m-0 font-serif text-[14px] font-medium text-ink">My reading list</h4>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-3">
          {readingList.length} saved
        </span>
      </div>
      {readingList.length === 0 ? (
        <p className="m-0 font-sans text-[12px] italic leading-[1.5] text-ink-3">
          Bookmark sources to keep a private reading list — only you can see it.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {readingList.slice(0, 3).map((s) => (
            <div key={s.uri} className="flex items-start gap-2.5 text-[12.5px] leading-[1.4]">
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-3">
                  {parseHostname(s.uri) || s.hostname}
                </div>
                <div className="font-serif text-[13px] leading-[1.35] text-ink">
                  {s.title || s.uri}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(s.uri)}
                aria-label="Remove from reading list"
                className="flex-none cursor-pointer text-[14px] leading-none text-ink-4 hover:text-ink-2"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ResearchSidebar: React.FC<ResearchSidebarProps> = ({
  aggregated,
  readingList,
  onRemoveFromReadingList,
}) => {
  return (
    <aside className="flex flex-col gap-3.5 self-start md:sticky md:top-6">
      <SourceMixCard aggregated={aggregated} />
      <TopContributorsCard aggregated={aggregated} />
      <ReadingListCard readingList={readingList} onRemove={onRemoveFromReadingList} />
    </aside>
  );
};

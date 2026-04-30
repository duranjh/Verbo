import React from 'react';
import { AggregatedSource, CredibilityLevel } from '../../types';
import { getSourceMeta, SOURCE_CATEGORY_LABEL, CREDIBILITY_LABEL } from '../../lib/sourceTaxonomy';
import { Avatar } from '../ui/Avatar';
import { IconExternal } from '../Icons';

interface SourceResearchCardProps {
  source: AggregatedSource;
  featured?: boolean;
  saved?: boolean;
  onToggleSave?: (uri: string) => void;
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

const credibilityClass = (level: CredibilityLevel): string => {
  if (level === 'HIGH') return 'text-evergreen bg-rating-true-bg border-rating-true-bd';
  if (level === 'MEDIUM') return 'text-rating-mis-fg bg-rating-mis-bg border-rating-mis-bd';
  return 'text-rating-fls-fg bg-rating-fls-bg border-rating-fls-bd';
};

export const SourceResearchCard: React.FC<SourceResearchCardProps> = ({
  source,
  featured = false,
  saved = false,
  onToggleSave,
}) => {
  const meta = getSourceMeta(source.uri);
  const fallbackTitle = source.title || source.hostname;
  const excerpt = source.excerpt;

  const featuredClass = featured
    ? 'relative bg-gradient-to-b from-cream-2 to-cream'
    : 'bg-cream';

  return (
    <a
      href={source.uri}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative flex gap-3.5 rounded-[10px] border border-rule p-3.5 no-underline transition-colors hover:border-oxford/30 md:p-[14px_18px] md:gap-3.5 ${featuredClass}`}
    >
      {featured && (
        <span
          aria-hidden
          className="absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-r-[2px] bg-oxford"
        />
      )}

      {/* Thumbnail */}
      <div
        className="flex h-12 w-16 flex-none items-center justify-center rounded-[6px] border border-rule font-serif text-[18px] font-semibold leading-none tracking-[-0.02em] md:h-16 md:w-[88px] md:text-[22px]"
        style={{
          backgroundImage: `linear-gradient(135deg, ${meta.gradient[0]}, ${meta.gradient[1]})`,
          color: '#FAF7F2',
          fontFamily: meta.thumbClass === 'arx' ? 'JetBrains Mono, monospace' : undefined,
          fontSize: meta.thumbClass === 'arx' ? '12px' : undefined,
          letterSpacing: meta.thumbClass === 'arx' ? '0.04em' : undefined,
        }}
        aria-hidden
      >
        {meta.thumbLabel}
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Domain row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.04em] text-ink-3 md:text-[11px]">
            {meta.hostname}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-0.5 font-sans text-[9px] font-medium uppercase tracking-[0.04em] md:text-[10px] ${credibilityClass(source.credibility)}`}
          >
            {CREDIBILITY_LABEL[source.credibility]}
          </span>
          <span className="inline-flex items-center rounded-[4px] border border-rule bg-cream-2 px-1.5 py-0.5 font-sans text-[9px] font-medium uppercase tracking-[0.04em] text-ink-3 md:text-[10px]">
            {SOURCE_CATEGORY_LABEL[source.category]}
          </span>
        </div>

        {/* Title */}
        <h4 className="m-0 font-serif text-[14px] font-medium leading-[1.3] tracking-[-0.005em] text-ink transition-colors group-hover:text-oxford md:text-[16px]">
          {fallbackTitle}
        </h4>

        {/* Excerpt */}
        {excerpt && (
          <p
            className="m-0 line-clamp-2 font-sans text-[12px] leading-[1.55] text-ink-2 md:text-[13px]"
          >
            {excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="mt-0.5 flex flex-wrap items-center gap-2 font-sans text-[11px] text-ink-3 md:gap-3.5 md:text-[11.5px]">
          {source.author && (
            <>
              <span className="font-medium text-ink-2">By {source.author}</span>
              <span aria-hidden>·</span>
            </>
          )}
          {source.publishedAt && (
            <>
              <span>
                {new Date(source.publishedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span aria-hidden>·</span>
            </>
          )}
          {source.citedByCount > 0 && (
            <span className="inline-flex items-center gap-1 font-medium text-oxford">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Cited by {source.citedByCount} {source.citedByCount === 1 ? 'arg' : 'args'}
            </span>
          )}
          {source.addedBy && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Avatar
                  size={24}
                  colorIndex={colorIndexFromName(source.addedBy)}
                  className="!h-3.5 !w-3.5 !text-[7px]"
                >
                  {initialsFromName(source.addedBy)}
                </Avatar>
                Added by @{source.addedBy.toLowerCase().replace(/\s+/g, '_')}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right column: bookmark + external icon */}
      <div className="flex flex-col items-center justify-between gap-2 self-stretch text-ink-3">
        {onToggleSave && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSave(source.uri);
            }}
            aria-label={saved ? 'Remove from reading list' : 'Save to reading list'}
            aria-pressed={saved}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-cream-2 ${
              saved ? 'text-oxford' : 'text-ink-3'
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={saved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        )}
        <IconExternal className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </a>
  );
};

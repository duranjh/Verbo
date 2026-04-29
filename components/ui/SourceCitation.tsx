import React from 'react';

interface SourceCitationProps {
  domain: string;
  url: string;
  title?: string;
  /** Single letter shown inside the favicon mark. Defaults to first letter of domain. */
  favicon?: string;
  /** Tailwind background-color utility for the favicon mark (e.g. "bg-[#1B1714]"). Defaults to bg-ink. */
  faviconColor?: string;
  className?: string;
}

export const SourceCitation: React.FC<SourceCitationProps> = ({
  domain,
  url,
  title,
  favicon,
  faviconColor = 'bg-ink',
  className = '',
}) => {
  const letter = (favicon ?? domain.charAt(0)).toUpperCase();
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-baseline gap-2 rounded-8 border border-rule bg-cream-2 px-2.5 py-1.5 font-sans text-[13px] leading-[1.4] text-ink-2 no-underline transition-colors hover:border-oxford/30 hover:text-ink ${className}`}
    >
      <span
        aria-hidden
        className={`inline-flex h-4 w-4 flex-none items-center justify-center self-center rounded-4 font-mono text-[9px] font-bold text-white ${faviconColor}`}
      >
        {letter}
      </span>
      <span className="font-mono text-[12.5px] font-semibold text-ink">{domain}</span>
      {title && (
        <>
          <span aria-hidden className="text-[11px] text-ink-4">
            ›
          </span>
          <span className="font-serif text-[13.5px] italic text-ink-2">{title}</span>
        </>
      )}
    </a>
  );
};

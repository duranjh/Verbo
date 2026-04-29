import React from 'react';

type MetaKind = 'default' | 'live' | 'timed' | 'warn' | 'closed' | 'verified-count';

interface MetaPillProps {
  kind?: MetaKind;
  children: React.ReactNode;
  className?: string;
}

const KIND_STYLES: Record<MetaKind, string> = {
  default: 'bg-cream-2 text-ink-3 border-rule',
  live: 'bg-editorial-red/10 text-editorial-red border-editorial-red/30',
  timed: 'bg-oxford/10 text-oxford border-oxford/20',
  warn: 'bg-rating-mis-bg text-rating-mis-fg border-rating-mis-bd',
  closed: 'bg-rule text-ink-3 border-rule',
  'verified-count': 'bg-cream text-evergreen border-evergreen/30',
};

export const MetaPill: React.FC<MetaPillProps> = ({
  kind = 'default',
  children,
  className = '',
}) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-4 border px-2 py-[3px] font-sans text-[9.5px] font-semibold uppercase tracking-[0.08em] ${KIND_STYLES[kind]} ${className}`}
  >
    {kind === 'live' && (
      <span aria-hidden className="animate-pulse-soft inline-block h-1.5 w-1.5 flex-none rounded-full bg-current" />
    )}
    {children}
  </span>
);

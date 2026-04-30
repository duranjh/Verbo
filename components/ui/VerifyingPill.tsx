import React from 'react';

interface VerifyingPillProps {
  variant?: 'default' | 'elapsed-time' | 'sources-count';
  elapsedSeconds?: number;
  sourcesCount?: number;
  /** Override the default text. When set, takes precedence over variant defaults — e.g. "Under review" for the occupation verification pending pill. */
  label?: string;
  className?: string;
}

export const VerifyingPill: React.FC<VerifyingPillProps> = ({
  variant = 'default',
  elapsedSeconds,
  sourcesCount,
  label: labelOverride,
  className = '',
}) => {
  let label = 'Verifying';
  if (variant === 'elapsed-time' && typeof elapsedSeconds === 'number') {
    label = `Verifying · ${elapsedSeconds}s`;
  } else if (variant === 'sources-count' && typeof sourcesCount === 'number') {
    label = `Verifying · checking ${sourcesCount} source${sourcesCount === 1 ? '' : 's'}`;
  }
  if (labelOverride) label = labelOverride;

  return (
    <span
      role="status"
      aria-live="polite"
      className={`verify-shimmer-bg animate-verify-shimmer inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-verify-bd bg-verify-bg px-2.5 py-1 font-sans text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.04em] text-verify-fg ${className}`}
    >
      <span aria-hidden className="mr-1 inline-flex gap-[3px]">
        <span className="animate-verify-dot inline-block h-1 w-1 rounded-full bg-current" />
        <span
          className="animate-verify-dot inline-block h-1 w-1 rounded-full bg-current"
          style={{ animationDelay: '0.2s' }}
        />
        <span
          className="animate-verify-dot inline-block h-1 w-1 rounded-full bg-current"
          style={{ animationDelay: '0.4s' }}
        />
      </span>
      <span>{label}</span>
    </span>
  );
};

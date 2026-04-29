import React from 'react';
import { IconSparkles } from '../Icons';

interface AiAssistedPillProps {
  className?: string;
}

export const AiAssistedPill: React.FC<AiAssistedPillProps> = ({ className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-4 border border-oxford/20 bg-oxford/10 px-1.5 py-0.5 font-sans text-[9.5px] font-semibold uppercase leading-[1.4] tracking-[0.08em] text-oxford ${className}`}
  >
    <IconSparkles className="h-3 w-3" />
    AI Assisted
  </span>
);

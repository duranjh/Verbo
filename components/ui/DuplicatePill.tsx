import React from 'react';
import { IconCopy } from '../Icons';

interface DuplicatePillProps {
  className?: string;
}

export const DuplicatePill: React.FC<DuplicatePillProps> = ({ className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-4 border border-rating-mis-bd bg-rating-mis-bg px-1.5 py-0.5 font-sans text-[9.5px] font-semibold uppercase leading-[1.4] tracking-[0.08em] text-rating-mis-fg ${className}`}
  >
    <IconCopy className="h-3 w-3" />
    Duplicate
  </span>
);

import React from 'react';
import { IconEdit } from '../Icons';

interface EditedPillProps {
  className?: string;
}

export const EditedPill: React.FC<EditedPillProps> = ({ className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-4 border border-rule bg-cream px-1.5 py-0.5 font-sans text-[9.5px] font-semibold uppercase leading-[1.4] tracking-[0.08em] text-ink-3 ${className}`}
  >
    <IconEdit className="h-3 w-3" />
    Edited
  </span>
);

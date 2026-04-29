import React from 'react';
import { Stance } from '../../types';

interface StanceTagProps {
  stance: Stance;
  className?: string;
}

const STANCE_STYLES: Record<Stance, string> = {
  [Stance.FOR]: 'bg-oxford/10 text-oxford',
  [Stance.AGAINST]: 'bg-stance-against/10 text-stance-against',
  [Stance.NEUTRAL]: 'bg-stance-neutral/10 text-ink-3',
};

const STANCE_LABEL: Record<Stance, string> = {
  [Stance.FOR]: 'For',
  [Stance.AGAINST]: 'Against',
  [Stance.NEUTRAL]: 'Neutral',
};

export const StanceTag: React.FC<StanceTagProps> = ({ stance, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-4 px-2 py-[3px] font-sans text-[10px] font-semibold uppercase tracking-[0.06em] ${STANCE_STYLES[stance]} ${className}`}
  >
    {STANCE_LABEL[stance]}
  </span>
);

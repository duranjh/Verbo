import React from 'react';
import { Stance } from '../../types';
import { IconAlert } from '../Icons';

interface StanceMismatchNoticeProps {
  detectedStance: Stance;
  postedStance: Stance;
  onSwitch: () => void;
  onKeep: () => void;
  className?: string;
}

const STANCE_LABEL: Record<Stance, string> = {
  [Stance.FOR]: 'FOR',
  [Stance.AGAINST]: 'AGAINST',
  [Stance.NEUTRAL]: 'NEUTRAL',
};

export const StanceMismatchNotice: React.FC<StanceMismatchNoticeProps> = ({
  detectedStance,
  postedStance,
  onSwitch,
  onKeep,
  className = '',
}) => (
  <div
    role="alert"
    className={`flex flex-wrap items-center gap-2.5 rounded-8 border border-rating-mis-bd bg-rating-mis-bg px-3 py-2.5 font-sans text-[12.5px] font-medium text-rating-mis-fg ${className}`}
  >
    <IconAlert className="h-4 w-4 flex-none" />
    <span className="min-w-[200px] flex-1">
      AI detected stance: <strong className="font-bold">{STANCE_LABEL[detectedStance]}</strong>. You posted as{' '}
      <strong className="font-bold">{STANCE_LABEL[postedStance]}</strong> — switch?
    </span>
    <button
      type="button"
      onClick={onKeep}
      className="rounded-[6px] border border-rating-mis-bd bg-cream px-2.5 py-1.5 font-semibold text-[11.5px] text-rating-mis-fg hover:brightness-95"
    >
      Keep my stance
    </button>
    <button
      type="button"
      onClick={onSwitch}
      className="rounded-[6px] border border-rating-mis-fg bg-rating-mis-fg px-2.5 py-1.5 font-semibold text-[11.5px] text-cream hover:brightness-110"
    >
      Switch stance
    </button>
  </div>
);

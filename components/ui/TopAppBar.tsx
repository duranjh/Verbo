import React from 'react';

interface TopAppBarProps {
  leftSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  leftSlot,
  centerSlot,
  rightSlot,
  className = '',
}) => (
  <header
    className={`grid grid-cols-[auto_1fr_auto] items-center gap-6 border-b border-rule bg-cream px-8 py-3.5 ${className}`}
  >
    <div className="flex items-center">{leftSlot}</div>
    <div className="flex items-center justify-center">{centerSlot}</div>
    <div className="flex items-center justify-end gap-3">{rightSlot}</div>
  </header>
);

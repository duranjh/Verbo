import React from 'react';

type Size = 24 | 28 | 32 | 36 | 40 | 64;
type ColorIndex = 1 | 2 | 3 | 4 | 5 | 6 | 'anon';

interface AvatarProps {
  size?: Size;
  colorIndex?: ColorIndex;
  verified?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const COLOR_BG: Record<ColorIndex, string> = {
  1: 'bg-[#1E3A8A]',
  2: 'bg-[#B91C1C]',
  3: 'bg-[#15803D]',
  4: 'bg-[#7C3AED]',
  5: 'bg-[#0F766E]',
  6: 'bg-[#9F1239]',
  anon: 'bg-ink-3 [.theme-dark_&]:bg-ink-4',
};

const SIZE_PX: Record<Size, { box: string; font: string; overlay: string; overlayIcon: string }> = {
  24: { box: 'h-6 w-6', font: 'text-[9px]', overlay: 'h-3 w-3', overlayIcon: 'h-1.5 w-1.5' },
  28: { box: 'h-7 w-7', font: 'text-[10px]', overlay: 'h-3 w-3', overlayIcon: 'h-1.5 w-1.5' },
  32: { box: 'h-8 w-8', font: 'text-[11px]', overlay: 'h-3.5 w-3.5', overlayIcon: 'h-1.5 w-1.5' },
  36: { box: 'h-9 w-9', font: 'text-[12px]', overlay: 'h-3.5 w-3.5', overlayIcon: 'h-2 w-2' },
  40: { box: 'h-10 w-10', font: 'text-[13px]', overlay: 'h-4 w-4', overlayIcon: 'h-2 w-2' },
  64: { box: 'h-16 w-16', font: 'font-serif text-[22px]', overlay: 'h-5 w-5', overlayIcon: 'h-3 w-3' },
};

export const Avatar: React.FC<AvatarProps> = ({
  size = 32,
  colorIndex = 1,
  verified = false,
  children,
  className = '',
}) => {
  const dims = SIZE_PX[size];
  return (
    <span
      className={`relative inline-flex flex-none items-center justify-center rounded-full font-sans font-semibold text-cream ${COLOR_BG[colorIndex]} ${dims.box} ${dims.font} ${className}`}
    >
      {children}
      {verified && (
        <span
          aria-label="Verified"
          className={`absolute -bottom-0.5 -right-0.5 inline-flex items-center justify-center rounded-full border-2 border-cream bg-oxford text-white [.theme-dark_&]:text-cream ${dims.overlay}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={dims.overlayIcon}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
    </span>
  );
};

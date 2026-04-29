import React, { useState } from 'react';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: React.ReactNode;
  placement?: Placement;
  open?: boolean;
  children: React.ReactElement;
}

const POSITION: Record<Placement, string> = {
  top: 'bottom-[calc(100%+8px)] left-0',
  bottom: 'top-[calc(100%+8px)] left-0',
  left: 'right-[calc(100%+8px)] top-0',
  right: 'left-[calc(100%+8px)] top-0',
};

const ARROW: Record<Placement, string> = {
  top: 'top-[-5px] left-[18px]',
  bottom: 'bottom-[-5px] left-[18px]',
  left: 'left-[-5px] top-[14px]',
  right: 'right-[-5px] top-[14px]',
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  placement = 'top',
  open,
  children,
}) => {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const visible = open ?? (hovered || focused);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={`absolute z-50 w-60 rounded-8 bg-ink px-3 py-2.5 text-[11.5px] leading-[1.5] text-cream shadow-[0_6px_20px_rgba(0,0,0,0.18)] ${POSITION[placement]}`}
        >
          {content}
          <span
            aria-hidden
            className={`absolute h-2.5 w-2.5 rotate-45 bg-ink ${ARROW[placement]}`}
          />
        </span>
      )}
    </span>
  );
};

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, className = '' }) => (
  <span
    className={`inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full border-2 border-cream bg-editorial-red px-1 font-sans text-[9px] font-bold leading-none text-white [.theme-dark_&]:text-cream ${className}`}
  >
    {children}
  </span>
);

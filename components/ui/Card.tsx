import React from 'react';

type Variant = 'topic' | 'argument' | 'generic';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  hover?: boolean;
  justPosted?: boolean;
}

const VARIANT_PADDING: Record<Variant, string> = {
  topic: 'p-6',
  argument: 'px-5 pt-5 pb-4',
  generic: 'p-5',
};

export const Card: React.FC<CardProps> = ({
  variant = 'generic',
  hover = false,
  justPosted = false,
  className = '',
  children,
  ...rest
}) => {
  const justPostedClasses = justPosted
    ? 'border-oxford/20 bg-gradient-to-b from-cream-2 to-cream'
    : 'border-rule bg-cream';

  const hoverClasses = hover
    ? 'group hover:-translate-y-0.5 hover:shadow-md'
    : '';

  return (
    <div
      {...rest}
      className={`relative flex flex-col gap-3 rounded-12 border ${VARIANT_PADDING[variant]} ${justPostedClasses} ${hoverClasses} transition-all duration-150 ${className}`}
    >
      {hover && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5 rounded-t-12 bg-oxford opacity-0 transition-opacity group-hover:opacity-100"
        />
      )}
      {justPosted && (
        <span
          aria-hidden
          className="absolute -top-[1px] left-[18px] -translate-y-1/2 rounded-4 bg-oxford px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-[0.1em] text-white [.theme-dark_&]:text-cream"
        >
          Your argument
        </span>
      )}
      {children}
    </div>
  );
};

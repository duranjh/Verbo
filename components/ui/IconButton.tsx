import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Shape = 'circle' | 'square';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  shape?: Shape;
  'aria-label': string;
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary: 'bg-oxford text-white border-oxford hover:brightness-110 active:brightness-90',
  secondary: 'bg-cream text-ink-2 border-rule hover:bg-cream-2 hover:text-ink active:bg-cream-3',
  ghost: 'bg-transparent text-ink-2 border-transparent hover:bg-rule-soft hover:text-ink active:bg-rule',
};

export const IconButton: React.FC<IconButtonProps> = ({
  variant = 'secondary',
  shape = 'circle',
  className = '',
  children,
  disabled,
  ...rest
}) => (
  <button
    type="button"
    disabled={disabled}
    className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center border transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_STYLES[variant]} ${shape === 'circle' ? 'rounded-full' : 'rounded-8'} ${className}`}
    {...rest}
  >
    {children}
  </button>
);

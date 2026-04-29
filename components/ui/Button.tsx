import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'ai';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary:
    'bg-oxford text-white border-oxford hover:brightness-110 active:brightness-90 disabled:opacity-50 disabled:hover:brightness-100',
  secondary:
    'bg-cream text-ink border-rule hover:bg-cream-2 hover:border-ink-4 active:bg-cream-3 disabled:opacity-50 disabled:hover:bg-cream',
  ghost:
    'bg-transparent text-ink-2 border-transparent hover:bg-rule-soft hover:text-ink active:bg-rule disabled:opacity-50 disabled:hover:bg-transparent',
  destructive:
    'bg-editorial-red text-white border-editorial-red hover:brightness-105 active:brightness-95 disabled:opacity-50 disabled:hover:brightness-100',
  ai:
    'bg-cream text-oxford border-oxford/20 hover:bg-oxford/5 active:bg-oxford/10 disabled:opacity-50',
};

const SIZE_STYLES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[12px]',
  md: 'px-3.5 py-2.5 text-[13px]',
  lg: 'px-4.5 py-3 text-[14px]',
};

const Spinner: React.FC<{ size: Size }> = ({ size }) => {
  const dim = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  return (
    <svg
      aria-hidden
      className={`${dim} animate-spin`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  disabled,
  className = '',
  children,
  ...rest
}) => {
  const isDisabled = disabled || loading;
  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-8 border font-sans font-medium transition-colors duration-150 disabled:cursor-not-allowed ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
      {...rest}
    >
      {loading && <Spinner size={size} />}
      {!loading && icon && iconPosition === 'left' && <span className="inline-flex flex-none">{icon}</span>}
      {children}
      {!loading && icon && iconPosition === 'right' && <span className="inline-flex flex-none">{icon}</span>}
    </button>
  );
};

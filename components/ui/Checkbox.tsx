import React, { useId } from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: React.ReactNode;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  id,
  className = '',
  disabled,
  checked,
  ...rest
}) => {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  return (
    <label
      htmlFor={inputId}
      className={`inline-flex cursor-pointer items-center gap-2 font-sans text-[13px] text-ink-2 ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${className}`}
    >
      <span className="relative inline-flex h-4 w-4 flex-none items-center justify-center">
        <input
          id={inputId}
          type="checkbox"
          disabled={disabled}
          checked={checked}
          className="peer absolute inset-0 cursor-pointer appearance-none rounded-[3px] border-[1.5px] border-rule bg-cream checked:border-oxford checked:bg-oxford focus-visible:ring-2 focus-visible:ring-oxford/30 disabled:cursor-not-allowed"
          {...rest}
        />
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none relative h-3 w-3 stroke-white opacity-0 peer-checked:opacity-100 [.theme-dark_&]:stroke-cream"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      {label}
    </label>
  );
};

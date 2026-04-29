import React, { useId } from 'react';
import { IconChevronDown } from '../Icons';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  helperText,
  errorText,
  id,
  className = '',
  disabled,
  children,
  ...rest
}) => {
  const fallbackId = useId();
  const selectId = id ?? fallbackId;
  const hasError = Boolean(errorText);
  const helperId = `${selectId}-helper`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-3"
        >
          {label}
        </label>
      )}
      <div className="relative inline-flex">
        <select
          id={selectId}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={helperText || errorText ? helperId : undefined}
          className={`w-full appearance-none rounded-8 border bg-cream py-2.5 pl-3 pr-9 font-sans text-[13px] text-ink outline-none transition-colors duration-150 focus:border-oxford focus:ring-2 focus:ring-oxford/20 disabled:cursor-not-allowed disabled:opacity-50 ${
            hasError ? 'border-editorial-red focus:border-editorial-red focus:ring-editorial-red/20' : 'border-rule'
          }`}
          {...rest}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 text-ink-3">
          <IconChevronDown className="h-4 w-4" />
        </span>
      </div>
      {(helperText || errorText) && (
        <span
          id={helperId}
          className={`font-sans text-[11px] ${hasError ? 'text-editorial-red' : 'text-ink-3'}`}
        >
          {errorText ?? helperText}
        </span>
      )}
    </div>
  );
};

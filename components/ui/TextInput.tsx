import React, { useId } from 'react';

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  helperText?: string;
  errorText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  label?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  helperText,
  errorText,
  leadingIcon,
  trailingIcon,
  label,
  id,
  className = '',
  disabled,
  ...rest
}) => {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const hasError = Boolean(errorText);
  const helperId = `${inputId}-helper`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ink-3"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leadingIcon && (
          <span className="pointer-events-none absolute left-3 inline-flex text-ink-3">
            {leadingIcon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={hasError || undefined}
          aria-describedby={helperText || errorText ? helperId : undefined}
          disabled={disabled}
          className={`w-full rounded-8 border bg-cream py-2.5 font-sans text-[13px] text-ink outline-none transition-colors duration-150 placeholder:text-ink-4 focus:border-oxford focus:ring-2 focus:ring-oxford/20 disabled:cursor-not-allowed disabled:opacity-50 ${
            hasError ? 'border-editorial-red focus:border-editorial-red focus:ring-editorial-red/20' : 'border-rule'
          } ${leadingIcon ? 'pl-9' : 'pl-3'} ${trailingIcon ? 'pr-9' : 'pr-3'}`}
          {...rest}
        />
        {trailingIcon && (
          <span className="absolute right-3 inline-flex text-ink-3">{trailingIcon}</span>
        )}
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

import React, { useId } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  helperText?: string;
  errorText?: string;
  label?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  helperText,
  errorText,
  label,
  id,
  className = '',
  disabled,
  rows = 4,
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
      <textarea
        id={inputId}
        rows={rows}
        aria-invalid={hasError || undefined}
        aria-describedby={helperText || errorText ? helperId : undefined}
        disabled={disabled}
        className={`w-full resize-none rounded-8 border bg-cream px-3.5 py-3 font-serif text-[15px] leading-[1.55] text-ink outline-none transition-colors duration-150 placeholder:italic placeholder:text-ink-4 focus:border-oxford focus:ring-2 focus:ring-oxford/20 disabled:cursor-not-allowed disabled:opacity-50 ${
          hasError ? 'border-editorial-red focus:border-editorial-red focus:ring-editorial-red/20' : 'border-rule'
        }`}
        {...rest}
      />
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

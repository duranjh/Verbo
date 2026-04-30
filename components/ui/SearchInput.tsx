import React, { useId } from 'react';
import { IconSearch, IconClose } from '../Icons';

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'onChange' | 'type'> {
  value: string;
  onChange: (next: string) => void;
  aiTagged?: boolean;
  onClear?: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  aiTagged = false,
  onClear,
  inputRef,
  id,
  placeholder = 'Search',
  className = '',
  disabled,
  ...rest
}) => {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  const hasValue = value.length > 0;
  const showClearButton = hasValue && !disabled;
  const trailingPad = aiTagged ? 'pr-[64px]' : showClearButton ? 'pr-9' : 'pr-3';

  return (
    <div className={`relative flex w-full items-center ${className}`}>
      <span className="pointer-events-none absolute left-3 inline-flex text-ink-3">
        <IconSearch className="h-4 w-4" />
      </span>
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`h-[38px] w-full rounded-8 border border-rule bg-cream pl-9 font-sans text-[13px] text-ink outline-none placeholder:text-ink-4 focus:border-oxford focus:ring-2 focus:ring-oxford/20 disabled:cursor-not-allowed disabled:opacity-50 ${trailingPad}`}
        {...rest}
      />
      {showClearButton && !aiTagged && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={handleClear}
          className="absolute right-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-ink-3 hover:bg-rule-soft hover:text-ink"
        >
          <IconClose className="h-3.5 w-3.5" />
        </button>
      )}
      {aiTagged && (
        <span className="pointer-events-none absolute right-2 inline-flex items-center gap-1 rounded-full bg-oxford/10 px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.06em] text-oxford">
          ✦ AI
        </span>
      )}
    </div>
  );
};

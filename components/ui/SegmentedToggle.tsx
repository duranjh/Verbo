import React from 'react';

interface SegmentedToggleOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedToggleProps<T extends string> {
  options: SegmentedToggleOption<T>[];
  value: T;
  onChange: (next: T) => void;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
}: SegmentedToggleProps<T>) {
  const padding = size === 'sm' ? 'px-3 py-1' : 'px-3.5 py-1.5';
  return (
    <div
      role="tablist"
      className={`inline-flex gap-0.5 rounded-full border border-rule bg-cream-2 p-[3px] ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center justify-center rounded-full font-sans text-[11.5px] font-semibold uppercase tracking-[0.04em] transition-colors duration-150 ${padding} ${
              selected
                ? 'bg-oxford text-white [.theme-dark_&]:text-cream'
                : 'text-ink-3 hover:text-ink'
            } ${fullWidth ? 'flex-1' : ''}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

import React from 'react';

interface Tab<T extends string> {
  label: string;
  value: T;
  count?: number;
}

interface TabsProps<T extends string> {
  tabs: Tab<T>[];
  value: T;
  onChange: (next: T) => void;
  underlined?: boolean;
  className?: string;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  underlined = true,
  className = '',
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={`flex gap-5 ${underlined ? 'border-b border-rule' : ''} ${className}`}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={`relative inline-flex items-center gap-1.5 py-3 font-serif text-[15px] font-medium transition-colors ${
              selected ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
            }`}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span className="font-mono text-[10px] text-ink-3">
                {tab.count >= 1000 ? `${(tab.count / 1000).toFixed(1)}K` : tab.count}
              </span>
            )}
            {underlined && selected && (
              <span aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 bg-ink" />
            )}
          </button>
        );
      })}
    </div>
  );
}

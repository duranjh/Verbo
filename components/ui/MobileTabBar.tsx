import React from 'react';

interface TabItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

interface FabConfig {
  icon: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
}

interface MobileTabBarProps {
  items: TabItem[];
  fab?: FabConfig;
  className?: string;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ items, fab, className = '' }) => {
  // FAB is the visual middle slot when supplied. Items array is the 4 outer tabs.
  const fabIndex = fab ? Math.floor(items.length / 2) : -1;
  const cells: React.ReactNode[] = [];
  items.forEach((item, idx) => {
    if (idx === fabIndex && fab) {
      cells.push(
        <button
          key="__fab__"
          type="button"
          aria-label={fab.ariaLabel ?? 'Compose'}
          onClick={fab.onClick}
          className="-mt-[18px] flex h-12 w-12 items-center justify-center justify-self-center rounded-full bg-oxford text-white shadow-[0_6px_16px_rgba(30,58,138,0.32)] [.theme-dark_&]:text-cream"
        >
          {fab.icon}
        </button>,
      );
    }
    cells.push(
      <button
        key={item.key}
        type="button"
        onClick={item.onClick}
        className={`flex flex-col items-center gap-1 border-none bg-transparent py-1.5 font-sans text-[10px] font-medium ${
          item.active ? 'text-oxford' : 'text-ink-3'
        }`}
      >
        {item.icon}
        {item.label}
      </button>,
    );
  });

  const cols = items.length + (fab ? 1 : 0);

  return (
    <nav
      aria-label="Primary"
      className={`grid items-end gap-0 border-t border-rule bg-cream px-2 pb-1 pt-2 ${className}`}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {cells}
    </nav>
  );
};

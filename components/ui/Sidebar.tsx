import React, { useEffect } from 'react';
import { IconClose } from '../Icons';
import { IconButton } from './IconButton';

interface SidebarProps {
  anchor?: 'right';
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  anchor = 'right',
  open,
  onClose,
  children,
  className = '',
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const positionClass = anchor === 'right' ? 'right-0' : 'left-0';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="animate-fade-in fixed inset-0 z-50 bg-[rgb(15,23,42,0.45)] backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        className={`animate-slide-in-right absolute top-0 ${positionClass} flex h-full w-full max-w-[400px] flex-col border-l border-rule bg-cream shadow-2xl ${className}`}
      >
        {children}
      </aside>
    </div>
  );
};

interface SidebarHeaderProps {
  title: React.ReactNode;
  onClose?: () => void;
  rightSlot?: React.ReactNode;
  className?: string;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  title,
  onClose,
  rightSlot,
  className = '',
}) => (
  <div
    className={`flex items-center justify-between gap-3 border-b border-rule px-5 py-4 ${className}`}
  >
    <h3 className="m-0 flex-1 font-serif text-[16px] font-semibold text-ink">{title}</h3>
    {rightSlot}
    {onClose && (
      <IconButton variant="ghost" shape="circle" onClick={onClose} aria-label="Close sidebar">
        <IconClose className="h-4 w-4" />
      </IconButton>
    )}
  </div>
);

interface SidebarBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const SidebarBody: React.FC<SidebarBodyProps> = ({ children, className = '' }) => (
  <div className={`flex-1 overflow-y-auto px-5 py-4 ${className}`}>{children}</div>
);

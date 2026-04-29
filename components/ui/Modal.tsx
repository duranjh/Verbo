import React, { useEffect } from 'react';
import { IconClose } from '../Icons';
import { IconButton } from './IconButton';

type Size = 'sm' | 'md' | 'lg';

interface ModalProps {
  size?: Size;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement>;
  className?: string;
}

const SIZE_STYLES: Record<Size, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[600px]',
  lg: 'max-w-[720px]',
};

export const Modal: React.FC<ModalProps> = ({
  size = 'md',
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
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-[rgb(15,23,42,0.55)] p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-16 border border-rule bg-cream text-ink shadow-2xl ${SIZE_STYLES[size]} ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

interface ModalHeaderProps {
  title: React.ReactNode;
  closeable?: boolean;
  onClose?: () => void;
  className?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  closeable = true,
  onClose,
  className = '',
}) => (
  <div
    className={`flex items-center justify-between gap-4 border-b border-rule px-6 py-4 ${className}`}
  >
    <h3 className="m-0 font-serif text-[18px] font-semibold text-ink">{title}</h3>
    {closeable && onClose && (
      <IconButton variant="ghost" shape="circle" onClick={onClose} aria-label="Close dialog">
        <IconClose className="h-4 w-4" />
      </IconButton>
    )}
  </div>
);

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalBody: React.FC<ModalBodyProps> = ({ children, className = '' }) => (
  <div className={`flex-1 overflow-y-auto px-6 py-5 font-sans text-[14px] text-ink-2 ${className}`}>
    {children}
  </div>
);

interface ModalFooterProps {
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  primaryAction,
  secondaryAction,
  children,
  className = '',
}) => (
  <div
    className={`flex items-center justify-end gap-2 border-t border-rule bg-cream-2 px-6 py-3.5 ${className}`}
  >
    {children}
    {secondaryAction}
    {primaryAction}
  </div>
);

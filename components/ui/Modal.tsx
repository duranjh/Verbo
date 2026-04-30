import React, { useEffect } from 'react';
import { IconClose } from '../Icons';
import { IconButton } from './IconButton';

type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  size?: Size;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement>;
  className?: string;
  bottomSheetOnMobile?: boolean;
}

const SIZE_STYLES: Record<Size, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[600px]',
  lg: 'max-w-[720px]',
  xl: 'max-w-[640px]',
};

export const Modal: React.FC<ModalProps> = ({
  size = 'md',
  open,
  onClose,
  children,
  className = '',
  bottomSheetOnMobile = false,
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

  const wrapperLayout = bottomSheetOnMobile
    ? 'items-end p-0 md:items-center md:p-4'
    : 'items-center p-4';
  const cardLayout = bottomSheetOnMobile
    ? 'max-h-[92vh] rounded-t-16 rounded-b-none md:max-h-[90vh] md:rounded-16'
    : 'max-h-[90vh] rounded-16';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`animate-fade-in fixed inset-0 z-50 flex justify-center bg-[rgb(15,23,42,0.55)] backdrop-blur-[2px] ${wrapperLayout}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative flex w-full flex-col overflow-hidden border border-rule bg-cream text-ink shadow-2xl ${cardLayout} ${SIZE_STYLES[size]} ${className}`}
      >
        {bottomSheetOnMobile && (
          <div className="flex flex-none justify-center py-2 md:hidden">
            <span aria-hidden className="h-1 w-9 rounded-full bg-rule" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

interface ModalHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  closeable?: boolean;
  onClose?: () => void;
  className?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  eyebrow,
  title,
  closeable = true,
  onClose,
  className = '',
}) => (
  <div
    className={`flex items-center justify-between gap-4 border-b border-rule px-6 py-4 ${className}`}
  >
    <div className="min-w-0 flex-1">
      {eyebrow && (
        <span className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
          {eyebrow}
        </span>
      )}
      <h3 className="m-0 font-serif text-[19px] font-semibold leading-[1.2] tracking-[-0.01em] text-ink">
        {title}
      </h3>
    </div>
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

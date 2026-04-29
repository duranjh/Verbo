import React, { useEffect } from 'react';
import { IconCheck, IconAlert, IconClose, IconUnknown } from '../Icons';

type Variant = 'success' | 'info' | 'warning' | 'error';

interface ToastProps {
  variant?: Variant;
  message: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

const VARIANT_STYLES: Record<Variant, { ring: string; icon: React.ReactNode }> = {
  success: {
    ring: 'border-evergreen/30 text-evergreen',
    icon: <IconCheck className="h-4 w-4" />,
  },
  info: {
    ring: 'border-oxford/30 text-oxford',
    icon: <IconUnknown className="h-4 w-4" />,
  },
  warning: {
    ring: 'border-rating-mis-bd text-rating-mis-fg',
    icon: <IconAlert className="h-4 w-4" />,
  },
  error: {
    ring: 'border-editorial-red/40 text-editorial-red',
    icon: <IconClose className="h-4 w-4" />,
  },
};

export const Toast: React.FC<ToastProps> = ({
  variant = 'info',
  message,
  duration = 3500,
  onClose,
  className = '',
}) => {
  useEffect(() => {
    if (!onClose) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const style = VARIANT_STYLES[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-1/2 top-6 z-[60] inline-flex max-w-md -translate-x-1/2 items-center gap-2.5 rounded-12 border bg-cream px-4 py-2.5 font-sans text-[13px] text-ink shadow-[0_6px_20px_rgba(0,0,0,0.12)] ${style.ring} ${className}`}
    >
      <span className="inline-flex flex-none">{style.icon}</span>
      <span className="text-ink-2">{message}</span>
    </div>
  );
};

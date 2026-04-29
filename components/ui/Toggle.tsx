import React, { useId } from 'react';

interface ToggleProps {
  label?: React.ReactNode;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  disabled,
  id,
  className = '',
}) => {
  const fallbackId = useId();
  const toggleId = id ?? fallbackId;
  return (
    <label
      htmlFor={toggleId}
      className={`inline-flex cursor-pointer items-center gap-2.5 font-sans text-[13px] text-ink-2 ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${className}`}
    >
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-none items-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-oxford/30 ${
          checked
            ? 'border-oxford bg-oxford'
            : 'border-rule bg-cream-2'
        } disabled:cursor-not-allowed`}
      >
        <span
          aria-hidden
          className={`inline-block h-3.5 w-3.5 rounded-full bg-cream shadow-sm transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
          }`}
        />
      </button>
      {label}
    </label>
  );
};

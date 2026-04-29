import React, { useId } from 'react';

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: React.ReactNode;
}

export const Radio: React.FC<RadioProps> = ({
  label,
  id,
  className = '',
  disabled,
  checked,
  ...rest
}) => {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  return (
    <label
      htmlFor={inputId}
      className={`inline-flex cursor-pointer items-center gap-2 font-sans text-[13px] text-ink-2 ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${className}`}
    >
      <span className="relative inline-flex h-4 w-4 flex-none items-center justify-center">
        <input
          id={inputId}
          type="radio"
          disabled={disabled}
          checked={checked}
          className="peer absolute inset-0 cursor-pointer appearance-none rounded-full border-[1.5px] border-rule bg-cream checked:border-oxford focus-visible:ring-2 focus-visible:ring-oxford/30 disabled:cursor-not-allowed"
          {...rest}
        />
        <span className="pointer-events-none relative h-2 w-2 rounded-full bg-oxford opacity-0 peer-checked:opacity-100" />
      </span>
      {label}
    </label>
  );
};

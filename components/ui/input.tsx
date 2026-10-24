'use client';

import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, type, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const generatedId = useId();
    const inputId = props.id ?? generatedId;
    const isPassword = type === 'password';

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs text-[var(--iv-muted)] mb-2">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword && showPassword ? 'text' : type}
            className={`w-full px-3 py-2.5 border rounded-xl bg-white text-[var(--iv-ink)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--iv-gold)]/50 focus:border-[var(--iv-maroon)] ${
              error ? 'border-red-600' : 'border-[var(--iv-gold-soft)]'
            } ${isPassword ? 'pr-10' : ''} ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--iv-muted)] hover:text-[var(--iv-maroon)] text-xs select-none min-h-11 px-2"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
        {error && <p className="text-[var(--iv-red)] text-xs mt-1">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

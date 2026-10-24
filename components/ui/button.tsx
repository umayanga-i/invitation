'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'iv-button inline-flex items-center justify-center font-medium rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--iv-gold)] disabled:opacity-50 disabled:cursor-not-allowed';

  const variants: Record<string, string> = {
    primary: 'bg-[var(--iv-maroon)] text-[var(--iv-ivory)] border border-[var(--iv-maroon)] hover:bg-[var(--iv-deep)]',
    secondary: 'bg-[var(--iv-ivory)] text-[var(--iv-maroon)] border border-[var(--iv-gold-soft)] hover:bg-[var(--iv-cream)]',
    text: 'bg-transparent text-[var(--iv-maroon)] border-0 hover:underline',
    danger: 'bg-[var(--iv-red)] text-[var(--iv-ivory)] border border-[var(--iv-red)] hover:bg-[var(--iv-danger-hover)]',
  };

  const sizes: Record<string, string> = {
    sm: 'min-h-11 px-4 py-2 text-xs',
    md: 'min-h-11 px-5 py-3 text-sm',
    lg: 'min-h-12 px-7 py-3.5 text-base',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

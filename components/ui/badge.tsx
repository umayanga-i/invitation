import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: ReactNode;
  className?: string;
}

const variants: Record<string, string> = {
  default: 'bg-[var(--iv-cream)] text-[var(--iv-ink)]',
  success: 'bg-[var(--iv-green-bg)] text-[var(--iv-green)]',
  warning: 'bg-[var(--iv-amber-bg)] text-[var(--iv-amber)]',
  error: 'bg-[var(--iv-red-bg)] text-[var(--iv-red)]',
  info: 'bg-[var(--iv-info-bg)] text-[var(--iv-info)]',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-medium tracking-wide ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

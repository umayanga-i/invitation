import type { ReactNode } from 'react';

export function Toast({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div role="status" className={`iv-toast ${className}`}>{children}</div>;
}

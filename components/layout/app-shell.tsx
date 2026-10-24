import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="iv-app-shell min-h-screen bg-[var(--iv-ivory)] text-[var(--iv-ink)]">{children}</div>;
}

/** Dashboard content shell; the shared app header lives in the root layout. */

import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';

type Props = {
  children: ReactNode;
};

export const metadata = {
  title: 'Dashboard — Invitely',
  description: 'Your invitation dashboard',
};

export default function DashboardLayout({ children }: Props) {
  return (
    <AppShell>
    <div className="iv-dashboard-shell min-h-screen bg-[var(--iv-ivory)] text-[var(--iv-ink)]">
      {/* Page content */}
      <div id="dashboard-content">
        {children}
      </div>
    </div>
    </AppShell>
  );
}

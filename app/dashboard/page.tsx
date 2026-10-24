import type { Metadata } from 'next';
import { DashboardHome } from '@/components/dashboard/dashboard-home';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardHome />;
}

'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { BRAND_NAME } from '@/lib/brand';
import { useAuthUser } from './AuthProvider';

export function PublicShell({ children }: { children: ReactNode }) {
  const user = useAuthUser();
  return <div className="iv-public-shell">{!user && <header><Link href="/">{BRAND_NAME}<span>✦</span></Link></header>}<main>{children}</main><footer><span>Made with love in Sri Lanka</span><Link href="/">Back to {BRAND_NAME} ↗</Link></footer></div>;
}

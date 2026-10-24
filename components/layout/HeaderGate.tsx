'use client';

import { usePathname } from 'next/navigation';
import { useAuthUser } from './AuthProvider';
import { AppHeader } from './AppHeader';

export function HeaderGate() {
  const user = useAuthUser();
  const pathname = usePathname();
  const excluded = /^\/(?:login|signup|forgot-password)(?:\/|$)|^\/(?:i|s|rsvp)(?:\/|$)/.test(pathname);
  return user && !excluded ? <AppHeader user={user} /> : null;
}

'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, type AuthUser } from '@/lib/auth';

const AuthContext = createContext<AuthUser | null>(null);

export function AuthProvider({ initialUser, children }: { initialUser: AuthUser | null; children: ReactNode }) {
  const [user, setUser] = useState(initialUser);
  const router = useRouter();

  useEffect(() => {
    // Every sign-in method, sign-out, and profile update uses setCurrentUser.
    const sync = (event: Event) => {
      setUser((event as CustomEvent<AuthUser | null>).detail);
      router.refresh();
    };
    const syncStorage = (event: StorageEvent) => {
      if (event.key !== 'auth:user' && event.key !== null) return;
      setUser(getCurrentUser());
      router.refresh();
    };
    window.addEventListener('auth-change', sync);
    window.addEventListener('storage', syncStorage);
    return () => {
      window.removeEventListener('auth-change', sync);
      window.removeEventListener('storage', syncStorage);
    };
  }, [router]);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuthUser() {
  return useContext(AuthContext);
}

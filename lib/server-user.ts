import 'server-only';

import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from './auth-constants';
import type { AuthUser } from './auth';

/** Read the existing mock session without changing its authentication behavior. */
export async function getServerUser(): Promise<AuthUser | null> {
  const value = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!value) return null;
  try {
    const user = JSON.parse(decodeURIComponent(value)) as Partial<AuthUser> | null;
    if (!user || typeof user.id !== 'string' || typeof user.name !== 'string' ||
      !['email', 'google', 'phone'].includes(user.provider ?? '')) return null;
    return {
      id: user.id,
      name: user.name,
      provider: user.provider as AuthUser['provider'],
      email: typeof user.email === 'string' ? user.email : undefined,
      phone: typeof user.phone === 'string' ? user.phone : undefined,
      avatar: typeof user.avatar === 'string' ? user.avatar : undefined,
    };
  } catch {
    return null;
  }
}

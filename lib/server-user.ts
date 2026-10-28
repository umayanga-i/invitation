import 'server-only';

import { cookies } from 'next/headers';
import type { AuthUser } from './auth';
import { ADMIN_COOKIE_NAME, verifyAdminToken } from './server/admin';
import { dbAdapter } from './db';
import { currentUser } from './server/user-session';

/** Read the existing mock session without changing its authentication behavior. */
export async function getServerUser(): Promise<AuthUser | null> {
  const cookieJar = await cookies();
  const adminToken = cookieJar.get(ADMIN_COOKIE_NAME)?.value;
  if (adminToken && verifyAdminToken(adminToken)) {
    const admin = dbAdapter.getAdminUser(adminToken.slice(0, adminToken.lastIndexOf('.')));
    if (admin?.role === 'admin' && admin.status === 'active') return { id: admin.id, name: admin.name, email: admin.email, provider: admin.provider, role: 'admin' };
  }
  const user = await currentUser();
  return user ? {id:user.id,name:user.name,email:user.email,phone:user.phone,provider:user.provider,role:user.role} : null;
}

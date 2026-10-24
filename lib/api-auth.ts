import { dbAdapter } from '@/lib/db';
import { AUTH_COOKIE_NAME } from '@/lib/auth-constants';

type AuthUser = { id: string };

function userFromCookie(request: Request): AuthUser | null {
  const prefix = `${AUTH_COOKIE_NAME}=`;
  const cookie = request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  if (!cookie) return null;
  try {
    const user = JSON.parse(decodeURIComponent(cookie.slice(prefix.length))) as { id?: unknown };
    return typeof user.id === 'string' && user.id ? { id: user.id } : null;
  } catch { return null; }
}

export function requireApiUser(request: Request): AuthUser | Response {
  return userFromCookie(request) ?? Response.json({ error: 'Authentication required.' }, { status: 401 });
}

export function requireInvitationOwner(request: Request, invitationId: string): AuthUser | Response {
  const user = userFromCookie(request);
  if (!user) return Response.json({ error: 'Authentication required.' }, { status: 401 });
  const invitation = dbAdapter.getInvitation(invitationId);
  if (!invitation || invitation.userId !== user.id) return Response.json({ error: 'Invitation not found.' }, { status: 404 });
  return user;
}

export function requireGuestOwner(request: Request, guestId: string): AuthUser | Response {
  const user = userFromCookie(request);
  if (!user) return Response.json({ error: 'Authentication required.' }, { status: 401 });
  const guest = dbAdapter.getGuest(guestId);
  const invitation = guest ? dbAdapter.getInvitation(guest.invitationId) : null;
  if (!invitation || invitation.userId !== user.id) return Response.json({ error: 'Guest not found.' }, { status: 404 });
  return user;
}

export function isAuthFailure(value: AuthUser | Response): value is Response {
  return value instanceof Response;
}

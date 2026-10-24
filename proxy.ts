// proxy.ts — Next.js 16 route protection proxy
// Named export MUST be `proxy` (not `middleware`) per Next.js 16 API.
// TODO: Replace cookie-based check with a proper JWT verification once
//       Supabase Auth is integrated.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth-constants';

/** Routes that require an authenticated session */
const PROTECTED = ['/dashboard', '/invitations', '/templates', '/profile'];

/** Routes that authenticated users should not be able to reach */
const AUTH_PAGES = ['/login', '/signup'];

export function proxy(request: NextRequest) {
  // The auth cookie is set by lib/auth.ts → setAuthCookie() on sign-in.
  const user = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  // Redirect unauthenticated visitors away from protected pages
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  if (isProtected) response.headers.set('Cache-Control', 'private, no-store, max-age=0');

  // Redirect already-authenticated users away from auth pages
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *  - api routes
     *  - Next.js static/image files
     *  - public assets
     *  - favicon
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

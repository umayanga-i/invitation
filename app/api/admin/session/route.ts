import { NextResponse } from 'next/server';
import { createAdminToken, ADMIN_COOKIE_NAME } from '@/lib/server/admin';
import { dbAdapter } from '@/lib/db';
import { scryptSync,timingSafeEqual } from 'node:crypto';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || !('email' in body) || !('password' in body)) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const input = body as {email?:unknown;password?:unknown};
  if (input.email !== 'admin@invite.test' || typeof input.password!=='string') return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  const credential=dbAdapter.findUserCredential('admin-dev');
  const [salt,digest]=credential?.password_hash?.split(':')??[];
  const expected=digest?Buffer.from(digest,'hex'):Buffer.alloc(0);
  const actual=salt?scryptSync(input.password,salt,expected.length):Buffer.alloc(0);
  if(!salt||actual.length!==expected.length||!timingSafeEqual(actual,expected))return NextResponse.json({error:'Invalid email or password.'},{status:401});
  const admin = credential?.email === input.email && credential.role === 'admin' && credential.status === 'active' ? credential : null;
  if (!admin) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  const response = NextResponse.json({ ok: true, user: { id: admin.id, name: admin.name, email: admin.email } });
  response.cookies.set(ADMIN_COOKIE_NAME, createAdminToken(admin.id), { httpOnly: true, secure: false, sameSite: 'strict', path: '/', maxAge: 60 * 60 * 8 });
  return response;
}
export async function DELETE() { const response = NextResponse.json({ok:true}); response.cookies.delete(ADMIN_COOKIE_NAME); return response; }

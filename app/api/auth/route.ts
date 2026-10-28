import { NextResponse } from 'next/server';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { dbAdapter } from '@/lib/db';
import { currentUser, USER_COOKIE, userToken } from '@/lib/server/user-session';
import { RESET_COOKIE, verifiedResetEmail } from '@/lib/server/password-reset';
import { cookies } from 'next/headers';

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('94') ? `+${digits}` : digits.startsWith('0') ? `+94${digits.slice(1)}` : digits.length === 9 ? `+94${digits}` : value.trim();
};
const hashPassword = (password: string) => { const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`; };
function matches(password: string, stored: string | null) {
  if (!stored) return false;
  const [salt, digest] = stored.split(':');
  if (!salt || !digest) return false;
  const expected = Buffer.from(digest, 'hex'); const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function session(user: ReturnType<typeof dbAdapter.getAdminUser>) {
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  const response = NextResponse.json({ user: { id:user.id, name:user.name, email:user.email, phone:user.phone, provider:user.provider, role:user.role, last_login_at:user.last_login_at } });
  response.cookies.set(USER_COOKIE, userToken(user.id), { httpOnly:true, secure:process.env.NODE_ENV === 'production', sameSite:'lax', path:'/', maxAge:30*86400 });
  return response;
}
export async function GET() {
  const user = await currentUser();
  return Response.json(user ? { id:user.id,name:user.name,email:user.email,phone:user.phone,provider:user.provider,role:user.role,last_login_at:user.last_login_at } : null);
}
export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({error:'Authentication required.'},{status:401});
  try {
    const body = await request.json() as {name?:unknown;phone?:unknown;currentPassword?:unknown;nextPassword?:unknown};
    if (typeof body.name === 'string' && typeof body.phone === 'string') {
      if (!body.name.trim() || body.name.length>120 || body.phone.length>40) return Response.json({error:'Invalid profile.'},{status:400});
      const updated = dbAdapter.updateProfile(user.id,body.name.trim(),body.phone.trim());
      return session(updated);
    }
    if (typeof body.currentPassword !== 'string' || typeof body.nextPassword !== 'string' || body.nextPassword.length<8 || !matches(body.currentPassword,dbAdapter.findUserByEmail(user.email)?.password_hash ?? null)) return Response.json({error:'Current password is incorrect or the new password is too short.'},{status:400});
    dbAdapter.setPasswordHash(user.id,hashPassword(body.nextPassword)); return Response.json({ok:true});
  } catch { return Response.json({error:'Invalid request.'},{status:400}); }
}
export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string,unknown>;
    if (body.action === 'logout') { const r=NextResponse.json({ok:true});r.cookies.delete(USER_COOKIE);return r; }
    if (body.action === 'reset-password') {
      const email=verifiedResetEmail((await cookies()).get(RESET_COOKIE)?.value??'');
      if(!email||email!==body.email||typeof body.password!=='string'||body.password.length<8||body.password.length>200)return Response.json({error:'Password reset verification expired. Verify your email again.'},{status:403});
      const user=dbAdapter.findUserByEmail(email);if(!user)return Response.json({error:'No account found for this email address.'},{status:404});
      dbAdapter.setPasswordHash(user.id,hashPassword(body.password));const r=NextResponse.json({ok:true});r.cookies.delete(RESET_COOKIE);return r;
    }
    const action=String(body.action ?? '');
    if (action==='signup' || action==='login') {
      const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
      const password=typeof body.password==='string'?body.password:'';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length<8 || password.length>200) return Response.json({error:'Enter a valid email and password of at least 8 characters.'},{status:400});
      const existing=action==='login'&&process.env.NODE_ENV!=='production'&&email==='demo@invite.test'?dbAdapter.findUserCredential('user-001'):dbAdapter.findUserByEmail(email);
      if (action==='signup') {
        const verifiedEmail=verifiedResetEmail((await cookies()).get(RESET_COOKIE)?.value??'');
        if(verifiedEmail!==email)return Response.json({error:'Verify your email address before creating an account.'},{status:403});
        if (existing || typeof body.name!=='string' || !body.name.trim() || body.name.length>120) return Response.json({error:'Account already exists or profile is invalid.'},{status:400});
        const created=dbAdapter.createUser({id:randomBytes(16).toString('hex'),name:body.name.trim(),email,provider:'email',passwordHash:hashPassword(password)});
        dbAdapter.touchLogin(created.id);const r=session(dbAdapter.getAdminUser(created.id));r.cookies.delete(RESET_COOKIE);return r;
      }
      if (!existing || !matches(password,existing.password_hash)) return Response.json({error:'Invalid email or password.'},{status:401});
      dbAdapter.touchLogin(existing.id); return session(dbAdapter.getAdminUser(existing.id));
    }
    if (process.env.NODE_ENV==='production') return Response.json({error:'Mock sign-in is disabled.'},{status:404});
    if (action==='google') {
      const email='demo.google@gmail.com'; let user: ReturnType<typeof dbAdapter.getAdminUser> = dbAdapter.findUserByEmail(email);
      if(!user)user=dbAdapter.createUser({id:'mock-google',name:'Demo User',email,provider:'google'});
      dbAdapter.touchLogin(user.id);return session(dbAdapter.getAdminUser(user.id));
    }
    if (action==='phone') {
      const phone=normalizePhone(String(body.phone??''));
      if(body.verify!==true){dbAdapter.issuePhoneOtp(phone);return Response.json({ok:true,developmentOtp:'123456'});}
      if(body.otp!=='123456'||!dbAdapter.consumePhoneOtp(phone))return Response.json({error:'Invalid or expired OTP.'},{status:401});
      let user: ReturnType<typeof dbAdapter.getAdminUser> = dbAdapter.findUserByPhone(phone);
      if(!user)user=dbAdapter.createUser({id:randomBytes(16).toString('hex'),name:'Phone user',phone,provider:'phone'});
      dbAdapter.touchLogin(user.id);return session(dbAdapter.getAdminUser(user.id));
    }
    return Response.json({error:'Unsupported authentication action.'},{status:400});
  } catch (error) { console.error('[api auth]',error);return Response.json({error:'Unable to authenticate.'},{status:500}); }
}

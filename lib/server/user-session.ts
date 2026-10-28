import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { dbAdapter } from '@/lib/db';

export const USER_COOKIE = 'invite_user_session';
function secret() {
  let value = dbAdapter.getSecret('user_session_secret');
  if (!value) { value = randomBytes(32).toString('hex'); dbAdapter.setSecret('user_session_secret', value); }
  return value;
}
export function userToken(id: string) { const payload=`${id}.${Date.now()+30*86400_000}`;return `${payload}.${createHmac('sha256', secret()).update(payload).digest('hex')}`; }
export function userFromToken(token: string) {
  const split = token.lastIndexOf('.');
  if (split < 1) return null;
  const payload=token.slice(0,split);const payloadSplit=payload.lastIndexOf('.');if(payloadSplit<1)return null;
  const id = payload.slice(0,payloadSplit);if(Number(payload.slice(payloadSplit+1))<Date.now())return null;
  const actual = Buffer.from(token.slice(split + 1));
  const expected = Buffer.from(createHmac('sha256', secret()).update(payload).digest('hex'));
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  const user = dbAdapter.getAdminUser(id);
  return user?.status === 'active' ? user : null;
}
export async function currentUser() {
  const token = (await cookies()).get(USER_COOKIE)?.value ?? '';
  return userFromToken(token);
}

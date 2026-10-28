import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { dbAdapter } from '@/lib/db';

export const RESET_COOKIE = 'invite_password_reset';
function key() { let secret=dbAdapter.getSecret('password_reset_secret');if(!secret){secret=randomBytes(32).toString('hex');dbAdapter.setSecret('password_reset_secret',secret);}return secret; }
export function resetToken(email:string) { const value=`${email}:${Date.now()+10*60_000}`;return `${Buffer.from(value).toString('base64url')}.${createHmac('sha256',key()).update(value).digest('hex')}`; }
export function verifiedResetEmail(token:string) { const split=token.lastIndexOf('.');if(split<1)return null;const value=Buffer.from(token.slice(0,split),'base64url').toString();const expected=Buffer.from(createHmac('sha256',key()).update(value).digest('hex'));const actual=Buffer.from(token.slice(split+1));if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;const [email,expiry]=value.split(':');return Number(expiry)>Date.now()?email:null; }

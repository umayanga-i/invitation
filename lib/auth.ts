// lib/auth.ts
// The server owns identity and credentials; localStorage is only a UI cache.

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  provider: 'email' | 'google' | 'phone';
  role?: 'user' | 'admin';
}

export type User = AuthUser & { avatarInitials: string };

export function getOrCreateDemoUser(): User {
  const current = getCurrentUser();
  const user = current ?? {
    id: 'user-001', name: 'Demo User', email: 'demo@invite.test', provider: 'email' as const,
  };
  const initials = user.name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const decorated: User = { ...user, avatarInitials: initials || 'DU' };
  if (!current) setCurrentUser(user);
  return decorated;
}

// ─── Mock Credentials ────────────────────────────────────────────────────────
// Email: demo@invite.test / Password: Demo@1234
// Phone: +94 77 000 0000  / OTP: 123456
// Google: logs in instantly as Demo User

const STORAGE_KEY = 'auth:user';

// ─── Cookie Helpers ───────────────────────────────────────────────────────────

/**
 * Sets the auth cookie so `proxy.ts` can read it for route protection.
 * Uses `document.cookie` — only runs in the browser.
 */
// ─── localStorage Helpers ─────────────────────────────────────────────────────

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as AuthUser;
    return user;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent<AuthUser | null>('auth-change', { detail: user }));
}

export async function updateProfile(profile: Pick<AuthUser, 'name' | 'phone' | 'avatar'>): Promise<AuthUser> {
  const current = getCurrentUser();
  if (!current) throw new Error('Please sign in again to update your profile.');
  const response = await fetch('/api/auth', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name:profile.name,phone:profile.phone ?? ''}) });
  const result = await response.json(); if (!response.ok) throw new Error(result.error ?? 'Unable to update profile.');
  const updated = { ...current, ...result.user, avatar: profile.avatar?.trim() || undefined } as AuthUser;
  setCurrentUser(updated);
  return updated;
}

export async function changePassword(currentPassword: string, nextPassword: string): Promise<void> {
  const current = getCurrentUser();
  if (!current || current.provider !== 'email') throw new Error('Password changes are only available for email accounts.');
  const response=await fetch('/api/auth',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword,nextPassword})});
  const result=await response.json();if(!response.ok)throw new Error(result.error??'Unable to change password.');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function authenticate(body: Record<string,unknown>): Promise<AuthUser> {
  const response=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const result=await response.json();if(!response.ok)throw new Error(result.error??'Authentication failed.');
  const user=result.user as AuthUser;setCurrentUser(user);return user;
}

/**
 * Normalises a phone number to E.164 format for Sri Lanka.
 * 0771234567 → +94771234567
 * +94771234567 → +94771234567
 * 94771234567  → +94771234567
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('94') && digits.length === 11) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+94${digits.slice(1)}`;
  if (digits.length === 9) return `+94${digits}`;
  return phone.trim(); // Return as-is if format unrecognised
}

// ─── Auth Functions ───────────────────────────────────────────────────────────

/**
 * Signs in a user with email and password.
 * TODO: Replace with Supabase signInWithPassword().
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  return authenticate({action:'login',email,password});
}

/**
 * Signs in via Google OAuth.
 * TODO: Replace with Supabase signInWithOAuth({ provider: 'google' }).
 */
export async function signInWithGoogle(): Promise<AuthUser> {
  return authenticate({action:'google'});
}

/**
 * Sends a phone OTP to the given phone number.
 * TODO: Replace with Supabase signInWithOtp({ phone }) or Twilio/SMSC call.
 */
export async function sendPhoneOtp(phone: string): Promise<{ success: boolean }> {
  const response=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'phone',phone})});
  const result=await response.json();if(!response.ok)throw new Error(result.error??'Unable to send OTP.');return {success:true};
}

/**
 * Verifies the OTP for a phone sign-in.
 * TODO: Replace with Supabase verifyOtp({ phone, token, type: 'sms' }).
 */
export async function verifyPhoneOtp(phone: string, otp: string): Promise<AuthUser> {
  return authenticate({action:'phone',phone,otp:otp.trim(),verify:true});
}

/**
 * Creates a new account with email and password.
 * TODO: Replace with Supabase signUp({ email, password, options: { data: { full_name } } }).
 */
export async function signUpWithEmail(
  fullName: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  return authenticate({action:'signup',name:fullName,email,password});
}

/** Resets a mock account password after the email OTP has been verified. */
export async function resetPasswordWithEmail(email: string, nextPassword: string): Promise<void> {
  const response=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reset-password',email:email.trim().toLowerCase(),password:nextPassword})});
  const result=await response.json();if(!response.ok)throw new Error(result.error??'Unable to reset password.');
}

/**
 * Signs the current user out.
 * TODO: Replace with Supabase signOut().
 */
export async function signOut(): Promise<void> {
  await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})});
  setCurrentUser(null);
}

// lib/auth.ts
// Mock authentication library with localStorage persistence.
// TODO: Replace with Supabase/real provider calls when backend is ready.
import { AUTH_COOKIE_NAME } from './auth-constants';

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  provider: 'email' | 'google' | 'phone';
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

const MOCK_EMAIL = 'demo@invite.test';
const MOCK_PASSWORD = 'Demo@1234';
const PASSWORDS_KEY = 'auth:passwords';
const ACCOUNTS_KEY = 'auth:accounts';
const MOCK_PHONE_NORMALIZED = '+94770000000';
const MOCK_OTP = '123456';
const OTP_ISSUED_AT_KEY = 'auth:otp-issued-at';
const OTP_TTL_MS = 5 * 60 * 1000;

const STORAGE_KEY = 'auth:user';
// Cookie names must use the RFC token character set; ':' is not valid here.
const COOKIE_KEY = AUTH_COOKIE_NAME;

// ─── Cookie Helpers ───────────────────────────────────────────────────────────

/**
 * Sets the auth cookie so `proxy.ts` can read it for route protection.
 * Uses `document.cookie` — only runs in the browser.
 */
function setAuthCookie(user: AuthUser | null): void {
  if (typeof document === 'undefined') return;
  if (user) {
    // Expires in 30 days
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(user))}; path=/; expires=${expires}; SameSite=Lax`;
  } else {
    // Delete cookie
    document.cookie = `${COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
}

// ─── localStorage Helpers ─────────────────────────────────────────────────────

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as AuthUser;
    // Recreate the valid cookie for users whose browser only has the old local session.
    setAuthCookie(user);
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
  setAuthCookie(user);
  window.dispatchEvent(new CustomEvent<AuthUser | null>('auth-change', { detail: user }));
}

function readPasswords(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(PASSWORDS_KEY) ?? '{}') as Record<string, string>; }
  catch { return {}; }
}

function readAccounts(): Record<string, { id: string; name: string }> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '{}') as Record<string, { id: string; name: string }>; }
  catch { return {}; }
}

export function updateProfile(profile: Pick<AuthUser, 'name' | 'phone' | 'avatar'>): AuthUser {
  const current = getCurrentUser();
  if (!current) throw new Error('Please sign in again to update your profile.');
  const updated = { ...current, name: profile.name.trim(), phone: profile.phone?.trim() || undefined, avatar: profile.avatar?.trim() || undefined };
  setCurrentUser(updated);
  return updated;
}

export function changePassword(currentPassword: string, nextPassword: string): void {
  const current = getCurrentUser();
  if (!current || current.provider !== 'email') throw new Error('Password changes are only available for email accounts.');
  const passwords = readPasswords();
  const existingPassword = passwords[current.id] ?? (current.id === 'user-001' ? MOCK_PASSWORD : undefined);
  if (!existingPassword || currentPassword !== existingPassword) throw new Error('Current password is incorrect.');
  passwords[current.id] = nextPassword;
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Simulates network latency */
function delay(ms = 800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  await delay();

  const normalizedEmail = email.trim().toLowerCase();
  const account = readAccounts()[normalizedEmail];
  const accountId = normalizedEmail === MOCK_EMAIL ? 'user-001' : account?.id;
  const savedPassword = accountId ? readPasswords()[accountId] ?? (accountId === 'user-001' ? MOCK_PASSWORD : undefined) : undefined;
  if (!accountId || password !== savedPassword) {
    throw new Error('Invalid email or password. Use demo@invite.test / Demo@1234');
  }

  const user: AuthUser = {
    id: accountId,
    name: account?.name ?? 'Demo User',
    email: normalizedEmail,
    provider: 'email',
  };

  setCurrentUser(user);
  return user;
}

/**
 * Signs in via Google OAuth.
 * TODO: Replace with Supabase signInWithOAuth({ provider: 'google' }).
 */
export async function signInWithGoogle(): Promise<AuthUser> {
  await delay();

  const user: AuthUser = {
    id: 'user-003',
    name: 'Demo User',
    email: 'demo.google@gmail.com',
    avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=4285F4&color=fff',
    provider: 'google',
  };

  setCurrentUser(user);
  return user;
}

/**
 * Sends a phone OTP to the given phone number.
 * TODO: Replace with Supabase signInWithOtp({ phone }) or Twilio/SMSC call.
 */
export async function sendPhoneOtp(phone: string): Promise<{ success: boolean }> {
  await delay();

  const normalized = normalizePhone(phone);

  if (normalized !== MOCK_PHONE_NORMALIZED) {
    throw new Error(
      `Phone number not found in mock data. Use +94 77 000 0000. (Received: ${normalized})`,
    );
  }

  // In production this would dispatch a real SMS
  localStorage.setItem(OTP_ISSUED_AT_KEY, String(Date.now()));
  console.log(`[mock-auth] OTP sent to ${normalized} — use code: ${MOCK_OTP}`);
  return { success: true };
}

/**
 * Verifies the OTP for a phone sign-in.
 * TODO: Replace with Supabase verifyOtp({ phone, token, type: 'sms' }).
 */
export async function verifyPhoneOtp(phone: string, otp: string): Promise<AuthUser> {
  await delay();

  const normalized = normalizePhone(phone);

  if (normalized !== MOCK_PHONE_NORMALIZED) {
    throw new Error('Phone number not registered in mock data.');
  }

  const issuedAt = Number(localStorage.getItem(OTP_ISSUED_AT_KEY));
  if (!issuedAt || Date.now() - issuedAt > OTP_TTL_MS) {
    throw new Error('OTP expired. Request a new code.');
  }

  if (otp.trim() !== MOCK_OTP) {
    throw new Error('Invalid OTP. Use 123456 for the mock account.');
  }

  const user: AuthUser = {
    id: 'user-002',
    name: 'Demo User',
    phone: MOCK_PHONE_NORMALIZED,
    provider: 'phone',
  };

  setCurrentUser(user);
  localStorage.removeItem(OTP_ISSUED_AT_KEY);
  return user;
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
  await delay();

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === MOCK_EMAIL || readAccounts()[normalizedEmail]) {
    throw new Error('An account with this email already exists.');
  }

  // In mock mode we just create a local session — no persistence to a real DB
  const user: AuthUser = {
    id: `user-${Date.now()}`,
    name: fullName.trim(),
    email: normalizedEmail,
    provider: 'email',
  };

  const passwords = readPasswords();
  passwords[user.id] = password;
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify({ ...readAccounts(), [normalizedEmail]: { id: user.id, name: user.name } }));
  setCurrentUser(user);
  return user;
}

/**
 * Signs the current user out.
 * TODO: Replace with Supabase signOut().
 */
export async function signOut(): Promise<void> {
  await delay(300);
  setCurrentUser(null);
}

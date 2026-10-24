'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  signInWithEmail,
  signInWithGoogle,
  sendPhoneOtp,
  verifyPhoneOtp,
} from '@/lib/auth';

type AuthMethod = 'email' | 'phone' | 'google';

function DevBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 leading-relaxed">
      <strong>Dev Mode</strong> — Test credentials:
      <br />
      Email: <code className="bg-amber-100 px-1 rounded">demo@invite.test</code> / <code className="bg-amber-100 px-1 rounded">Demo@1234</code>
      <br />
      Phone: <code className="bg-amber-100 px-1 rounded">+94 77 000 0000</code> / OTP: <code className="bg-amber-100 px-1 rounded">123456</code>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/dashboard';

  const [method, setMethod] = useState<AuthMethod>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Email fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone fields
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Email is required');
    if (!password) return setError('Password is required');
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.push(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError('');
    if (!phone.trim()) return setError('Phone number is required');
    setLoading(true);
    try {
      await sendPhoneOtp(phone);
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otp.trim()) return setError('OTP is required');
    setLoading(true);
    try {
      await verifyPhoneOtp(phone, otp);
      router.push(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const methodBtn = (m: AuthMethod, label: string) => (
    <button
      type="button"
      onClick={() => { setMethod(m); setError(''); setOtpSent(false); }}
      className={`flex-1 py-2.5 text-sm rounded-lg transition-colors ${
        method === m
          ? 'bg-[var(--iv-maroon)] text-[var(--iv-ivory)]'
          : 'text-[var(--iv-muted)] hover:bg-[var(--iv-cream)]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="iv-auth flex min-h-screen items-center justify-center bg-[var(--iv-ivory)] px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="font-[Georgia,serif] text-3xl tracking-tight">
            {BRAND_NAME}<span className="text-[var(--iv-gold)] ml-1.5">.</span>
          </h1>
          <p className="text-[var(--iv-muted)] text-sm mt-2">Sign in to your account</p>
        </div>

        {process.env.NODE_ENV !== 'production' && <DevBanner />}

        <div className="iv-auth-card bg-white border border-[var(--iv-gold-soft)] rounded-xl p-6 space-y-5">
          {/* Method selector */}
          <div className="flex gap-1 bg-[var(--iv-cream)] p-1 rounded-lg">
            {methodBtn('email', 'Email')}
            {methodBtn('phone', 'Phone')}
            {methodBtn('google', 'Google')}
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
          )}

          {method === 'email' && (
            <form onSubmit={handleEmail} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <Button type="submit" loading={loading} className="w-full">
                Sign In
              </Button>
            </form>
          )}

          {method === 'phone' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+94 77 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={otpSent}
                autoComplete="tel"
              />
              {!otpSent ? (
                <Button type="button" onClick={handleSendOtp} loading={loading} className="w-full">
                  Send OTP
                </Button>
              ) : (
                <>
                  <Input
                    label="One-Time Password"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                  <Button type="submit" loading={loading} className="w-full">
                    Verify &amp; Sign In
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                    className="text-xs text-[var(--iv-maroon)] hover:underline w-full text-center"
                  >
                    Change number
                  </button>
                </>
              )}
            </form>
          )}

          {method === 'google' && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--iv-muted)] text-center">
                Click below to sign in with your Google account.
              </p>
              <Button onClick={handleGoogle} loading={loading} variant="secondary" className="w-full">
                <svg className="w-4 h-4 mr-2 text-[var(--iv-maroon)]" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="currentColor"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="currentColor"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="currentColor"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="currentColor"
                  />
                </svg>
                Continue with Google
              </Button>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-[var(--iv-muted)] space-y-2">
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[var(--iv-maroon)] font-medium hover:underline">
              Sign up
            </Link>
          </p>
          <p>
            <Link href="/forgot-password" className="text-[var(--iv-maroon)] hover:underline">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center text-sm text-[var(--iv-muted)]">Loading sign in…</main>}><LoginForm /></Suspense>;
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BRAND_NAME } from '@/lib/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signUpWithEmail, signInWithGoogle, sendPhoneOtp, verifyPhoneOtp } from '@/lib/auth';

type Method = 'email' | 'phone' | 'google';

export default function SignupPage() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [phone, setPhone] = useState('+94770000000');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const run = async (action: () => Promise<unknown>) => {
    setError('');
    setLoading(true);
    try {
      await action();
      router.push('/dashboard');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  };

  const submitEmail = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return setError('Full name is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    if (!emailVerified) return setError('Verify your email address before creating your account.');
    void run(() => signUpWithEmail(name, email, password));
  };

  const sendEmailOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return setError('Enter a valid email address.');
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/email-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', email: normalizedEmail }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error ?? result.message ?? 'Unable to send verification code.');
      setEmail(normalizedEmail);
      setOtpSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to send verification code.');
    } finally { setLoading(false); }
  };

  const verifyEmailOtp = async () => {
    if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit code from your email.');
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/email-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email: email.trim().toLowerCase(), otp }),
      });
      const result = await response.json();
      if (!response.ok || !result.verified) throw new Error(result.error ?? result.message ?? 'That code is incorrect or expired.');
      setEmailVerified(true);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to verify your email.');
    } finally { setLoading(false); }
  };

  const sendOtp = () => {
    if (!/^\+?[\d\s()-]{9,18}$/.test(phone)) return setError('Enter a valid phone number.');
    setError('');
    setLoading(true);
    void sendPhoneOtp(phone).then(() => setOtpSent(true)).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : 'Unable to send OTP.');
    }).finally(() => setLoading(false));
  };

  const submitOtp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit OTP.');
    void run(() => verifyPhoneOtp(phone, otp));
  };

  return (
    <main className="iv-auth flex min-h-screen items-center justify-center bg-[var(--iv-ivory)] px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <header className="text-center iv-auth-enter">
          <h1 className="font-[var(--font-italiana)] text-3xl">{BRAND_NAME}<span className="ml-1.5 text-[var(--iv-gold)]">.</span></h1>
          <p className="mt-2 text-sm text-[var(--iv-muted)]">Create your account</p>
        </header>



        <section className="iv-auth-card iv-auth-enter space-y-5 rounded-xl border border-[var(--iv-gold-soft)] bg-white p-6">
          <div className="flex gap-1 rounded-lg bg-[var(--iv-cream)] p-1" role="tablist" aria-label="Sign up method">
            {(['email', 'phone', 'google'] as const).map((item) => (
              <button key={item} type="button" role="tab" aria-selected={method === item}
              onClick={() => { setMethod(item); setError(''); setOtpSent(false); setEmailVerified(false); setOtp(''); }}
                className={`flex-1 rounded-full py-2.5 text-sm capitalize ${method === item ? 'bg-[var(--iv-maroon)] text-[var(--iv-ivory)]' : 'text-[var(--iv-muted)] hover:bg-white'}`}>
                {item === 'phone' ? 'Phone + OTP' : item}
              </button>
            ))}
          </div>

          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          {method === 'email' && <form onSubmit={submitEmail} className="space-y-4">
            <Input label="Full name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" required />
            <div className="space-y-2">
              <Input label="Email" type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailVerified(false); setOtpSent(false); }} autoComplete="email" required />
              {!emailVerified && <Button type="button" variant="secondary" onClick={sendEmailOtp} loading={loading} className="w-full">{otpSent ? 'Resend verification code' : 'Verify email address'}</Button>}
            </div>
            {otpSent && !emailVerified && <div className="space-y-3 rounded-xl bg-[var(--iv-cream)] p-4 iv-auth-enter">
              <p className="text-sm text-[var(--iv-muted)]">Enter the six-digit code we sent to <strong>{email}</strong>.</p>
              <Input label="Email verification code" type="text" inputMode="numeric" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} autoComplete="one-time-code" required />
              <Button type="button" onClick={verifyEmailOtp} loading={loading} className="w-full">Confirm email</Button>
            </div>}
            {emailVerified && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800" role="status">Email verified. Finish setting up your account.</p>}
            {emailVerified && <>
              <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
              <Input label="Confirm password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" required />
              <Button type="submit" loading={loading} className="w-full">Create Account</Button>
            </>}
          </form>}

          {method === 'phone' && <form onSubmit={submitOtp} className="space-y-4">
            <Input label="Phone number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={otpSent} autoComplete="tel" />
            {!otpSent ? <Button type="button" onClick={sendOtp} loading={loading} className="w-full">Send OTP</Button> : <>
              <Input label="One-time password" inputMode="numeric" type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} autoComplete="one-time-code" />
              <Button type="submit" loading={loading} className="w-full">Verify &amp; Create Account</Button>
              <button type="button" onClick={() => { setOtpSent(false); setOtp(''); }} className="w-full text-center text-xs text-[var(--iv-maroon)] hover:underline">Change number</button>
            </>}
          </form>}

          {method === 'google' && <div className="space-y-4 text-center">
            <p className="text-sm text-[var(--iv-muted)]">Continue with your Google account.</p>
            <Button type="button" onClick={() => void run(signInWithGoogle)} loading={loading} variant="secondary" className="w-full">Continue with Google</Button>
          </div>}
        </section>

        <p className="text-center text-sm text-[var(--iv-muted)]">Already have an account? <Link href="/login" className="font-medium text-[var(--iv-maroon)] hover:underline">Sign in</Link></p>
      </div>
    </main>
  );
}

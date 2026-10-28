'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BRAND_NAME } from '@/lib/brand';
import { resetPasswordWithEmail } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const request = async (action: 'send' | 'verify') => {
    const response = await fetch('/api/auth/email-otp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, email: email.trim().toLowerCase(), ...(action === 'verify' ? { otp } : {}) }),
    });
    const result = await response.json();
    if (!response.ok || (action === 'send' ? !result.success : !result.verified)) {
      throw new Error(result.error ?? (action === 'send' ? 'Unable to send a code.' : 'That code is incorrect or expired.'));
    }
  };

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setLoading(true);
    try { await request('send'); setStep('code'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to send a code.'); }
    finally { setLoading(false); }
  };

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit code from your email.');
    if (password.length < 8) return setError('Use at least 8 characters for your password.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await request('verify');
      await resetPasswordWithEmail(email, password);
      setStep('done');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to reset your password.'); }
    finally { setLoading(false); }
  };

  return (
    <main className="iv-auth flex min-h-screen items-center justify-center bg-[var(--iv-ivory)] px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <header className="text-center iv-auth-enter">
          <h1>{BRAND_NAME}<span className="ml-1.5">.</span></h1>
          <p className="mt-2 text-sm text-[var(--iv-muted)]">Reset your password</p>
        </header>

        <section className="iv-auth-card iv-auth-enter space-y-5 rounded-xl bg-white p-6">
          {step === 'done' ? (
            <div className="space-y-4 py-3 text-center" role="status">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--iv-cream)] text-2xl text-[var(--iv-maroon)]" aria-hidden="true">✓</div>
              <h2 className="text-xl text-[var(--iv-deep)]">Password updated</h2>
              <p className="text-sm text-[var(--iv-muted)]">Your password has been changed for this account.</p>
              <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--iv-maroon)] px-6 text-sm text-white">Back to sign in</Link>
            </div>
          ) : step === 'email' ? (
            <>
              <p className="text-sm leading-relaxed text-[var(--iv-muted)]">Enter your email and we&apos;ll send a one-time code to verify it&apos;s you.</p>
              {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
              <form onSubmit={handleSend} className="space-y-4">
                <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
                <Button type="submit" loading={loading} className="w-full">Send verification code</Button>
              </form>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-[var(--iv-muted)]">Enter the code sent to <strong>{email}</strong>, then choose a new password.</p>
              {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
              <form onSubmit={handleReset} className="space-y-4">
                <Input label="One-time code" type="text" inputMode="numeric" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} autoComplete="one-time-code" required />
                <Input label="New password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
                <Input label="Confirm new password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" required />
                <Button type="submit" loading={loading} className="w-full">Verify code &amp; reset password</Button>
              </form>
              <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(''); }} className="w-full text-center text-xs text-[var(--iv-maroon)] hover:underline">Use a different email</button>
            </>
          )}
        </section>

        <p className="text-center text-sm text-[var(--iv-muted)]">Remember your password? <Link href="/login" className="font-medium text-[var(--iv-maroon)] hover:underline">Sign in</Link></p>
      </div>
    </main>
  );
}

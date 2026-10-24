'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BRAND_NAME } from '@/lib/brand';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setError('Enter a valid email address');

    setLoading(true);
    // TODO: Replace with Supabase resetPasswordForEmail()
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="iv-auth flex min-h-screen items-center justify-center bg-[var(--iv-ivory)] px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="font-[Georgia,serif] text-3xl tracking-tight">
            {BRAND_NAME}<span className="text-[var(--iv-gold)] ml-1.5">.</span>
          </h1>
          <p className="text-[var(--iv-muted)] text-sm mt-2">Reset your password</p>
        </div>

        <div className="iv-auth-card bg-white border border-[var(--iv-gold-soft)] rounded-xl p-6 space-y-5">
          {sent ? (
            <div className="text-center space-y-3 py-4">
              <div className="text-3xl">&#9993;</div>
              <h2 className="text-lg font-medium text-[var(--iv-ink)]">Check your email</h2>
              <p className="text-sm text-[var(--iv-muted)] leading-relaxed">
                If an account with <strong>{email}</strong> exists, we&apos;ve sent a
                password reset link. Check your inbox and spam folder.
              </p>
              <Button
                variant="secondary"
                onClick={() => { setSent(false); setEmail(''); }}
                className="mt-2"
              >
                Try another email
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
              )}
              <p className="text-sm text-[var(--iv-muted)] leading-relaxed">
                Enter the email address associated with your account and we&apos;ll send
                you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <Button type="submit" loading={loading} className="w-full">
                  Send Reset Link
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-[var(--iv-muted)]">
          Remember your password?{' '}
          <Link href="/login" className="text-[var(--iv-maroon)] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

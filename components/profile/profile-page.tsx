'use client';

import { useEffect, useState } from 'react';
import { changePassword, getCurrentUser, updateProfile, type AuthUser } from '@/lib/auth';

function initials(name: string): string {
  return name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
}

export function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Re-sync if auth state changed (e.g. after a sign-in event)
    const sync = () => {
      const current = getCurrentUser();
      if (!current) { setUser(null); return; }
      setUser(current);
      setName(current.name);
      setPhone(current.phone ?? '');
      setAvatar(current.avatar ?? '');
    };
    sync();
    window.addEventListener('auth-change', sync);
    return () => window.removeEventListener('auth-change', sync);
  }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice('');
    if (!name.trim()) { setError('Please enter your name.'); return; }
    try {
      const updated = await updateProfile({ name, phone, avatar });
      setUser(updated); setNotice('Profile updated.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update your profile.'); }
  }

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice('');
    if (newPassword.length < 8) { setError('Use at least 8 characters for your new password.'); return; }
    if (newPassword !== confirmPassword) { setError('The new passwords do not match.'); return; }
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setNotice('Password updated.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not change your password.'); }
  }

  if (!user) return <main className="iv-state-page min-h-[70vh]">Loading profile…</main>;

  return (
    <main className="iv-app-page min-h-screen bg-[var(--iv-ivory)] px-4 py-8 text-[var(--iv-ink)] sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[.22em] text-amber-300">Your account</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Profile</h1><p className="mt-2 text-sm text-[var(--iv-muted)]">Keep your contact details up to date.</p></div>
        {notice && <p role="status" className="mb-5 rounded-lg border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">{notice}</p>}
        {error && <p role="alert" className="mb-5 rounded-lg border border-rose-900 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{error}</p>}
        <section className="rounded-2xl border border-[var(--iv-gold-soft)] bg-[var(--iv-cream)] p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Personal details</h2>
          <div className="my-6 flex items-center gap-4">
            {avatar ? <img src={avatar} alt="Profile avatar preview" className="h-16 w-16 rounded-full border border-[var(--iv-gold-soft)] object-cover" /> : <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-amber-500 to-rose-600 text-lg font-bold">{initials(name)}</span>}
            <div><p className="font-medium">{name || 'Your name'}</p><p className="mt-1 text-xs text-[var(--iv-muted)]">{user.email ?? user.phone ?? 'Signed in account'}</p></div>
          </div>
          <form onSubmit={saveProfile} className="space-y-4">
            <label className="block text-sm font-medium text-[var(--iv-muted)]">Name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] bg-white px-3 py-2.5 text-[var(--iv-ink)] outline-none focus:border-amber-400" /></label>
            <label className="block text-sm font-medium text-[var(--iv-muted)]">Phone<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" placeholder="+94 77 123 4567" className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] bg-white px-3 py-2.5 text-[var(--iv-ink)] outline-none focus:border-amber-400" /></label>
            <label className="block text-sm font-medium text-[var(--iv-muted)]">Avatar image URL (optional)<input type="url" value={avatar} onChange={(event) => setAvatar(event.target.value)} placeholder="https://example.com/photo.jpg" className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] bg-white px-3 py-2.5 text-[var(--iv-ink)] outline-none focus:border-amber-400" /><span className="mt-1 block text-xs text-[var(--iv-muted)]">Leave blank to use your initials.</span></label>
            <button className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-[var(--iv-deep)] hover:bg-amber-300">Save profile</button>
          </form>
        </section>

        {user.provider === 'email' && <section className="mt-5 rounded-2xl border border-[var(--iv-gold-soft)] bg-[var(--iv-cream)] p-5 sm:p-7"><h2 className="text-lg font-semibold">Change password</h2><p className="mt-1 text-sm text-[var(--iv-muted)]">Update the password for your email sign-in.</p><form onSubmit={savePassword} className="mt-5 space-y-4"><label className="block text-sm font-medium text-[var(--iv-muted)]">Current password<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] bg-[var(--iv-ivory)] px-3 py-2.5 text-[var(--iv-ivory)] outline-none focus:border-amber-400" /></label><label className="block text-sm font-medium text-[var(--iv-muted)]">New password<input type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" required className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] bg-[var(--iv-ivory)] px-3 py-2.5 text-[var(--iv-ivory)] outline-none focus:border-amber-400" /></label><label className="block text-sm font-medium text-[var(--iv-muted)]">Confirm new password<input type="password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] bg-[var(--iv-ivory)] px-3 py-2.5 text-[var(--iv-ivory)] outline-none focus:border-amber-400" /></label><button className="rounded-lg border border-[var(--iv-gold-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--iv-ivory)] hover:bg-[var(--iv-cream)]">Update password</button></form></section>}

        <section className="mt-5 rounded-2xl border border-[var(--iv-gold-soft)] bg-[var(--iv-cream)]/50 p-5 sm:p-7"><h2 className="text-lg font-semibold">Delete account</h2><p className="mt-1 text-sm leading-6 text-[var(--iv-muted)]">Account deletion is not available in this mock version. Contact support when account management is enabled.</p><button type="button" disabled className="mt-4 cursor-not-allowed rounded-lg border border-[var(--iv-gold-soft)] px-4 py-2.5 text-sm font-medium text-[var(--iv-muted)]">Delete my account</button></section>
      </div>
    </main>
  );
}

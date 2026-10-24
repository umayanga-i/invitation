'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { createInvitation, deleteInvitation, listInvitations, updateInvitation } from '@/lib/invitations';
import type { Invitation } from '@/lib/mock-data';
import { getTemplate } from '@/components/templates/registry';

function formatDate(value: string): string {
  if (!value) return 'Date to be set';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function InvitationListPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    const user = getCurrentUser();
    if (!user) {
      const timer = window.setTimeout(() => setLoading(false), 0);
      return () => { active = false; window.clearTimeout(timer); };
    }
    void listInvitations(user.id).then((items) => {
      if (active) setInvitations(items);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Could not load invitations.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function togglePublished(invitation: Invitation) {
    setBusyId(invitation.id); setError(''); setNotice('');
    try {
      const status = invitation.status === 'published' ? 'draft' : 'published';
      const updated = await updateInvitation(invitation.id, { status });
      setInvitations((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
      setNotice(status === 'published' ? 'Invitation published.' : 'Invitation unpublished.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update invitation status.'); }
    finally { setBusyId(''); }
  }

  async function duplicate(invitation: Invitation) {
    setBusyId(invitation.id); setError(''); setNotice('');
    try {
      const user = getCurrentUser();
      if (!user) throw new Error('Please sign in again to duplicate this invitation.');
      const copy = await createInvitation({
        title: `${invitation.title} (copy)`, templateId: invitation.templateId,
        userId: user.id, type: invitation.type,
        customData: { ...invitation.customData, guestName: undefined },
      });
      setInvitations((current) => [{ ...copy, guestCount: 0, rsvpCount: 0 }, ...current]);
      setNotice('Invitation duplicated. Guests and RSVP responses were not copied.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not duplicate invitation.'); }
    finally { setBusyId(''); }
  }

  async function remove(invitation: Invitation) {
    if (!window.confirm(`Delete “${invitation.title}”? This also removes its guest list and RSVP responses.`)) return;
    setBusyId(invitation.id); setError(''); setNotice('');
    try {
      await deleteInvitation(invitation.id);
      setInvitations((current) => current.filter((item) => item.id !== invitation.id));
      setNotice('Invitation deleted.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not delete invitation.'); }
    finally { setBusyId(''); }
  }

  return (
    <main className="iv-app-page min-h-screen bg-[var(--iv-ivory)] px-4 py-8 text-[var(--iv-ink)] sm:px-8 sm:py-10">
      <div className="mx-auto max-w-screen-xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[.22em] text-amber-300">Your celebrations</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">My invitations</h1><p className="mt-2 text-sm text-[var(--iv-muted)]">Manage your designs, guests, and event status.</p></div>
          <Link href="/templates/wedding-classic" className="inline-flex w-fit items-center rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-[var(--iv-deep)] hover:bg-amber-300">＋ Create invitation</Link>
        </div>
        {notice && <p role="status" className="mb-5 rounded-lg border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">{notice}</p>}
        {error && <p role="alert" className="mb-5 rounded-lg border border-rose-900 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{error}</p>}
        {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-[var(--iv-cream)]" />)}</div> : invitations.length === 0 ? (
          <section className="grid min-h-[340px] place-items-center rounded-2xl border border-dashed border-[var(--iv-gold-soft)] bg-[var(--iv-cream)]/40 p-8 text-center">
            <div><span className="text-4xl text-amber-300" aria-hidden="true">✧</span><h2 className="mt-4 text-xl font-semibold">Your first invitation starts here.</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--iv-muted)]">Choose a design, add your event details, and share a personal link with your guests.</p><Link href="/templates/wedding-classic" className="mt-5 inline-flex rounded-lg bg-amber-400 px-5 py-3 text-sm font-semibold text-[var(--iv-deep)] hover:bg-amber-300">Create your first invitation</Link></div>
          </section>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {invitations.map((invitation) => {
              const template = getTemplate(invitation.templateId);
              const InvitationTemplate = template?.Component;
              const published = invitation.status === 'published';
              const busy = busyId === invitation.id;
              return <article key={invitation.id} className="overflow-hidden rounded-2xl border border-[var(--iv-gold-soft)] bg-[var(--iv-cream)] shadow-lg shadow-black/10">
                <div className="relative h-52 overflow-hidden bg-[var(--iv-ivory)]" aria-hidden="true">
                  {InvitationTemplate ? <div className="pointer-events-none absolute left-0 top-0 w-[200%] origin-top-left scale-50"><InvitationTemplate {...invitation.customData} /></div> : <div className="grid h-full place-items-center text-4xl text-amber-300">✦</div>}
                  <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${published ? 'bg-emerald-400/15 text-emerald-300' : 'bg-[var(--iv-cream)]/90 text-[var(--iv-muted)]'}`}>{published ? 'Published' : invitation.status === 'archived' ? 'Archived' : 'Draft'}</span>
                </div>
                <div className="p-4">
                  <p className="text-xs text-[var(--iv-muted)]">{template?.name ?? 'Invitation'} · {formatDate(invitation.customData.date)}</p>
                  <h2 className="mt-1 truncate text-lg font-semibold">{invitation.title}</h2>
                  <div className="mt-3 flex gap-4 text-xs text-[var(--iv-muted)]"><span>{invitation.guestCount ?? 0} guests</span><span>{invitation.rsvpCount ?? 0} responses</span></div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link href={`/invitations/${encodeURIComponent(invitation.id)}`} className="rounded-lg bg-[var(--iv-cream)] px-3 py-2 text-center text-xs font-semibold hover:bg-[var(--iv-gold-soft)]">Open</Link>
                    <Link href={`/invitations/${encodeURIComponent(invitation.id)}/edit`} className="rounded-lg bg-[var(--iv-cream)] px-3 py-2 text-center text-xs font-semibold hover:bg-[var(--iv-gold-soft)]">Edit</Link>
                    <button type="button" disabled={busy} onClick={() => void duplicate(invitation)} className="rounded-lg border border-[var(--iv-gold-soft)] px-3 py-2 text-xs font-medium text-[var(--iv-muted)] hover:bg-[var(--iv-cream)] disabled:opacity-50">Duplicate</button>
                    <button type="button" disabled={busy} onClick={() => void togglePublished(invitation)} className="rounded-lg border border-amber-700/60 px-3 py-2 text-xs font-medium text-amber-200 hover:bg-amber-400/10 disabled:opacity-50">{busy ? 'Saving…' : published ? 'Unpublish' : 'Publish'}</button>
                    <button type="button" disabled={busy} onClick={() => void remove(invitation)} className="col-span-2 rounded-lg border border-rose-900/70 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-950/50 disabled:opacity-50">Delete</button>
                  </div>
                </div>
              </article>;
            })}
          </div>
        )}
      </div>
    </main>
  );
}

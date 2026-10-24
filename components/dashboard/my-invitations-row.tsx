'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { listInvitations } from '@/lib/invitations';
import type { Invitation } from '@/lib/mock-data';
import { getTemplate } from '@/components/templates/registry';

function StatusBadge({ status }: { status: Invitation['status'] }) {
  const styles: Record<Invitation['status'], string> = {
    draft: 'bg-[var(--iv-gold-soft)] text-[var(--iv-muted)]',
    published: 'bg-emerald-900/60 text-emerald-300',
    archived: 'bg-[var(--iv-cream)] text-[var(--iv-muted)]',
  };
  return <span className={`inline-block rounded-sm px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${styles[status]}`}>{status}</span>;
}

function InvitationCard({ invitation }: { invitation: Invitation }) {
  const template = getTemplate(invitation.templateId);
  const InvitationTemplate = template?.Component;
  const date = invitation.customData.date
    ? new Date(`${invitation.customData.date}T12:00:00`).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Date to be set';

  return (
    <Link href={`/invitations/${encodeURIComponent(invitation.id)}`} aria-label={`Open invitation: ${invitation.title}`} className="group/card block w-[220px] flex-none snap-start rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 sm:w-[250px]">
      <article className="h-full overflow-hidden rounded-xl border border-[var(--iv-gold-soft)]/60 bg-[var(--iv-cream)] transition-colors group-hover/card:border-amber-400/60">
        <div className="relative h-36 overflow-hidden bg-[var(--iv-cream)]" aria-hidden="true">
          {InvitationTemplate ? (
            <div className="pointer-events-none absolute left-0 top-0 w-[250%] origin-top-left scale-[0.4]">
              {/* The card itself is one link; suppress links embedded in the inert preview. */}
              <InvitationTemplate {...invitation.customData} mapLink={undefined} />
            </div>
          ) : <div className="grid h-full place-items-center text-4xl" style={{ color: invitation.customData.colors.primary }}>✦</div>}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--iv-deep)]/40 to-transparent" />
        </div>
        <div className="p-3.5">
          <StatusBadge status={invitation.status} />
          <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-tight text-[var(--iv-deep)]">{invitation.title}</h3>
          <p className="mt-1 text-xs text-[var(--iv-muted)]">{date}</p>
          <p className="mt-2 text-[11px] text-[var(--iv-muted)]">{invitation.type === 'common' ? 'Shared invitation' : 'Personal invitation'}</p>
          <span className="mt-3 block w-full rounded-full bg-[var(--iv-maroon)] py-2 text-center text-xs text-[var(--iv-ivory)] transition-colors group-hover/card:bg-[var(--iv-deep)]">Manage invitation →</span>
        </div>
      </article>
    </Link>
  );
}

function InvitationCardSkeleton() {
  return <div className="w-[220px] flex-none animate-pulse overflow-hidden rounded-xl bg-[var(--iv-cream)] sm:w-[250px]"><div className="h-36 bg-[var(--iv-gold-soft)]" /><div className="space-y-2 p-3"><div className="h-3 w-3/4 rounded bg-[var(--iv-gold-soft)]" /><div className="h-2.5 w-1/2 rounded bg-[var(--iv-gold-soft)]" /><div className="h-2.5 w-2/3 rounded bg-[var(--iv-gold-soft)]" /></div></div>;
}

export function MyInvitationsRow() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const user = getCurrentUser();
        if (!user) { setInvitations([]); return; }
        const saved = await listInvitations(user.id);
        if (cancelled) return;
        setInvitations(saved);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not load your invitations.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="mb-10" aria-label="My invitations">
      <div className="mb-3 flex items-center justify-between px-4 md:px-8">
        <div><h2 className="text-base font-semibold tracking-tight text-[var(--iv-deep)] sm:text-lg">My invitations</h2><p className="mt-0.5 text-xs text-[var(--iv-muted)]">Your saved designs and RSVP progress</p></div>
        <Link href="/invitations" className="text-xs text-amber-300 transition-colors hover:text-amber-200">View all →</Link>
      </div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:px-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" role="list">
        {loading ? Array.from({ length: 3 }).map((_, index) => <div key={index} role="listitem"><InvitationCardSkeleton /></div>) : error ? (
          <p role="status" className="rounded-xl border border-rose-900/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">{error}</p>
        ) : invitations.length === 0 ? (
          <div className="flex w-[250px] flex-none flex-col items-center justify-center rounded-xl border border-dashed border-[var(--iv-gold-soft)] p-6 text-center">
            <span className="mb-2 text-3xl text-amber-300" aria-hidden="true">✧</span><p className="text-xs text-[var(--iv-muted)]">No invitations yet.</p>
            <Link href="/templates/wedding-classic" className="mt-3 rounded-md bg-amber-400 px-3 py-1.5 text-xs font-semibold text-[var(--iv-deep)] transition hover:bg-amber-300">Create your first →</Link>
          </div>
        ) : invitations.map((invitation) => <div key={invitation.id} role="listitem"><InvitationCard invitation={invitation} /></div>)}
      </div>
    </section>
  );
}

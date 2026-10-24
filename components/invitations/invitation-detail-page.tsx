'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getGuests, getInvitation } from '@/lib/invitations';
import type { Guest, Invitation } from '@/lib/mock-data';
import { getTemplate } from '@/components/templates/registry';
import { InvitationManagement } from './invitation-management';

export function InvitationDetailPage({ invitationId }: { invitationId: string }) {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([getInvitation(invitationId), getGuests(invitationId)]).then(([result, invitationGuests]) => {
      if (active) { setInvitation(result); setGuests(invitationGuests); setLoaded(true); }
    });
    return () => { active = false; };
  }, [invitationId]);

  if (!loaded) return <main className="iv-state-page">Loading invitation…</main>;
  if (!invitation) return <main className="iv-state-page"><span className="iv-state-icon" aria-hidden="true">✉</span><h1>Invitation not found</h1><Link className="iv-state-link" href="/dashboard">Return to dashboard</Link></main>;

  const template = getTemplate(invitation.templateId);
  if (!template) return <main className="iv-state-page">This invitation template is unavailable.</main>;
  const Invitation = template.Component;

  return <main className="iv-app-page min-h-screen bg-[var(--iv-ivory)] px-4 py-8 text-[var(--iv-ink)] sm:px-8"><div className="mx-auto max-w-screen-2xl"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-[var(--iv-muted)]">{template.name} · {invitation.type}</p><h1 className="mt-1 text-2xl font-semibold">{invitation.title}</h1></div><Link href="/dashboard" className="rounded-lg border border-[var(--iv-gold-soft)] px-4 py-2 text-sm hover:bg-[var(--iv-cream)]">Dashboard</Link></div><InvitationManagement invitation={invitation} guests={guests} onGuestsChange={setGuests} onInvitationChange={setInvitation} /><section className="mx-auto mt-12 max-w-4xl"><h2 className="mb-4 text-lg font-semibold">Invitation preview</h2><div className="overflow-hidden rounded-2xl shadow-2xl"><Invitation {...invitation.customData} /></div></section></div></main>;
}

import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { PublicInvitationPage } from '@/components/invitations/public-invitation-page';
import { resolveGuestLink } from '@/lib/links';
import { dbAdapter } from '@/lib/db';
import { allowRateLimit } from '@/lib/rate-limit';

function notFoundPage() {
  return <main className="iv-state-page"><div className="iv-state-icon" aria-hidden="true">✉</div><p className="iv-kicker">Invitely</p><h1>Invitation not available</h1><p>This invitation link may be incorrect or no longer available. Please check the link or contact your host.</p></main>;
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const guest = dbAdapter.getGuestByCode(code);
  const invitation = guest && !guest.revoked ? dbAdapter.getInvitation(guest.invitationId) : null;
  if (!guest || !invitation || invitation.status !== 'published') return {
    title: 'Invitation not available',
    description: 'This invitation link may be incorrect or no longer available.',
    robots: { index: false, follow: false },
    openGraph: { title: 'Invitation not available', description: 'This invitation link may be incorrect or no longer available.', type: 'website' },
    twitter: { card: 'summary_large_image', title: 'Invitation not available', description: 'This invitation link may be incorrect or no longer available.' },
  };
  const eventTitle = invitation.customData.eventTitle || invitation.title;
  const title = `${guest.name}, you're invited to ${eventTitle}`;
  const description = [invitation.customData.date, invitation.customData.venue].filter(Boolean).join(' · ');
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: 'website', url: `/s/${encodeURIComponent(code)}` },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const requestHeaders = await headers();
  if (!allowRateLimit(requestHeaders, 'guest-link-page', 60)) return notFoundPage();
  const resolved = resolveGuestLink(code);
  if (!resolved) return notFoundPage();
  const invitation = { id: resolved.invitation.id, slug: resolved.invitation.slug, title: resolved.invitation.title, templateId: resolved.invitation.templateId, customData: resolved.invitation.customData };
  const guest = {
    id: resolved.guest.id, name: resolved.guest.name, rsvpStatus: resolved.guest.rsvpStatus,
    partySize: resolved.guest.partySize, rsvpMessage: resolved.guest.rsvpMessage,
    maxPartySize: resolved.guest.maxPartySize, openedAt: resolved.guest.openedAt, respondedAt: resolved.guest.respondedAt,
  };
  return <PublicInvitationPage invitation={invitation} guest={guest} />;
}

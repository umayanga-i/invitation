import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { PublicInvitationPage } from '@/components/invitations/public-invitation-page';
import { resolveCommonLink } from '@/lib/links';
import { dbAdapter } from '@/lib/db';
import { allowRateLimit } from '@/lib/rate-limit';

function notFoundPage() {
  return <main className="iv-state-page"><div className="iv-state-icon" aria-hidden="true">✉</div><p className="iv-kicker">Invitely</p><h1>Invitation not available</h1><p>This invitation link may be incorrect or no longer available. Please check the link or contact your host.</p></main>;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const requestHeaders = await headers();
  if (!allowRateLimit(requestHeaders, 'common-link-page', 60)) return notFoundPage();
  const invitation = resolveCommonLink(slug);
  if (!invitation) return notFoundPage();
  const publicInvitation = { id: invitation.id, slug: invitation.slug, title: invitation.title, templateId: invitation.templateId, customData: invitation.customData };
  return <PublicInvitationPage invitation={publicInvitation} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const invitation = dbAdapter.getInvitationBySlug(slug);
  if (!invitation || invitation.status !== 'published') return {
    title: 'Invitation not available',
    description: 'This invitation link may be incorrect or no longer available.',
    robots: { index: false, follow: false },
    openGraph: { title: 'Invitation not available', description: 'This invitation link may be incorrect or no longer available.', type: 'website' },
  };
  const { hostNames, eventTitle, date, venue } = invitation.customData;
  const title = eventTitle || invitation.title;
  const description = [date, venue].filter(Boolean).join(' · ') || `${hostNames} invite you to celebrate.`;
  return {
    title,
    description,
    alternates: { canonical: `/i/${encodeURIComponent(invitation.slug)}` },
    openGraph: { title, description, type: 'website', url: `/i/${encodeURIComponent(invitation.slug)}` },
    twitter: { card: 'summary_large_image', title, description },
  };
}

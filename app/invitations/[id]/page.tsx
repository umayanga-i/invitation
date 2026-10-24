import { InvitationDetailPage } from '@/components/invitations/invitation-detail-page';
import { headers } from 'next/headers';
import { isAuthFailure, requireInvitationOwner } from '@/lib/api-auth';
import { dbAdapter } from '@/lib/db';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invitation = dbAdapter.getInvitation(id);
  const requestHeaders = await headers();
  const request = new Request('http://localhost', { headers: { cookie: requestHeaders.get('cookie') ?? '' } });
  const owner = requireInvitationOwner(request, id);
  if (!invitation || isAuthFailure(owner)) {
    return <main className="iv-state-page"><span className="iv-state-icon" aria-hidden="true">✉</span><h1>Invitation not found</h1><a className="iv-state-link" href="/dashboard">Return to dashboard</a></main>;
  }
  return <InvitationDetailPage invitationId={id} />;
}

import type { Metadata } from 'next';
import { InvitationEditPage } from '@/components/invitations/invitation-edit-page';

export const metadata: Metadata = {
  title: 'Edit Invitation',
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvitationEditPage invitationId={id} />;
}

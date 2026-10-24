import type { Metadata } from 'next';
import { InvitationListPage } from '@/components/invitations/invitation-list-page';

export const metadata: Metadata = {
  title: 'My Invitations',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <InvitationListPage />;
}

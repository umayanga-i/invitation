import { dbAdapter } from '@/lib/db';
import { invitationSocialImage, SOCIAL_IMAGE_SIZE } from '@/lib/invitation-social';

export const alt = 'Personal invitation preview';
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const guest = dbAdapter.getGuestByCode(code);
  const invitation = guest && !guest.revoked ? dbAdapter.getInvitation(guest.invitationId) : null;
  if (!guest || !invitation || invitation.status !== 'published') {
    return invitationSocialImage({ title: 'Invitation not available', eyebrow: 'Invitation link unavailable' });
  }
  const eventTitle = invitation.customData.eventTitle || invitation.title;
  return invitationSocialImage({
    title: eventTitle,
    eyebrow: `${guest.name}, you're invited`,
    date: invitation.customData.date,
    venue: invitation.customData.venue,
    colors: invitation.customData.colors,
  });
}

import { dbAdapter } from '@/lib/db';
import { invitationSocialImage, SOCIAL_IMAGE_SIZE } from '@/lib/invitation-social';

export const alt = 'Invitation preview';
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const invitation = dbAdapter.getInvitationBySlug(slug);
  if (!invitation || invitation.status !== 'published') {
    return invitationSocialImage({ title: 'Invitation not available', eyebrow: 'Invitation link unavailable' });
  }
  return invitationSocialImage({
    title: invitation.customData.eventTitle || invitation.title,
    eyebrow: `${invitation.customData.hostNames || 'You are invited'} invite you to celebrate`,
    date: invitation.customData.date,
    venue: invitation.customData.venue,
    colors: invitation.customData.colors,
  });
}

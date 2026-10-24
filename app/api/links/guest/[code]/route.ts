import { resolveGuestLink } from '@/lib/links';
import { apiErrorResponse } from '@/lib/api-errors';
import { allowRateLimit, rateLimitedResponse } from '@/lib/rate-limit';

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    if (!allowRateLimit(request.headers, 'guest-link', 30)) return rateLimitedResponse();
    const { code } = await params;
    const result = resolveGuestLink(code);
    return result ? Response.json({
      guest: {
        id: result.guest.id, name: result.guest.name, rsvpStatus: result.guest.rsvpStatus,
        partySize: result.guest.partySize, rsvpMessage: result.guest.rsvpMessage,
        maxPartySize: result.guest.maxPartySize, openedAt: result.guest.openedAt, respondedAt: result.guest.respondedAt,
      },
      invitation: {
        id: result.invitation.id, slug: result.invitation.slug, title: result.invitation.title,
        templateId: result.invitation.templateId, customData: result.invitation.customData,
      },
    }) : Response.json({ error: 'Invitation not found.' }, { status: 404 });
  } catch (error) { return apiErrorResponse('GET /api/links/guest/[code]', error, 'Could not resolve this invitation link.'); }
}

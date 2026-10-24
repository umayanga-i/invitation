import { dbAdapter } from '@/lib/db';
import { apiErrorResponse } from '@/lib/api-errors';
import { allowRateLimit, rateLimitedResponse } from '@/lib/rate-limit';
import { getPartyLimit, isRsvpClosed } from '@/lib/rsvp-rules';
import { validateRsvp } from '@/lib/api-validation';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!allowRateLimit(request.headers, 'guest-rsvp', 5)) return rateLimitedResponse();
    const { id } = await params;
    const guest = dbAdapter.getGuest(id);
    if (!guest || guest.revoked) return Response.json({ error: 'Invitation not found.' }, { status: 404 });
    const invitation = dbAdapter.getInvitation(guest.invitationId);
    if (!invitation || invitation.status !== 'published') return Response.json({ error: 'Invitation not found.' }, { status: 404 });
    if (isRsvpClosed(invitation.customData.rsvpDeadline)) return Response.json({ error: 'RSVP closed.' }, { status: 409 });
    const partyLimit = getPartyLimit(invitation.customData.maxPartySize, guest.maxPartySize);
    const body = await request.json() as unknown;
    const invalid = validateRsvp(body, partyLimit);
    if (invalid) return Response.json({ error: invalid }, { status: 400 });
    const validBody = body as { rsvpStatus: 'attending' | 'not_attending' | 'maybe'; partySize?: number; rsvpMessage?: string };
    const updated = dbAdapter.updateGuest(id, { rsvpStatus: validBody.rsvpStatus, partySize: validBody.partySize ?? 0, rsvpMessage: validBody.rsvpMessage?.trim() || undefined, respondedAt: new Date().toISOString() });
    return updated ? Response.json(updated) : Response.json({ error: 'Invitation not found.' }, { status: 404 });
  } catch (error) {
    const invalidJson = error instanceof SyntaxError;
    return apiErrorResponse('POST /api/guests/[id]/rsvp', error, invalidJson ? 'Request body must be valid JSON.' : 'Could not save your RSVP.', invalidJson ? 400 : 500);
  }
}

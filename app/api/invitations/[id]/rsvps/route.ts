import { dbAdapter } from '@/lib/db';
import { createGuestLink } from '@/lib/links';
import { apiErrorResponse } from '@/lib/api-errors';
import { allowRateLimit, rateLimitedResponse } from '@/lib/rate-limit';
import { getPartyLimit, isRsvpClosed } from '@/lib/rsvp-rules';
import { validateRsvp } from '@/lib/api-validation';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!allowRateLimit(request.headers, 'common-rsvp', 5)) return rateLimitedResponse();
    const { id } = await params;
    const invitation = dbAdapter.getInvitation(id);
    if (!invitation || invitation.status !== 'published') return Response.json({ error: 'Invitation not found.' }, { status: 404 });
    if (isRsvpClosed(invitation.customData.rsvpDeadline)) return Response.json({ error: 'RSVP closed.' }, { status: 409 });
    const partyLimit = getPartyLimit(invitation.customData.maxPartySize);
    const body = await request.json() as unknown;
    const invalid = validateRsvp(body, partyLimit, true);
    if (invalid) return Response.json({ error: invalid }, { status: 400 });
    const validBody = body as { name: string; phone?: string; email?: string; rsvpStatus: 'attending' | 'not_attending' | 'maybe'; partySize?: number; rsvpMessage?: string };
    const guest = dbAdapter.insertGuest(id, { name: validBody.name.trim(), phone: validBody.phone?.trim() ?? '', email: validBody.email?.trim() });
    createGuestLink(guest.id);
    const updated = dbAdapter.updateGuest(guest.id, { rsvpStatus: validBody.rsvpStatus, partySize: validBody.partySize ?? 0, rsvpMessage: validBody.rsvpMessage?.trim() || undefined, respondedAt: new Date().toISOString() });
    return Response.json(updated, { status: 201 });
  } catch (error) {
    const invalidJson = error instanceof SyntaxError;
    return apiErrorResponse('POST /api/invitations/[id]/rsvps', error, invalidJson ? 'Request body must be valid JSON.' : 'Could not save your RSVP.', invalidJson ? 400 : 500);
  }
}

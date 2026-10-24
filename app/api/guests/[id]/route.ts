import { dbAdapter } from '@/lib/db';
import { apiErrorResponse } from '@/lib/api-errors';
import { isAuthFailure, requireGuestOwner } from '@/lib/api-auth';
import { validateGuestPatch } from '@/lib/api-validation';
import { getPartyLimit } from '@/lib/rsvp-rules';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const owner = requireGuestOwner(request, id);
    if (isAuthFailure(owner)) return owner;
    const body = await request.json() as unknown;
    const currentGuest = dbAdapter.getGuest(id);
    const invitation = currentGuest ? dbAdapter.getInvitation(currentGuest.invitationId) : null;
    if (!currentGuest || !invitation) return Response.json({ error: 'Guest not found.' }, { status: 404 });
    const invalid = validateGuestPatch(body, getPartyLimit(invitation.customData.maxPartySize));
    if (invalid) return Response.json({ error: invalid }, { status: 400 });
    const guestBody = body as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    for (const key of ['name', 'phone', 'email', 'revoked'] as const) if (key in guestBody) patch[key] = guestBody[key];
    if ('maxPartySize' in guestBody) {
      if (guestBody.maxPartySize != null && Number(guestBody.maxPartySize) > (invitation.customData.maxPartySize ?? 6)) return Response.json({ error: 'A guest limit cannot exceed the invitation limit.' }, { status: 400 });
      patch.maxPartySize = guestBody.maxPartySize == null ? undefined : Number(guestBody.maxPartySize);
    }
    const updatedGuest = dbAdapter.updateGuest(id, patch);
    return updatedGuest ? Response.json(updatedGuest) : Response.json({ error: 'Guest not found.' }, { status: 404 });
  } catch (error) {
    const invalidJson = error instanceof SyntaxError;
    return apiErrorResponse('PATCH /api/guests/[id]', error, invalidJson ? 'Request body must be valid JSON.' : 'Could not update the guest.', invalidJson ? 400 : 500);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const owner = requireGuestOwner(request, id);
    if (isAuthFailure(owner)) return owner;
    return dbAdapter.deleteGuest(id) ? new Response(null, { status: 204 }) : Response.json({ error: 'Guest not found.' }, { status: 404 });
  } catch (error) { return apiErrorResponse('DELETE /api/guests/[id]', error, 'Could not delete the guest.'); }
}

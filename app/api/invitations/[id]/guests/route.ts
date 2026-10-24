import { dbAdapter, type NewGuest } from '@/lib/db';
import { createGuestLink } from '@/lib/links';
import { apiErrorResponse } from '@/lib/api-errors';
import { isAuthFailure, requireInvitationOwner } from '@/lib/api-auth';
import { getPartyLimit } from '@/lib/rsvp-rules';
import { isRecord, validateGuestInput } from '@/lib/api-validation';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const owner = requireInvitationOwner(_request, id);
    if (isAuthFailure(owner)) return owner;
    const invitation = dbAdapter.getInvitation(id);
    if (!invitation) return Response.json({ error: 'Invitation not found.' }, { status: 404 });
    return Response.json(dbAdapter.getGuests(id));
  } catch (error) { return apiErrorResponse('GET /api/invitations/[id]/guests', error, 'Could not load guests.'); }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const owner = requireInvitationOwner(request, id);
    if (isAuthFailure(owner)) return owner;
    const invitation = dbAdapter.getInvitation(id);
    if (!invitation) return Response.json({ error: 'Invitation not found.' }, { status: 404 });
    const body = await request.json() as unknown;
    if (!isRecord(body)) return Response.json({ error: 'Guest request must be an object.' }, { status: 400 });
    const single = 'input' in body;
    const inputs = single ? [body.input] : body.inputs;
    if (!Array.isArray(inputs) || !inputs.length) return Response.json({ error: 'Provide at least one guest with a name.' }, { status: 400 });
    if (inputs.length > 100) return Response.json({ error: 'A guest batch cannot exceed 100 rows.' }, { status: 400 });
    const limit = getPartyLimit(invitation.customData.maxPartySize);
    for (const [index, input] of inputs.entries()) {
      const invalid = validateGuestInput(input, limit);
      if (invalid) return Response.json({ error: `Guest row ${index + 1}: ${invalid}` }, { status: 400 });
    }
    const guests = (inputs as NewGuest[]).map((input) => {
      const guest = dbAdapter.insertGuest(id, input);
      createGuestLink(guest.id);
      return dbAdapter.getGuest(guest.id)!;
    });
    return Response.json(single ? guests[0] : guests, { status: 201 });
  } catch (error) {
    const invalidJson = error instanceof SyntaxError;
    return apiErrorResponse('POST /api/invitations/[id]/guests', error, invalidJson ? 'Request body must be valid JSON.' : 'Could not add guests.', invalidJson ? 400 : 500);
  }
}

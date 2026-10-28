import { dbAdapter } from '@/lib/db';
import { apiErrorResponse } from '@/lib/api-errors';
import { isAuthFailure, requireInvitationOwner } from '@/lib/api-auth';
import { isRecord, validateInvitationCustomData } from '@/lib/api-validation';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const owner = requireInvitationOwner(_request, id);
    if (isAuthFailure(owner)) return owner;
    const invitation = dbAdapter.getInvitation(id);
    return invitation ? Response.json(invitation) : Response.json({ error: 'Invitation not found.' }, { status: 404 });
  } catch (error) { return apiErrorResponse('GET /api/invitations/[id]', error, 'Could not load the invitation.'); }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const owner = requireInvitationOwner(request, id);
    if (isAuthFailure(owner)) return owner;
    const body = await request.json() as unknown;
    if (!isRecord(body) ||
      ('title' in body && (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 160)) ||
      ('templateId' in body && (typeof body.templateId !== 'string' || !body.templateId.trim() || body.templateId.length > 100)) ||
      ('type' in body && !['common', 'personal'].includes(String(body.type))) ||
      ('status' in body && !['draft', 'published', 'archived'].includes(String(body.status))) ||
      ('slug' in body && body.slug !== null && (typeof body.slug !== 'string' || body.slug.length > 200)) ||
      ('customData' in body && !validateInvitationCustomData(body.customData)) ||
      ('userId' in body && body.userId !== owner.id)) {
      return Response.json({ error: 'Invalid invitation update. Check field types and maximum lengths.' }, { status: 400 });
    }
    const patch = Object.fromEntries(['title', 'templateId', 'type', 'status', 'slug', 'customData'].filter((key) => key in body).map((key) => [key, body[key]]));
    const updated = dbAdapter.updateInvitation(id, patch);
    return updated ? Response.json(updated) : Response.json({ error: 'Invitation not found.' }, { status: 404 });
  } catch (error) {
    const invalidJson = error instanceof SyntaxError;
    return apiErrorResponse('PATCH /api/invitations/[id]', error, invalidJson ? 'Request body must be valid JSON.' : 'Could not update the invitation.', invalidJson ? 400 : 500);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const owner = requireInvitationOwner(request, id);
    if (isAuthFailure(owner)) return owner;
    return dbAdapter.deleteInvitation(id)
      ? new Response(null, { status: 204 })
      : Response.json({ error: 'Invitation not found.' }, { status: 404 });
  } catch (error) {
    return apiErrorResponse('DELETE /api/invitations/[id]', error, 'Could not delete the invitation.');
  }
}

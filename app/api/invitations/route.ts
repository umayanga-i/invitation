import { dbAdapter, type NewInvitation } from '@/lib/db';
import { createGuestLink, createInvitationLink } from '@/lib/links';
import { apiErrorResponse } from '@/lib/api-errors';
import { isAuthFailure, requireApiUser } from '@/lib/api-auth';
import { isRecord, validateInvitationCustomData } from '@/lib/api-validation';
import { canUseTemplate } from '@/lib/server/admin';

export async function GET(request: Request) {
  try {
    const user = requireApiUser(request);
    if (isAuthFailure(user)) return user;
    const invitations = dbAdapter.listInvitations(user.id).map((invitation) => {
      const guests = dbAdapter.getGuests(invitation.id);
      return {
        ...invitation,
        guestCount: guests.length,
        rsvpCount: guests.filter((guest) => guest.rsvpStatus !== 'pending').length,
      };
    });
    return Response.json(invitations);
  } catch (error) { return apiErrorResponse('GET /api/invitations', error, 'Could not load invitations.'); }
}

export async function POST(request: Request) {
  try {
    const user = requireApiUser(request);
    if (isAuthFailure(user)) return user;
    const input = await request.json() as unknown;
    if (!isRecord(input) || typeof input.title !== 'string' || !input.title.trim() || input.title.length > 160 ||
      typeof input.templateId !== 'string' || !input.templateId.trim() || input.templateId.length > 100 ||
      typeof input.userId !== 'string' || !validateInvitationCustomData(input.customData) ||
      !['common', 'personal'].includes(String(input.type))) {
      return Response.json({ error: 'Invalid invitation data. Check required fields and maximum lengths.' }, { status: 400 });
    }
    if (input.userId !== user.id) return Response.json({ error: 'You cannot create an invitation for another user.' }, { status: 403 });
    const setting = dbAdapter.listTemplateSettings().find((template) => template.id === input.templateId);
    if (setting && !setting.enabled) return Response.json({ error: 'This template is currently unavailable.' }, { status: 404 });
    const account = dbAdapter.getAdminUser(user.id);
    if (setting?.tier === 'pro' && !canUseTemplate(account, setting.tier)) return Response.json({ error: 'Upgrade to Pro to use this template.' }, { status: 403 });
    const invitation = dbAdapter.insertInvitation(input as unknown as NewInvitation);
    createInvitationLink(invitation.id);
    const created = dbAdapter.getInvitation(invitation.id)!;
    if (input.type === 'personal' && input.customData.guestName?.trim()) {
      const guest = dbAdapter.insertGuest(invitation.id, { name: input.customData.guestName, phone: '' });
      createGuestLink(guest.id);
    }
    return Response.json(created, { status: 201 });
  } catch (error) {
    const invalidJson = error instanceof SyntaxError;
    return apiErrorResponse('POST /api/invitations', error, invalidJson ? 'Request body must be valid JSON.' : 'Could not save the invitation.', invalidJson ? 400 : 500);
  }
}

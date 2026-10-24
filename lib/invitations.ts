// Client-side invitation API. All invitation and guest persistence lives in server routes + lib/db.
import type { Guest, Invitation, RsvpStatus } from './mock-data';

export interface CreateInvitationInput {
  title: string; templateId: string; userId: string; type: 'common' | 'personal';
  customData: Invitation['customData']; slug?: string;
}
export interface AddGuestInput { name: string; phone: string; email?: string; maxPartySize?: number }
export interface RsvpInput { rsvpStatus: RsvpStatus; partySize?: number; rsvpMessage?: string }
export interface CommonRsvpInput extends AddGuestInput, RsvpInput {}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { 'content-type': 'application/json', ...init?.headers } });
  if (!response.ok) {
    const text = await response.text().catch((cause) => `Unable to read response body: ${String(cause)}`);
    throw new Error(`API ${response.status} ${response.url || path}: ${text || '(empty response body)'}`);
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}
const json = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

export function normalizeSriLankanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (/^947\d{8}$/.test(digits)) return digits;
  if (/^07\d{8}$/.test(digits)) return `94${digits.slice(1)}`;
  if (/^7\d{8}$/.test(digits)) return `94${digits}`;
  if (/^94\d{9}$/.test(digits)) return digits;
  return phone.trim();
}
export const getCommonInvitationUrl = (invitation: Invitation): string => `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/i/${encodeURIComponent(invitation.slug)}`;
export const getGuestInvitationUrl = (guest: Guest): string => `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/s/${encodeURIComponent(guest.code || guest.personalToken)}`;

export const listInvitations = (userId: string): Promise<Invitation[]> => api(`/api/invitations?userId=${encodeURIComponent(userId)}`);
export const getInvitation = (id: string): Promise<Invitation | null> => api(`/api/invitations/${encodeURIComponent(id)}`);
export const getInvitationBySlug = (slug: string): Promise<Invitation | null> => api(`/api/links/common/${encodeURIComponent(slug)}`);
export const createInvitation = (data: CreateInvitationInput): Promise<Invitation> => api('/api/invitations', json(data));
export const updateInvitation = (id: string, data: Partial<Omit<Invitation, 'id' | 'createdAt'>>): Promise<Invitation> => api(`/api/invitations/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteInvitation = (id: string): Promise<void> => api(`/api/invitations/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const getGuests = (invitationId: string): Promise<Guest[]> => api(`/api/invitations/${encodeURIComponent(invitationId)}/guests`);
export const addGuest = (invitationId: string, input: AddGuestInput): Promise<Guest> => api(`/api/invitations/${encodeURIComponent(invitationId)}/guests`, json({ input }));
export async function addGuests(invitationId: string, inputs: AddGuestInput[]): Promise<Guest[]> {
  const path = `/api/invitations/${encodeURIComponent(invitationId)}/guests`;
  const created: Guest[] = [];
  for (let index = 0; index < inputs.length; index += 100) {
    const batch = inputs.slice(index, index + 100);
    created.push(...await api<Guest[]>(path, json({ inputs: batch })));
  }
  return created;
}
export const updateGuest = (guestId: string, data: Partial<Guest>): Promise<Guest> => api(`/api/guests/${encodeURIComponent(guestId)}`, { method: 'PATCH', body: JSON.stringify(data) });
export const revokeGuestLink = (guestId: string): Promise<Guest> => updateGuest(guestId, { revoked: true });
export const deleteGuest = (guestId: string): Promise<void> => api(`/api/guests/${encodeURIComponent(guestId)}`, { method: 'DELETE' });
export async function getGuestByToken(code: string): Promise<Guest | null> {
  const result = await api<{ guest: Guest } | null>(`/api/links/guest/${encodeURIComponent(code)}`);
  return result?.guest ?? null;
}
export const submitRsvp = (guestId: string, rsvp: RsvpInput): Promise<Guest> => api(`/api/guests/${encodeURIComponent(guestId)}/rsvp`, json(rsvp));
export const submitCommonRsvp = (invitationId: string, rsvp: CommonRsvpInput): Promise<Guest> => api(`/api/invitations/${encodeURIComponent(invitationId)}/rsvps`, json(rsvp));

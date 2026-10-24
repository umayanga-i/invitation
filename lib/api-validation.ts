import type { InvitationCustomData } from './mock-data';
import { GOLDEN_PHOTO_SLOTS } from './wedding-golden';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, max: number, required = false): boolean {
  return typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0);
}

export function validateGuestInput(value: unknown, invitationLimit: number): string | null {
  if (!isRecord(value)) return 'Guest data must be an object.';
  if (!text(value.name, 100, true)) return 'Guest name is required and must be 100 characters or fewer.';
  if (value.phone !== undefined && !text(value.phone, 20)) return 'Phone must be 20 characters or fewer.';
  if (value.email !== undefined && value.email !== '' && (!text(value.email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value.email)))) return 'Enter a valid email address of 254 characters or fewer.';
  if (value.maxPartySize !== undefined && (!Number.isInteger(value.maxPartySize) || Number(value.maxPartySize) < 1 || Number(value.maxPartySize) > invitationLimit)) return `Guest party-size limit must be between 1 and ${invitationLimit}.`;
  return null;
}

export function validateGuestPatch(value: unknown, invitationLimit: number): string | null {
  if (!isRecord(value)) return 'Guest update must be an object.';
  if ('name' in value && !text(value.name, 100, true)) return 'Guest name is required and must be 100 characters or fewer.';
  if ('phone' in value && !text(value.phone, 20)) return 'Phone must be 20 characters or fewer.';
  if ('email' in value && value.email !== undefined && value.email !== '' && (!text(value.email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value.email)))) return 'Enter a valid email address of 254 characters or fewer.';
  if ('revoked' in value && typeof value.revoked !== 'boolean') return 'Revoked must be true or false.';
  if (value.maxPartySize !== undefined && value.maxPartySize !== null && (!Number.isInteger(value.maxPartySize) || Number(value.maxPartySize) < 1 || Number(value.maxPartySize) > invitationLimit)) return `Guest party-size limit must be between 1 and ${invitationLimit}.`;
  return null;
}

export function validateRsvp(value: unknown, partyLimit: number, common = false): string | null {
  if (!isRecord(value)) return 'RSVP data must be an object.';
  if (!['attending', 'not_attending', 'maybe'].includes(String(value.rsvpStatus))) return 'Choose a valid RSVP response.';
  if (value.rsvpStatus === 'attending' && (!Number.isInteger(value.partySize) || Number(value.partySize) < 1 || Number(value.partySize) > partyLimit)) return `Party size must be between 1 and ${partyLimit}.`;
  if (value.rsvpStatus !== 'attending' && value.partySize !== undefined && (!Number.isInteger(value.partySize) || Number(value.partySize) !== 0)) return 'Party size must be zero unless attending.';
  if (value.rsvpMessage !== undefined && !text(value.rsvpMessage, 1000)) return 'RSVP message must be 1000 characters or fewer.';
  if (common) {
    if (!text(value.name, 100, true)) return 'Name is required and must be 100 characters or fewer.';
    const guestError = validateGuestInput({ name: value.name, phone: value.phone, email: value.email }, partyLimit);
    if (guestError) return guestError;
  }
  return null;
}

export function validateInvitationCustomData(value: unknown): value is InvitationCustomData {
  if (!isRecord(value)) return false;
  const limits: Record<string, number> = { hostNames: 100, eventTitle: 160, date: 10, time: 10, venue: 250, message: 1000, guestName: 100, rsvpDeadline: 10, mapLink: 2048, photo: 1_000_000 };
  for (const [key, max] of Object.entries(limits)) if (key in value && !text(value[key], max)) return false;
  for (const key of ['hostNames', 'eventTitle', 'date', 'time', 'venue', 'message']) if (!text(value[key], limits[key], key === 'hostNames' || key === 'eventTitle')) return false;
  if (!isRecord(value.colors)) return false;
  const colors = value.colors;
  if (!['primary', 'secondary', 'accent'].every((key) => typeof colors[key] === 'string' && /^#[0-9a-fA-F]{6}$/.test(String(colors[key])))) return false;
  if (value.maxPartySize !== undefined && (!Number.isInteger(value.maxPartySize) || Number(value.maxPartySize) < 1 || Number(value.maxPartySize) > 50)) return false;
  if (value.photos !== undefined) {
    if (!isRecord(value.photos)) return false;
    let totalSize = 0;
    for (const [slot, photo] of Object.entries(value.photos)) {
      if (!(GOLDEN_PHOTO_SLOTS as readonly string[]).includes(slot) || !text(photo, 1_000_000, true)) return false;
      if (!/^(?:data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/=]+|https?:\/\/\S+)$/.test(String(photo))) return false;
      totalSize += String(photo).length;
    }
    if (totalSize > 6_000_000) return false;
  }
  if (value.weddingDetails !== undefined) {
    if (!isRecord(value.weddingDetails)) return false;
    const details = value.weddingDetails;
    for (const field of ['firstParents', 'secondParents', 'storyTitle', 'venueAddress']) if (!text(details[field], 250)) return false;
    for (const field of ['firstPhone', 'secondPhone']) if (!text(details[field], 30)) return false;
    if (!Array.isArray(details.events) || details.events.length !== 4) return false;
    for (const event of details.events) {
      if (!isRecord(event) || !text(event.title, 100, true) || !text(event.venue, 250) || typeof event.time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(event.time)) return false;
    }
  }
  return true;
}

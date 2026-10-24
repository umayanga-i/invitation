import 'server-only';
import { customAlphabet } from 'nanoid';
import { dbAdapter } from '@/lib/db';
import type { Guest, Invitation } from '@/lib/mock-data';

const randomCode = customAlphabet('23456789abcdefghjkmnpqrstuvwxyz');

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '') || 'invitation';
}

export function createInvitationLink(invitationId: string): { slug: string } {
  const invitation = dbAdapter.getInvitation(invitationId);
  if (!invitation) throw new Error('Invitation not found.');
  if (invitation.slug) return { slug: invitation.slug };

  const base = slugify(invitation.title);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const slug = `${base}-${randomCode(4)}`;
    if (dbAdapter.getInvitationBySlug(slug)) continue;
    try {
      dbAdapter.setInvitationSlug(invitationId, slug);
      return { slug };
    } catch {
      // A concurrent request may have claimed this UNIQUE slug; generate another.
    }
  }
  throw new Error('Could not allocate a unique invitation slug. Try again.');
}

export function createGuestLink(guestId: string): { code: string } {
  const guest = dbAdapter.getGuest(guestId);
  if (!guest) throw new Error('Guest not found.');
  if (guest.code) return { code: guest.code };

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = randomCode(8);
    try {
      dbAdapter.setGuestCode(guestId, code);
      return { code };
    } catch {
      // A concurrent request may have claimed this UNIQUE code; generate another.
    }
  }
  throw new Error('Could not allocate a unique guest code. Try again.');
}

export function resolveCommonLink(slug: string): Invitation | null {
  const invitation = dbAdapter.getInvitationBySlug(slug);
  return invitation?.status === 'published' ? invitation : null;
}

export function resolveGuestLink(code: string): { guest: Guest; invitation: Invitation } | null {
  const foundGuest = dbAdapter.getGuestByCode(code);
  if (!foundGuest || foundGuest.revoked) return null;
  const invitation = dbAdapter.getInvitation(foundGuest.invitationId);
  if (!invitation || invitation.status !== 'published') return null;
  const guest = dbAdapter.markGuestOpened(foundGuest.id);
  return guest ? { guest, invitation } : null;
}

import 'server-only';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { customAlphabet, nanoid } from 'nanoid';
import {
  HARDCODED_GUESTS,
  HARDCODED_INVITATIONS,
  type Guest,
  type Invitation,
  type InvitationCustomData,
  type RsvpStatus,
} from '@/lib/mock-data';

type SqlValue = string | number | null;
type SqlStatement = {
  run: (...values: SqlValue[]) => { changes: number };
  get: (...values: SqlValue[]) => Record<string, unknown> | undefined;
  all: (...values: SqlValue[]) => Record<string, unknown>[];
};
type SqlDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => SqlStatement;
};

// The adapter boundary is this file: replace its SQLite implementation with Supabase/Postgres calls later.
// TODO(supabase): replace each statement below with a query against the supplied invitations/guests schema.
const dataPath = process.env.INVITATION_DB_PATH ?? join(process.cwd(), 'data', 'dev.db');
mkdirSync(dirname(dataPath), { recursive: true });
const db: SqlDatabase = new DatabaseSync(dataPath);
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA busy_timeout = 5000;');
db.exec(`
  CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    template_id TEXT NOT NULL,
    data TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('common', 'personal')),
    slug TEXT UNIQUE,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft'
  );
  CREATE TABLE IF NOT EXISTS guests (
    id TEXT PRIMARY KEY,
    invitation_id TEXT NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    email TEXT,
    code TEXT UNIQUE,
    rsvp_status TEXT NOT NULL DEFAULT 'pending',
    party_size INTEGER,
    rsvp_message TEXT,
    max_party_size INTEGER,
    opened_at TEXT,
    responded_at TEXT,
    revoked INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS guests_invitation_id_idx ON guests(invitation_id);
`);

const guestColumns = db.prepare('PRAGMA table_info(guests)').all();
if (!guestColumns.some((column) => column.name === 'max_party_size')) {
  db.exec('ALTER TABLE guests ADD COLUMN max_party_size INTEGER');
}

const alphabet = '23456789abcdefghjkmnpqrstuvwxyz';
const makeSeedCode = customAlphabet(alphabet, 8);

function slugBase(title: string): string {
  return title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '') || 'invitation';
}

function seedSlug(title: string): string {
  const base = slugBase(title);
  for (;;) {
    const slug = `${base}-${customAlphabet(alphabet, 4)()}`;
    if (!db.prepare('SELECT 1 FROM invitations WHERE slug = ?').get(slug)) return slug;
  }
}

function seedGuestCode(): string {
  for (;;) {
    const code = makeSeedCode();
    if (!db.prepare('SELECT 1 FROM guests WHERE code = ?').get(code)) return code;
  }
}

function seedMockRows(): void {
  if (Number(db.prepare('SELECT COUNT(*) AS count FROM invitations').get()?.count ?? 0) > 0) return;
  const insertInvitation = db.prepare('INSERT OR IGNORE INTO invitations (id, owner_id, template_id, data, type, slug, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const invitation of HARDCODED_INVITATIONS) {
    insertInvitation.run(invitation.id, invitation.userId, invitation.templateId, JSON.stringify({ title: invitation.title, customData: invitation.customData }), invitation.type, seedSlug(invitation.title), invitation.createdAt, invitation.status);
  }
  const insertGuest = db.prepare('INSERT OR IGNORE INTO guests (id, invitation_id, name, phone, email, code, rsvp_status, party_size, rsvp_message, opened_at, responded_at, revoked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)');
  for (const guest of HARDCODED_GUESTS) {
    insertGuest.run(guest.id, guest.invitationId, guest.name, guest.phone, guest.email ?? null, seedGuestCode(), guest.rsvpStatus, guest.partySize ?? null, guest.rsvpMessage ?? null, guest.openedAt ?? null, guest.respondedAt ?? null);
  }
}

seedMockRows();

function asInvitation(row: Record<string, unknown> | undefined): Invitation | null {
  if (!row) return null;
  const data = JSON.parse(String(row.data)) as { title: string; customData: InvitationCustomData };
  return {
    id: String(row.id), userId: String(row.owner_id), templateId: String(row.template_id),
    title: data.title, customData: data.customData, type: row.type as Invitation['type'],
    slug: String(row.slug ?? ''), createdAt: String(row.created_at), status: row.status as Invitation['status'],
  };
}

function asGuest(row: Record<string, unknown> | undefined): Guest | null {
  if (!row) return null;
  const code = String(row.code ?? '');
  return {
    id: String(row.id), invitationId: String(row.invitation_id), name: String(row.name), phone: String(row.phone ?? ''),
    email: row.email == null ? undefined : String(row.email), code, personalToken: code,
    rsvpStatus: row.rsvp_status as RsvpStatus, partySize: row.party_size == null ? undefined : Number(row.party_size),
    rsvpMessage: row.rsvp_message == null ? undefined : String(row.rsvp_message),
    maxPartySize: row.max_party_size == null ? undefined : Number(row.max_party_size),
    openedAt: row.opened_at == null ? undefined : String(row.opened_at),
    respondedAt: row.responded_at == null ? undefined : String(row.responded_at),
    revoked: Number(row.revoked) === 1,
  };
}

export type NewInvitation = { title: string; templateId: string; userId: string; type: Invitation['type']; customData: InvitationCustomData };
export type NewGuest = { name: string; phone: string; email?: string; maxPartySize?: number };

export const dbAdapter = {
  resetMockData(): void {
    db.exec('BEGIN IMMEDIATE;');
    try {
      db.exec('DELETE FROM guests; DELETE FROM invitations;');
      seedMockRows();
      db.exec('COMMIT;');
    } catch (error) {
      db.exec('ROLLBACK;');
      throw error;
    }
  },
  listInvitations(userId: string): Invitation[] {
    return db.prepare('SELECT * FROM invitations WHERE owner_id = ? ORDER BY created_at DESC').all(userId).map((row) => asInvitation(row)!).filter(Boolean);
  },
  getInvitation(id: string): Invitation | null {
    return asInvitation(db.prepare('SELECT * FROM invitations WHERE id = ?').get(id));
  },
  deleteInvitation(id: string): boolean {
    return db.prepare('DELETE FROM invitations WHERE id = ?').run(id).changes > 0;
  },
  getInvitationBySlug(slug: string): Invitation | null {
    return asInvitation(db.prepare('SELECT * FROM invitations WHERE slug = ?').get(slug));
  },
  insertInvitation(input: NewInvitation): Invitation {
    const id = `inv-${nanoid(10)}`;
    const createdAt = new Date().toISOString();
    db.prepare('INSERT INTO invitations (id, owner_id, template_id, data, type, slug, created_at, status) VALUES (?, ?, ?, ?, ?, NULL, ?, ?)')
      .run(id, input.userId, input.templateId, JSON.stringify({ title: input.title, customData: input.customData }), input.type, createdAt, 'draft');
    return this.getInvitation(id)!;
  },
  setInvitationSlug(id: string, slug: string): void {
    db.prepare('UPDATE invitations SET slug = ? WHERE id = ?').run(slug, id);
  },
  updateInvitation(id: string, patch: Partial<Omit<Invitation, 'id' | 'createdAt'>>): Invitation | null {
    const existing = this.getInvitation(id);
    if (!existing) return null;
    const next = { ...existing, ...patch };
    db.prepare('UPDATE invitations SET owner_id = ?, template_id = ?, data = ?, type = ?, slug = ?, status = ? WHERE id = ?')
      .run(next.userId, next.templateId, JSON.stringify({ title: next.title, customData: next.customData }), next.type, next.slug || null, next.status, id);
    return this.getInvitation(id);
  },
  getGuests(invitationId: string): Guest[] {
    return db.prepare('SELECT * FROM guests WHERE invitation_id = ? ORDER BY name COLLATE NOCASE').all(invitationId).map((row) => asGuest(row)!).filter(Boolean);
  },
  getGuest(id: string): Guest | null {
    return asGuest(db.prepare('SELECT * FROM guests WHERE id = ?').get(id));
  },
  getGuestByCode(code: string): Guest | null {
    return asGuest(db.prepare('SELECT * FROM guests WHERE code = ? AND revoked = 0').get(code));
  },
  insertGuest(invitationId: string, input: NewGuest): Guest {
    const id = `guest-${nanoid(10)}`;
    db.prepare('INSERT INTO guests (id, invitation_id, name, phone, email, code, max_party_size) VALUES (?, ?, ?, ?, ?, NULL, ?)')
      .run(id, invitationId, input.name.trim(), input.phone, input.email?.trim() || null, input.maxPartySize ?? null);
    return this.getGuest(id)!;
  },
  setGuestCode(id: string, code: string): void {
    db.prepare('UPDATE guests SET code = ? WHERE id = ?').run(code, id);
  },
  updateGuest(id: string, patch: Partial<Guest>): Guest | null {
    const current = this.getGuest(id);
    if (!current) return null;
    const next = { ...current, ...patch };
    db.prepare('UPDATE guests SET name = ?, phone = ?, email = ?, rsvp_status = ?, party_size = ?, rsvp_message = ?, opened_at = ?, responded_at = ?, revoked = ?, max_party_size = ? WHERE id = ?')
      .run(next.name, next.phone, next.email ?? null, next.rsvpStatus, next.partySize ?? null, next.rsvpMessage ?? null, next.openedAt ?? null, next.respondedAt ?? null, next.revoked ? 1 : 0, next.maxPartySize ?? null, id);
    return this.getGuest(id);
  },
  deleteGuest(id: string): boolean {
    return db.prepare('DELETE FROM guests WHERE id = ?').run(id).changes > 0;
  },
  markGuestOpened(id: string): Guest | null {
    const guest = this.getGuest(id);
    if (!guest) return null;
    if (!guest.openedAt) db.prepare('UPDATE guests SET opened_at = ? WHERE id = ? AND opened_at IS NULL').run(new Date().toISOString(), id);
    return this.getGuest(id);
  },
};

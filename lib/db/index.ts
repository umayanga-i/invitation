import 'server-only';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { customAlphabet, nanoid } from 'nanoid';
import { randomBytes, scryptSync } from 'node:crypto';
import {
  HARDCODED_GUESTS,
  HARDCODED_INVITATIONS,
  HARDCODED_TEMPLATES,
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

export type AdminUser = { id: string; name: string; email: string; phone: string; provider: 'email' | 'google' | 'phone'; role: 'user' | 'admin'; plan: 'free' | 'pro'; plan_until: string | null; status: 'active' | 'suspended'; created_at: string; last_login_at: string | null; admin_notes: string; is_demo: boolean };
export type AuditEntry = { id: string; admin_id: string; action: string; target_type: string; target_id: string; details: string; created_at: string };

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
    status TEXT NOT NULL DEFAULT 'draft',
    is_demo INTEGER NOT NULL DEFAULT 0,
    suspended_reason TEXT,
    last_edited_by_admin INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT
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
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', provider TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', plan TEXT NOT NULL DEFAULT 'free', plan_until TEXT, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL, last_login_at TEXT, admin_notes TEXT NOT NULL DEFAULT '', password_hash TEXT, is_demo INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS audit_log (id TEXT PRIMARY KEY, admin_id TEXT NOT NULL, action TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL, details TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS app_secrets (name TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS phone_otp_issues (phone TEXT PRIMARY KEY, issued_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS template_settings (id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 1, tier TEXT NOT NULL DEFAULT 'free');
`);

const userColumns = db.prepare('PRAGMA table_info(users)').all();
if (!userColumns.some((column) => column.name === 'password_hash')) db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
if (!userColumns.some((column) => column.name === 'is_demo')) db.exec('ALTER TABLE users ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0');
db.prepare("UPDATE users SET is_demo=1 WHERE id LIKE 'user-%'").run();

const guestColumns = db.prepare('PRAGMA table_info(guests)').all();
if (!guestColumns.some((column) => column.name === 'max_party_size')) {
  db.exec('ALTER TABLE guests ADD COLUMN max_party_size INTEGER');
}
const invitationColumns = db.prepare('PRAGMA table_info(invitations)').all();
if (!invitationColumns.some((column) => column.name === 'is_demo')) db.exec('ALTER TABLE invitations ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0');
db.prepare("UPDATE invitations SET is_demo=1 WHERE owner_id LIKE 'user-%'").run();
if (!invitationColumns.some((column) => column.name === 'suspended_reason')) db.exec('ALTER TABLE invitations ADD COLUMN suspended_reason TEXT');
if (!invitationColumns.some((column) => column.name === 'last_edited_by_admin')) db.exec('ALTER TABLE invitations ADD COLUMN last_edited_by_admin INTEGER NOT NULL DEFAULT 0');
if (!invitationColumns.some((column) => column.name === 'updated_at')) db.exec('ALTER TABLE invitations ADD COLUMN updated_at TEXT');

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
  const now = Date.now();
  const demoUsers: AdminUser[] = Array.from({ length: 15 }, (_, index) => {
    const id = `user-${String(index + 1).padStart(3, '0')}`;
    const isDevAdmin = index === 0 && process.env.NODE_ENV !== 'production';
    return { id, name: isDevAdmin ? 'Invitation Admin' : `Demo User ${index + 1}`, email: isDevAdmin ? 'admin@invite.test' : `user${index + 1}@invite.test`, phone: `0771${String(100000 + index * 1234).slice(0, 6)}`, provider: (['email', 'phone', 'google'][index % 3]) as AdminUser['provider'], role: isDevAdmin ? 'admin' : 'user', plan: index % 4 === 1 ? 'pro' : 'free', plan_until: index % 4 === 1 ? new Date(now + (index % 2 ? 5 : 90) * 86400000).toISOString() : null, status: index === 7 ? 'suspended' : 'active', created_at: new Date(now - index * 86400000 * 9).toISOString(), last_login_at: index ? new Date(now - index * 3600000).toISOString() : null, admin_notes: '', is_demo: true };
  });
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (id,name,email,phone,provider,role,plan,plan_until,status,created_at,last_login_at,admin_notes,is_demo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1)');
  for (const user of demoUsers) insertUser.run(user.id,user.name,user.email,user.phone,user.provider,user.role,user.plan,user.plan_until,user.status,user.created_at,user.last_login_at,user.admin_notes);
  if (process.env.NODE_ENV !== 'production' && !db.prepare("SELECT password_hash FROM users WHERE id='user-001'").get()?.password_hash) {
    const salt=randomBytes(16).toString('hex');
    db.prepare("UPDATE users SET password_hash=? WHERE id='user-001'").run(`${salt}:${scryptSync('Demo@1234',salt,64).toString('hex')}`);
  }
  if (process.env.NODE_ENV !== 'production') insertUser.run('admin-dev','Invitation Admin','admin@invite.test','', 'email','admin','free',null,'active',new Date(now).toISOString(),null,'');
  HARDCODED_TEMPLATES.forEach((template,index) => db.prepare('INSERT OR IGNORE INTO template_settings (id,enabled,tier) VALUES (?,1,?)').run(template.id,index%6===5?'pro':'free'));
  if (Number(db.prepare('SELECT COUNT(*) AS count FROM invitations').get()?.count ?? 0) > 0) return;
  const insertInvitation = db.prepare('INSERT OR IGNORE INTO invitations (id, owner_id, template_id, data, type, slug, created_at, status, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)');
  for (const invitation of HARDCODED_INVITATIONS) {
    insertInvitation.run(invitation.id, invitation.userId, invitation.templateId, JSON.stringify({ title: invitation.title, customData: invitation.customData }), invitation.type, seedSlug(invitation.title), invitation.createdAt, invitation.status);
  }
  const insertGuest = db.prepare('INSERT OR IGNORE INTO guests (id, invitation_id, name, phone, email, code, rsvp_status, party_size, rsvp_message, opened_at, responded_at, revoked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)');
  for (const guest of HARDCODED_GUESTS) {
    insertGuest.run(guest.id, guest.invitationId, guest.name, guest.phone, guest.email ?? null, seedGuestCode(), guest.rsvpStatus, guest.partySize ?? null, guest.rsvpMessage ?? null, guest.openedAt ?? null, guest.respondedAt ?? null);
  }
}

// Demo rows are installed only by `npm run seed:demo`.
if (process.env.NODE_ENV !== 'production') {
  db.prepare("INSERT OR IGNORE INTO users (id,name,email,provider,role,created_at) VALUES ('admin-dev','Invitation Admin','admin@invite.test','email','admin',?)").run(new Date().toISOString());
  db.prepare("UPDATE users SET role='admin',status='active' WHERE id='admin-dev'").run();
  if (!db.prepare("SELECT password_hash FROM users WHERE id='admin-dev'").get()?.password_hash) {
    const salt=randomBytes(16).toString('hex');
    db.prepare("UPDATE users SET password_hash=? WHERE id='admin-dev'").run(`${salt}:${scryptSync('Admin@1234',salt,64).toString('hex')}`);
  }
}

function asInvitation(row: Record<string, unknown> | undefined): Invitation | null {
  if (!row) return null;
  const data = JSON.parse(String(row.data)) as { title: string; customData: InvitationCustomData };
  return {
    id: String(row.id), userId: String(row.owner_id), templateId: String(row.template_id),
    title: data.title, customData: data.customData, type: row.type as Invitation['type'],
    slug: String(row.slug ?? ''), createdAt: String(row.created_at), status: row.status as Invitation['status'],
    suspendedReason: row.suspended_reason == null ? undefined : String(row.suspended_reason), lastEditedByAdmin: Number(row.last_edited_by_admin) === 1,
    updatedAt: String(row.updated_at ?? row.created_at),
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
  listAdminUsers(includeDemo = false): AdminUser[] { return db.prepare(`SELECT id,name,email,phone,provider,role,plan,plan_until,status,created_at,last_login_at,admin_notes,is_demo FROM users ${includeDemo ? '' : 'WHERE is_demo=0'} ORDER BY created_at DESC`).all() as unknown as AdminUser[]; },
  getAdminUser(id: string): AdminUser | null { return (db.prepare('SELECT id,name,email,phone,provider,role,plan,plan_until,status,created_at,last_login_at,admin_notes,is_demo FROM users WHERE id = ?').get(id) as unknown as AdminUser | undefined) ?? null; },
  findUserByEmail(email: string): (AdminUser & { password_hash: string | null }) | null { return (db.prepare('SELECT * FROM users WHERE lower(email)=?').get(email) as unknown as (AdminUser & { password_hash: string | null }) | undefined) ?? null; },
  findUserCredential(id:string): (AdminUser & {password_hash:string|null}) | null { return (db.prepare('SELECT * FROM users WHERE id=?').get(id) as unknown as (AdminUser & {password_hash:string|null}) | undefined) ?? null; },
  findUserByPhone(phone: string): AdminUser | null { return (db.prepare('SELECT id,name,email,phone,provider,role,plan,plan_until,status,created_at,last_login_at,admin_notes,is_demo FROM users WHERE phone=?').get(phone) as unknown as AdminUser | undefined) ?? null; },
  createUser(input: {id:string;name:string;email?:string;phone?:string;provider:AdminUser['provider'];passwordHash?:string|null}): AdminUser {
    const now = new Date().toISOString();
    db.prepare('INSERT INTO users (id,name,email,phone,provider,role,plan,status,created_at,last_login_at,password_hash,is_demo) VALUES (?,?,?,?,?,\'user\',\'free\',\'active\',?,?,?,0)').run(input.id,input.name,input.email ?? '',input.phone ?? '',input.provider,now,now,input.passwordHash ?? null);
    return this.getAdminUser(input.id)!;
  },
  touchLogin(id:string): void { db.prepare('UPDATE users SET last_login_at=? WHERE id=?').run(new Date().toISOString(),id); },
  updateProfile(id:string, name:string, phone:string): AdminUser | null { db.prepare('UPDATE users SET name=?,phone=? WHERE id=?').run(name,phone,id); return this.getAdminUser(id); },
  setPasswordHash(id:string, hash:string): void { db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash,id); },
  issuePhoneOtp(phone:string): void { db.prepare('INSERT INTO phone_otp_issues(phone,issued_at) VALUES(?,?) ON CONFLICT(phone) DO UPDATE SET issued_at=excluded.issued_at').run(phone,new Date().toISOString()); },
  consumePhoneOtp(phone:string): boolean { const row=db.prepare('SELECT issued_at FROM phone_otp_issues WHERE phone=?').get(phone);db.prepare('DELETE FROM phone_otp_issues WHERE phone=?').run(phone);return !!row&&Date.now()-Date.parse(String(row.issued_at))<=5*60_000; },
  updateAdminUser(id: string, patch: Partial<AdminUser>): AdminUser | null {
    const user = this.getAdminUser(id); if (!user) return null;
    const next = { ...user, ...patch };
    db.prepare('UPDATE users SET name=?,email=?,phone=?,role=?,plan=?,plan_until=?,status=?,admin_notes=? WHERE id=?').run(next.name,next.email,next.phone,next.role,next.plan,next.plan_until,next.status,next.admin_notes,id);
    return this.getAdminUser(id);
  },
  countAdmins(): number { return Number(db.prepare("SELECT COUNT(*) AS count FROM users WHERE role='admin' AND status='active'").get()?.count ?? 0); },
  addAudit(entry: AuditEntry): void { db.prepare('INSERT INTO audit_log (id,admin_id,action,target_type,target_id,details,created_at) VALUES (?,?,?,?,?,?,?)').run(entry.id,entry.admin_id,entry.action,entry.target_type,entry.target_id,entry.details,entry.created_at); },
  listAudit(): AuditEntry[] { return db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200').all() as unknown as AuditEntry[]; },
  listAllInvitations(includeDemo = false): Invitation[] { return db.prepare(`SELECT * FROM invitations ${includeDemo ? '' : 'WHERE is_demo=0'} ORDER BY created_at DESC`).all().map((row) => asInvitation(row)!).filter(Boolean); },
  deleteDemoData(): {users:number;invitations:number} { const users=Number(db.prepare('SELECT COUNT(*) AS count FROM users WHERE is_demo=1').get()?.count??0); const invitations=Number(db.prepare('SELECT COUNT(*) AS count FROM invitations WHERE is_demo=1').get()?.count??0); db.prepare('DELETE FROM invitations WHERE is_demo=1').run(); db.prepare('DELETE FROM users WHERE is_demo=1').run(); return {users,invitations}; },
  getSecret(name: string): string | null { const value = db.prepare('SELECT value FROM app_secrets WHERE name=?').get(name)?.value; return typeof value === 'string' ? value : null; },
  setSecret(name: string, value: string): void { db.prepare('INSERT INTO app_secrets (name,value) VALUES (?,?) ON CONFLICT(name) DO UPDATE SET value=excluded.value').run(name,value); },
  listTemplateSettings(): Array<{id:string;enabled:boolean;tier:'free'|'pro'}> { return db.prepare('SELECT id,enabled,tier FROM template_settings').all().map((r) => ({id:String(r.id),enabled:Number(r.enabled)===1,tier:r.tier === 'pro' ? 'pro' : 'free'})); },
  setTemplateSetting(id:string, enabled:boolean, tier:'free'|'pro'): void { db.prepare('INSERT INTO template_settings (id,enabled,tier) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET enabled=excluded.enabled,tier=excluded.tier').run(id,enabled?1:0,tier); },
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
    db.prepare('INSERT INTO invitations (id, owner_id, template_id, data, type, slug, created_at, status, updated_at) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)')
      .run(id, input.userId, input.templateId, JSON.stringify({ title: input.title, customData: input.customData }), input.type, createdAt, 'draft', createdAt);
    return this.getInvitation(id)!;
  },
  setInvitationSlug(id: string, slug: string): void {
    db.prepare('UPDATE invitations SET slug = ? WHERE id = ?').run(slug, id);
  },
  updateInvitation(id: string, patch: Partial<Omit<Invitation, 'id' | 'createdAt'>>): Invitation | null {
    const existing = this.getInvitation(id);
    if (!existing) return null;
    const next = { ...existing, ...patch };
    db.prepare('UPDATE invitations SET owner_id = ?, template_id = ?, data = ?, type = ?, slug = ?, status = ?, suspended_reason = ?, last_edited_by_admin = ?, updated_at = ? WHERE id = ?')
      .run(next.userId, next.templateId, JSON.stringify({ title: next.title, customData: next.customData }), next.type, next.slug || null, next.status, next.suspendedReason ?? null, next.lastEditedByAdmin ? 1 : 0, new Date().toISOString(), id);
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

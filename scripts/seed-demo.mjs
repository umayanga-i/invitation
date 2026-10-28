import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

if (process.env.NODE_ENV === 'production') throw new Error('Demo seeding is disabled in production.');
const path = process.env.INVITATION_DB_PATH ?? join(process.cwd(), 'data', 'dev.db');
mkdirSync(dirname(path), { recursive: true });
const db = new DatabaseSync(path);
db.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',provider TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'user',plan TEXT NOT NULL DEFAULT 'free',plan_until TEXT,status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL,last_login_at TEXT,admin_notes TEXT NOT NULL DEFAULT '',password_hash TEXT,is_demo INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS invitations (id TEXT PRIMARY KEY,owner_id TEXT NOT NULL,template_id TEXT NOT NULL,data TEXT NOT NULL,type TEXT NOT NULL,slug TEXT UNIQUE,created_at TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft',is_demo INTEGER NOT NULL DEFAULT 1,suspended_reason TEXT,last_edited_by_admin INTEGER NOT NULL DEFAULT 0,updated_at TEXT);`);
const now = new Date().toISOString();
const addUser = db.prepare("INSERT OR IGNORE INTO users(id,name,email,phone,provider,role,plan,status,created_at,is_demo) VALUES(?,?,?,?,?,'user',?,'active',?,1)");
for (const [id,name,email,provider,plan] of [
  ['demo-user-email','Demo Email User','demo@invite.test','email','free'],
  ['demo-user-phone','Demo Phone User','phone-demo@invite.test','phone','pro'],
  ['demo-user-google','Demo Google User','google-demo@invite.test','google','free'],
]) addUser.run(id,name,email,'',provider,plan,now);
db.prepare("INSERT OR IGNORE INTO invitations(id,owner_id,template_id,data,type,slug,created_at,status,is_demo) VALUES('demo-invitation','demo-user-email','wedding-floral',?,'common','demo-invitation',?,'draft',1)").run(JSON.stringify({title:'Demo Wedding Invitation',customData:{}}),now);
console.log('Demo users and invitation seeded.');
db.close();

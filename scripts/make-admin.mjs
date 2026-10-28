import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';

const email = process.argv[2]?.trim().toLowerCase();
if (process.env.NODE_ENV === 'production') throw new Error('make-admin is a development-only command.');
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Usage: npm run make-admin -- <email>');
const path = process.env.INVITATION_DB_PATH ?? join(process.cwd(), 'data', 'dev.db');
const db = new DatabaseSync(path);
const user = db.prepare('SELECT id,is_demo FROM users WHERE lower(email)=?').get(email);
if (!user || Number(user.is_demo)) { db.close(); throw new Error('An existing real user with that email is required.'); }
db.prepare("UPDATE users SET role='admin' WHERE id=?").run(user.id);
console.log(`Admin access granted to ${email}.`);
db.close();

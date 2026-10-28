import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { dbAdapter, type AdminUser, type AuditEntry } from '@/lib/db';
import { HARDCODED_TEMPLATES } from '@/lib/mock-data';

const ADMIN_COOKIE = 'invite_admin_session';

function secret() {
  let value = dbAdapter.getSecret('admin_session_secret');
  if (!value) { value = process.env.ADMIN_SESSION_SECRET || randomBytes(32).toString('hex'); dbAdapter.setSecret('admin_session_secret', value); }
  return value;
}
function signature(id: string) { return createHmac('sha256', secret()).update(id).digest('hex'); }
export function createAdminToken(id: string) { return `${id}.${signature(id)}`; }
export function verifyAdminToken(token: string): boolean {
  const separator = token.lastIndexOf('.'); if (separator < 1) return false;
  const id = token.slice(0, separator); const given = Buffer.from(token.slice(separator + 1)); const expected = Buffer.from(signature(id));
  return given.length === expected.length && timingSafeEqual(given, expected);
}
export async function requireAdmin(): Promise<AdminUser> {
  const cookieJar = await cookies();
  const session = cookieJar.get(ADMIN_COOKIE)?.value;
  if (!session || !verifyAdminToken(session)) throw new Error('ADMIN_UNAUTHORIZED');
  const user = dbAdapter.getAdminUser(session.slice(0, session.lastIndexOf('.')));
  if (!user || user.role !== 'admin' || user.status !== 'active' || process.env.NODE_ENV === 'production' && (user.id === 'admin-dev' || user.email === 'admin@invite.test' || user.is_demo)) throw new Error('ADMIN_UNAUTHORIZED');
  return user;
}
export function adminUnauthorized(error: unknown) {
  return error instanceof Error && error.message === 'ADMIN_UNAUTHORIZED' ? Response.json({ error: 'Not found.' }, { status: 404 }) : null;
}
export function logAudit(adminId: string, action: string, targetType: string, targetId: string, details: unknown = {}) {
  const entry: AuditEntry = { id: randomBytes(12).toString('hex'), admin_id: adminId, action, target_type: targetType, target_id: targetId, details: JSON.stringify(details), created_at: new Date().toISOString() };
  dbAdapter.addAudit(entry);
}
export function isPro(user: Pick<AdminUser, 'plan' | 'plan_until'> | null) { return !!user && user.plan === 'pro' && (!user.plan_until || Date.parse(user.plan_until) > Date.now()); }
export function canUseTemplate(user: Pick<AdminUser, 'plan' | 'plan_until' | 'role'> | null, tier: 'free' | 'pro') { return !!user && (user.role === 'admin' || tier === 'free' || isPro(user)); }
export const ADMIN_COOKIE_NAME = ADMIN_COOKIE;
export function listUsers(search = '', plan = '', status = '', includeDemo = false) {
  const q = search.trim().toLowerCase();
  return dbAdapter.listAdminUsers(includeDemo).filter((u) => (!q || `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q)) && (!plan || u.plan === plan) && (!status || u.status === status));
}
export function getStats(days = 30, includeDemo = false) {
  const users=dbAdapter.listAdminUsers(includeDemo), invitations=dbAdapter.listAllInvitations(includeDemo);
  const guests=invitations.flatMap(i=>dbAdapter.getGuests(i.id).map(g=>({...g,invitationId:i.id})));
  const today=new Date();today.setHours(0,0,0,0);
  const first=new Date(today);first.setDate(first.getDate()-days+1);
  const previous=new Date(first);previous.setDate(previous.getDate()-days);
  const dayKey=(date:string)=>date.slice(0,10);
  const daily=Array.from({length:days},(_,n)=>{const d=new Date(first);d.setDate(first.getDate()+n);return {date:dayKey(d.toISOString()),signups:0,invitations:0};});
  const dailyMap=new Map(daily.map(d=>[d.date,d]));
  for(const u of users){const row=dailyMap.get(dayKey(u.created_at));if(row)row.signups++;}
  for(const i of invitations){const row=dailyMap.get(dayKey(i.createdAt));if(row)row.invitations++;}
  const newUsers=users.filter(u=>Date.parse(u.created_at)>=first.getTime()).length;
  const priorUsers=users.filter(u=>Date.parse(u.created_at)>=previous.getTime()&&Date.parse(u.created_at)<first.getTime()).length;
  const newInvitations=invitations.filter(i=>Date.parse(i.createdAt)>=first.getTime()).length;
  const priorInvitations=invitations.filter(i=>Date.parse(i.createdAt)>=previous.getTime()&&Date.parse(i.createdAt)<first.getTime()).length;
  const replies=guests.filter(g=>g.rsvpStatus!=='pending');
  const repliesInRange=replies.filter(g=>g.respondedAt&&Date.parse(g.respondedAt)>=first.getTime()).length;
  const repliesPrior=replies.filter(g=>g.respondedAt&&Date.parse(g.respondedAt)>=previous.getTime()&&Date.parse(g.respondedAt)<first.getTime()).length;
  const count=(items:string[],values:string[])=>values.map(name=>({name,value:items.filter(v=>v===name).length}));
  const byStatus=count(invitations.map(i=>i.status),['draft','published','suspended','archived']);
  const monday=(date:Date)=>{const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7);return d;};
  const weeklyStatus:Array<{week:string;draft:number;published:number;suspended:number}>=[];
  for(let week=monday(first);week<=today;week.setDate(week.getDate()+7)){const key=week.toISOString().slice(0,10);weeklyStatus.push({week:key,draft:0,published:0,suspended:0});}
  const weekMap=new Map(weeklyStatus.map(w=>[w.week,w]));
  for(const i of invitations){const created=new Date(i.createdAt);if(created<first||created>today)continue;const week=weekMap.get(monday(created).toISOString().slice(0,10));if(week&&i.status in week)week[i.status as 'draft'|'published'|'suspended']++;}
  const rsvp=count(guests.map(g=>g.rsvpStatus),['attending','not_attending','maybe','pending']);
  const byPlan=count(users.map(u=>u.plan),['free','pro']);
  const byMethod=count(users.map(u=>u.provider),['email','phone','google']);
  const templateUsage=Array.from(new Set(invitations.map(i=>i.templateId))).map(id=>({name:HARDCODED_TEMPLATES.find(t=>t.id===id)?.name??id,value:invitations.filter(i=>i.templateId===id).length})).sort((a,b)=>b.value-a.value).slice(0,8);
  const byCategory=Array.from(new Set(HARDCODED_TEMPLATES.map(t=>t.category))).map(category=>({name:category,value:invitations.filter(i=>HARDCODED_TEMPLATES.find(t=>t.id===i.templateId)?.category===category).length}));
  const expiringPro=users.filter(u=>u.plan==='pro'&&u.plan_until&&Date.parse(u.plan_until)>=Date.now()&&Date.parse(u.plan_until)<=Date.now()+30*86400000).map(u=>({id:u.id,name:u.name,plan_until:u.plan_until}));
  const lowOpens=invitations.map(i=>({i,guests:dbAdapter.getGuests(i.id)})).filter(({guests})=>guests.length>=20&&guests.every(g=>!g.openedAt)).map(({i})=>({id:i.id,title:i.title}));
  const recentActivity=[...users.filter(u=>Date.parse(u.created_at)>=first.getTime()).map(u=>({kind:'signup',label:`${u.name} signed up`,created_at:u.created_at})),...invitations.filter(i=>Date.parse(i.createdAt)>=first.getTime()).map(i=>({kind:'invitation',label:`${i.title} was created`,created_at:i.createdAt})),...dbAdapter.listAudit().slice(0,30).map(a=>({kind:a.action,label:`${a.action} · ${a.target_type} ${a.target_id}`,created_at:a.created_at}))].sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)).slice(0,10);
  return {users:users.length,newUsers,priorUsers,pro:users.filter(isPro).length,suspended:users.filter(u=>u.status==='suspended').length,invitations:invitations.length,newInvitations,priorInvitations,guests:guests.length,responses:replies.length,responsesInRange:repliesInRange,responsesPrior:repliesPrior,byStatus,weeklyStatus,rsvp,byPlan,byMethod,daily,templateUsage,byCategory,expiringPro,lowOpens,recentActivity,attentionUsers:users.filter(u=>u.status==='suspended').length,attentionInvitations:invitations.filter(i=>i.status==='suspended').length};
}
export function setUserPlan(admin: AdminUser, id: string, plan: 'free'|'pro', planUntil: string|null) {
  if (admin.id === id && plan !== 'pro') throw new Error('You cannot demote yourself.');
  const user = dbAdapter.getAdminUser(id); if (!user) return null;
  const updated = dbAdapter.updateAdminUser(id,{plan,plan_until:plan === 'free' ? null : planUntil});
  logAudit(admin.id, 'user.plan.changed', 'user', id, { before: { plan:user.plan, plan_until:user.plan_until }, after: {plan:updated?.plan,plan_until:updated?.plan_until} }); return updated;
}
export function setUserStatus(admin: AdminUser, id: string, status: 'active'|'suspended', reason: string) {
  if (admin.id === id && status === 'suspended') throw new Error('You cannot suspend yourself.');
  const user = dbAdapter.getAdminUser(id); if (!user) return null;
  if (user.role === 'admin' && status === 'suspended' && dbAdapter.countAdmins() <= 1) throw new Error('The last admin cannot be removed.');
  if (status === 'suspended' && !reason.trim()) throw new Error('A suspension reason is required.');
  const updated = dbAdapter.updateAdminUser(id,{status}); logAudit(admin.id, `user.${status}`, 'user', id, {reason}); return updated;
}
export function invitations() { return dbAdapter.listAllInvitations().map(i => ({...i, guests: dbAdapter.getGuests(i.id)})); }

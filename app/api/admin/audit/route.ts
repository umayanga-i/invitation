import { requireAdmin, adminUnauthorized } from '@/lib/server/admin';
import { dbAdapter } from '@/lib/db';
export async function GET(){try{await requireAdmin();return Response.json(dbAdapter.listAudit());}catch(e){console.error('[admin audit]',e);return adminUnauthorized(e)??Response.json({error:'Unable to load audit log.'},{status:500});}}

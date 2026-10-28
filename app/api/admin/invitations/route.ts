import { requireAdmin, adminUnauthorized } from '@/lib/server/admin';
import { dbAdapter } from '@/lib/db';
export async function GET(request:Request){try{await requireAdmin();return Response.json(dbAdapter.listAllInvitations(new URL(request.url).searchParams.get('includeDemo')==='1').map(i=>({...i,guests:dbAdapter.getGuests(i.id)})));}catch(e){console.error('[admin invitations]',e);return adminUnauthorized(e)??Response.json({error:'Unable to load invitations.'},{status:500});}}

import { requireAdmin, adminUnauthorized, logAudit } from '@/lib/server/admin';
import { dbAdapter } from '@/lib/db';
type Context={params:Promise<{id:string}>};
export async function POST(_:Request,{params}:Context){try{const admin=await requireAdmin();const {id}=await params;const guest=dbAdapter.getGuest(id);if(!guest)return Response.json({error:'Guest not found.'},{status:404});logAudit(admin.id,'guest.phone.revealed','guest',id,{});return Response.json({phone:guest.phone});}catch(e){console.error('[admin reveal]',e);return adminUnauthorized(e)??Response.json({error:'Unable to reveal phone.'},{status:500});}}

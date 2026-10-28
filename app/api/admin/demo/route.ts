import { requireAdmin, adminUnauthorized, logAudit } from '@/lib/server/admin';
import { dbAdapter } from '@/lib/db';

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json() as {confirm?:unknown};
    if (body.confirm !== 'DELETE DEMO DATA') return Response.json({error:'Typed confirmation is required.'},{status:400});
    const deleted = dbAdapter.deleteDemoData();
    logAudit(admin.id,'demo.data.deleted','demo','all',deleted);
    return Response.json(deleted);
  } catch (error) { console.error('[admin demo]',error);return adminUnauthorized(error) ?? Response.json({error:'Unable to delete demo data.'},{status:500}); }
}

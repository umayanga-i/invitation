import { dbAdapter } from '@/lib/db';
import { HARDCODED_TEMPLATES } from '@/lib/mock-data';
export async function GET(){const settings=new Map(dbAdapter.listTemplateSettings().map(t=>[t.id,t]));return Response.json(HARDCODED_TEMPLATES.map((template,index)=>({...template,...(settings.get(template.id)??{enabled:true,tier:index%6===5?'pro':'free'})})).filter(template=>template.enabled));}

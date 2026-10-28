import { notFound } from 'next/navigation';
import { AdminInvitation } from '@/components/admin-invitation';
import { dbAdapter } from '@/lib/db';
type Props={params:Promise<{id:string}>};
export default async function Page({params}:Props){const {id}=await params;const invitation=dbAdapter.getInvitation(id);if(!invitation)notFound();return <AdminInvitation id={id} initial={{...invitation,guests:dbAdapter.getGuests(id)}}/>}

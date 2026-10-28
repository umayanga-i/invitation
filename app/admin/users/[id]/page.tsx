import { AdminUser } from '@/components/admin-user';
type Props={params:Promise<{id:string}>};
export default async function Page({params}:Props){const {id}=await params;return <AdminUser id={id}/>}

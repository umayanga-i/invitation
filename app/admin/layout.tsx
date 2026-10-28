import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/server/admin';
import { AdminChrome } from '@/components/admin-chrome';
export const dynamic = 'force-dynamic';
export default async function AdminLayout({children}:{children:React.ReactNode}){let admin;try{admin=await requireAdmin()}catch{return notFound()}return <AdminChrome name={admin.name}>{children}</AdminChrome>}

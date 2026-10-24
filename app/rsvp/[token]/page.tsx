import { notFound, redirect } from 'next/navigation';
import { dbAdapter } from '@/lib/db';

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[23456789abcdefghjkmnpqrstuvwxyz]{8}$/.test(token)) notFound();
  const guest = dbAdapter.getGuestByCode(token);
  if (!guest) notFound();
  redirect(`/s/${encodeURIComponent(token)}`);
}

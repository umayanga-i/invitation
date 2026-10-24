import { NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  dbAdapter.resetMockData();
  return NextResponse.json({ ok: true });
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';
import { PublicShell } from '@/components/layout/public-shell';

export const metadata: Metadata = { title: 'Terms' };
export default function TermsPage() { return <PublicShell><article className="iv-legal-content"><Link href="/">← {BRAND_NAME}</Link><p className="iv-kicker">The details</p><h1>Terms of use</h1><p>{BRAND_NAME} is currently in preview. By using this service, you agree to use it respectfully and only to invite people who may reasonably expect to hear from you. Product details may change while the service is being developed.</p></article></PublicShell>; }

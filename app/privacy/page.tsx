import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';
import { PublicShell } from '@/components/layout/public-shell';

export const metadata: Metadata = { title: 'Privacy' };
export default function PrivacyPage() { return <PublicShell><article className="iv-legal-content"><Link href="/">← {BRAND_NAME}</Link><p className="iv-kicker">Your information</p><h1>Privacy</h1><p>{BRAND_NAME} uses the information you provide to prepare invitations, share guest links, and organize RSVP responses. Avoid adding information you do not need for your event. This preview privacy page is a placeholder and will be expanded before the service launches.</p></article></PublicShell>; }

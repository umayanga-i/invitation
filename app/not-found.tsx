import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';

export default function NotFound() { return <main className="iv-state-page"><span aria-hidden="true" className="iv-state-icon">✉</span><p className="iv-kicker">{BRAND_NAME}</p><h1>We couldn’t find that page.</h1><p>The invitation or page may have moved, expired, or never existed.</p><Link href="/" className="iv-state-link">Return home ↗</Link></main>; }

import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/landing-page';
import { BRAND_NAME, TAGLINE } from '@/lib/brand';

export const metadata: Metadata = {
  title: `${TAGLINE} | ${BRAND_NAME}`,
  description: 'Choose a thoughtful invitation design, personalise it for your celebration, share it with guests on WhatsApp, and follow every RSVP.',
  openGraph: {
    title: `${TAGLINE} | ${BRAND_NAME}`,
    description: 'Choose a thoughtful invitation design, personalise it for your celebration, share it with guests on WhatsApp, and follow every RSVP.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: `${TAGLINE} | ${BRAND_NAME}`, description: 'A beautiful invitation for every celebration.' },
};

export default function Home() {
  return <LandingPage />;
}

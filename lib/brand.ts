export const BRAND_NAME = 'Invitely';
export const TAGLINE = 'Every celebration, beautifully invited.';

export function shortLinkExample(): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/s/Ab3xQ7km`;
}

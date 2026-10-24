import { ImageResponse } from 'next/og';
import type { TemplateColors } from '@/lib/mock-data';

export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 };

function validColor(value: string | undefined, fallback: string): string {
  return value && /^#[\da-f]{6}$/i.test(value) ? value : fallback;
}

export function invitationSocialImage({ title, eyebrow, date, venue, colors }: {
  title: string; eyebrow: string; date?: string; venue?: string; colors?: TemplateColors;
}) {
  const primary = validColor(colors?.primary, '#273342');
  const secondary = validColor(colors?.secondary, '#f5f0eb');
  const accent = validColor(colors?.accent, '#c9a84c');

  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${primary}, #10151d 78%)`, padding: 48, color: secondary }}>
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: `2px solid ${accent}`, padding: '54px 72px', background: 'rgba(255,255,255,.035)' }}>
        <div style={{ color: accent, fontSize: 24, letterSpacing: 8, textTransform: 'uppercase' }}>{eyebrow.slice(0, 70)}</div>
        <div style={{ marginTop: 30, fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 980 }}>{title.slice(0, 100)}</div>
        {date && <div style={{ marginTop: 30, fontSize: 30, color: accent }}>{date}</div>}
        {venue && <div style={{ marginTop: 12, fontSize: 25, color: secondary, opacity: 0.88 }}>{venue.slice(0, 100)}</div>}
        <div style={{ position: 'absolute', bottom: 28, fontSize: 18, letterSpacing: 5, color: accent }}>INVITATION STUDIO</div>
      </div>
    </div>,
    { ...SOCIAL_IMAGE_SIZE },
  );
}

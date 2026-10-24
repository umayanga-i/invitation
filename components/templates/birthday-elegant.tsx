'use client';

import type { TemplateData } from './types';

/**
 * Birthday Elegant — navy blue + gold, sophisticated tiered text layout.
 */
export default function BirthdayElegant(data: TemplateData) {
  const { primary, secondary, accent } = data.colors;

  return (
    <div
      className="h-full w-full relative overflow-hidden flex flex-col items-center justify-between"
      style={{ background: primary, fontFamily: 'Georgia, serif', color: '#fff' }}
    >
      {/* Top gold band */}
      <div style={{ width: '100%', height: '4px', background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      {/* Gold star pattern top */}
      <svg viewBox="0 0 400 60" className="w-full" style={{ opacity: 0.35, marginTop: '0' }} aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <polygon key={i} points={`${i*35+8},30 ${i*35+11},20 ${i*35+14},30 ${i*35+5},24 ${i*35+17},24`} fill={accent} transform={`rotate(${i*15},${i*35+11},26)`} />
        ))}
      </svg>

      {data.guestName && (
        <p style={{ fontSize: 'clamp(8px,1.3vw,12px)', letterSpacing: '2px', color: accent, textTransform: 'uppercase' }}>
          Dear {data.guestName},
        </p>
      )}

      <div style={{ textAlign: 'center', padding: '0 clamp(16px,5vw,40px)', zIndex: 1 }}>
        <p style={{ fontSize: 'clamp(7px,1.1vw,10px)', letterSpacing: '4px', color: secondary, textTransform: 'uppercase', marginBottom: '10px', opacity: 0.8 }}>
          Please join us to celebrate
        </p>

        {/* The big name */}
        <h1 style={{ fontSize: 'clamp(20px,5vw,48px)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.1, color: '#fff', margin: '0 0 6px' }}>
          {data.hostNames}
        </h1>

        {/* Gold event title */}
        <h2 style={{ fontSize: 'clamp(12px,2.5vw,24px)', fontWeight: 400, color: accent, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 16px' }}>
          {data.eventTitle}
        </h2>

        {/* Tiered gold rule */}
        <div style={{ margin: '0 auto 16px', width: '60%' }}>
          <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
          <div style={{ height: '4px', margin: '3px 10% 3px', background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
          <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
        </div>

        {data.photo && (
          <div style={{ width: 'clamp(60px,14vw,90px)', height: 'clamp(60px,14vw,90px)', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${accent}`, margin: '0 auto 14px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.photo} alt="Birthday" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ border: `1px solid ${accent}40`, padding: 'clamp(10px,2vw,20px)', marginBottom: '12px' }}>
          <p style={{ fontSize: 'clamp(10px,1.8vw,15px)', color: accent, fontWeight: 500, margin: '0 0 4px' }}>{data.date}</p>
          <p style={{ fontSize: 'clamp(8px,1.3vw,12px)', color: secondary, margin: '0 0 4px', opacity: 0.8 }}>{data.time}</p>
          <p style={{ fontSize: 'clamp(9px,1.5vw,13px)', color: '#fff', margin: 0 }}>{data.venue}</p>
          {data.mapLink && (
            <a href={data.mapLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'clamp(7px,1.1vw,10px)', color: accent, display: 'block', marginTop: '4px' }}>
              Map ↗
            </a>
          )}
        </div>

        {data.message && (
          <p style={{ fontSize: 'clamp(7px,1.2vw,11px)', fontStyle: 'italic', color: secondary, lineHeight: 1.8, maxWidth: '80%', margin: '0 auto', opacity: 0.85 }}>
            &ldquo;{data.message}&rdquo;
          </p>
        )}
      </div>

      <svg viewBox="0 0 400 60" className="w-full" style={{ opacity: 0.35, transform: 'scaleX(-1)' }} aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <polygon key={i} points={`${i*35+8},30 ${i*35+11},20 ${i*35+14},30 ${i*35+5},24 ${i*35+17},24`} fill={accent} />
        ))}
      </svg>

      {/* Bottom gold band */}
      <div style={{ width: '100%', height: '4px', background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
    </div>
  );
}

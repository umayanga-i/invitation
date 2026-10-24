'use client';

import type { TemplateData } from './types';

/**
 * Wedding Modern — minimalist black/white/gold, clean sans-serif,
 * geometric lines and ruled dividers.
 */
export default function WeddingModern(data: TemplateData) {
  const { primary, secondary, accent } = data.colors;
  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#ffffff', fontFamily: 'system-ui, sans-serif', color: primary }}
    >
      {/* Corner geometry top-left */}
      <svg viewBox="0 0 80 80" style={{ position: 'absolute', top: 0, left: 0, width: 'clamp(40px,8vw,80px)' }} aria-hidden="true">
        <line x1="0" y1="0" x2="80" y2="0" stroke={accent} strokeWidth="3" />
        <line x1="0" y1="0" x2="0" y2="80" stroke={accent} strokeWidth="3" />
        <line x1="20" y1="20" x2="60" y2="20" stroke={primary} strokeWidth="0.5" />
        <line x1="20" y1="20" x2="20" y2="60" stroke={primary} strokeWidth="0.5" />
      </svg>
      {/* Corner geometry bottom-right */}
      <svg viewBox="0 0 80 80" style={{ position: 'absolute', bottom: 0, right: 0, width: 'clamp(40px,8vw,80px)', transform: 'rotate(180deg)' }} aria-hidden="true">
        <line x1="0" y1="0" x2="80" y2="0" stroke={accent} strokeWidth="3" />
        <line x1="0" y1="0" x2="0" y2="80" stroke={accent} strokeWidth="3" />
      </svg>

      <div style={{ textAlign: 'center', padding: '0 24px', maxWidth: '90%' }}>
        {data.guestName && (
          <p style={{ fontSize: 'clamp(8px,1.3vw,12px)', letterSpacing: '2px', color: secondary, marginBottom: '12px', textTransform: 'uppercase' }}>
            Dear {data.guestName},
          </p>
        )}

        {/* Thin rule */}
        <div style={{ width: '40px', height: '2px', background: accent, margin: '0 auto 16px' }} />

        <p style={{ fontSize: 'clamp(7px,1.1vw,10px)', letterSpacing: '4px', color: secondary, textTransform: 'uppercase', marginBottom: '10px' }}>
          You are invited to celebrate
        </p>

        <h1 style={{ fontSize: 'clamp(18px,4.5vw,44px)', fontWeight: 300, letterSpacing: '-1px', lineHeight: 1.1, color: primary, margin: '0 0 4px' }}>
          {data.hostNames}
        </h1>

        <p style={{ fontSize: 'clamp(10px,2vw,20px)', fontWeight: 600, letterSpacing: '1px', color: accent, margin: '0 0 20px', textTransform: 'uppercase' }}>
          {data.eventTitle}
        </p>

        {/* Rule with diamond */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
          <div style={{ flex: 1, maxWidth: '80px', height: '1px', background: primary }} />
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><rect x="2" y="2" width="8" height="8" transform="rotate(45 6 6)" fill={accent} /></svg>
          <div style={{ flex: 1, maxWidth: '80px', height: '1px', background: primary }} />
        </div>

        {data.photo && (
          <div style={{ width: 'clamp(60px,14vw,96px)', height: 'clamp(60px,14vw,96px)', margin: '0 auto 16px', overflow: 'hidden', border: `1px solid ${accent}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.photo} alt="Event" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ border: `1px solid ${primary}20`, padding: 'clamp(10px,2vw,20px)', marginBottom: '16px' }}>
          <p style={{ fontSize: 'clamp(10px,1.8vw,15px)', fontWeight: 600, margin: '0 0 4px', letterSpacing: '1px' }}>{data.date}</p>
          <p style={{ fontSize: 'clamp(8px,1.3vw,12px)', color: secondary, margin: '0 0 6px' }}>{data.time}</p>
          <p style={{ fontSize: 'clamp(9px,1.5vw,14px)', margin: 0 }}>{data.venue}</p>
          {data.mapLink && (
            <a href={data.mapLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'clamp(7px,1.1vw,10px)', color: accent, display: 'block', marginTop: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Map ↗
            </a>
          )}
        </div>

        {data.message && (
          <p style={{ fontSize: 'clamp(7px,1.1vw,11px)', color: secondary, lineHeight: 1.8, maxWidth: '70%', margin: '0 auto' }}>
            {data.message}
          </p>
        )}

        <div style={{ width: '40px', height: '2px', background: accent, margin: '16px auto 0' }} />
      </div>
    </div>
  );
}

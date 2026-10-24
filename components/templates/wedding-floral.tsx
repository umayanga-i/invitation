'use client';

import type { TemplateData } from './types';

/**
 * Wedding Floral — ivory/dusty-rose, botanical SVG borders, serif fonts,
 * ornate gold dividers. Calligraphy-style couple names.
 */
export default function WeddingFloral(data: TemplateData) {
  const { primary, secondary, accent } = data.colors;
  return (
    <div
      className="h-full w-full relative overflow-hidden flex flex-col items-center justify-between"
      style={{ background: `linear-gradient(160deg, #fffdf8 60%, #f9f0e8 100%)`, fontFamily: 'Georgia, serif', color: primary }}
    >
      {/* Top botanical SVG border */}
      <svg viewBox="0 0 400 90" className="w-full" style={{ opacity: 0.7 }} aria-hidden="true">
        <ellipse cx="200" cy="10" rx="180" ry="8" fill="none" stroke={secondary} strokeWidth="0.6" />
        {[40,80,120,160,200,240,280,320,360].map((x, i) => (
          <g key={i} transform={`translate(${x},18)`}>
            <ellipse rx="10" ry="16" fill="none" stroke={accent} strokeWidth="0.8" transform={`rotate(${i % 2 === 0 ? -20 : 20})`} />
            <ellipse rx="6" ry="10" fill="none" stroke={secondary} strokeWidth="0.5" transform={`rotate(${i % 2 === 0 ? 20 : -20})`} />
            <circle r="2" fill={accent} />
          </g>
        ))}
        <path d="M10 50 Q200 30 390 50" fill="none" stroke={secondary} strokeWidth="0.5" />
        {[60,120,180,240,300].map((x, i) => (
          <g key={`f${i}`} transform={`translate(${x},50)`}>
            <circle r="5" fill={accent} opacity="0.3" />
            <circle r="3" fill={secondary} opacity="0.5" />
          </g>
        ))}
      </svg>

      {/* Guest salutation */}
      {data.guestName && (
        <p style={{ color: secondary, fontSize: 'clamp(9px,1.5vw,13px)', letterSpacing: '1px', marginTop: '-4px', fontStyle: 'italic' }}>
          Dear {data.guestName},
        </p>
      )}

      {/* Together with families */}
      <p style={{ fontSize: 'clamp(7px,1.2vw,11px)', letterSpacing: '3px', color: secondary, textTransform: 'uppercase' }}>
        Together with their families
      </p>

      {/* Couple names */}
      <h1 style={{ fontSize: 'clamp(20px,5vw,48px)', fontWeight: 400, fontStyle: 'italic', lineHeight: 1.15, textAlign: 'center', margin: '0 16px', color: primary }}>
        {data.hostNames}
      </h1>

      {/* Gold ornate divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '70%' }}>
        <div style={{ flex: 1, height: '1px', background: `linear-gradient(to right, transparent, ${accent})` }} />
        <svg viewBox="0 0 30 30" width="22" height="22" aria-hidden="true">
          <polygon points="15,2 18,11 27,11 20,17 23,26 15,20 7,26 10,17 3,11 12,11" fill={accent} opacity="0.6" />
        </svg>
        <div style={{ flex: 1, height: '1px', background: `linear-gradient(to left, transparent, ${accent})` }} />
      </div>

      {/* Request */}
      <p style={{ fontSize: 'clamp(8px,1.3vw,12px)', letterSpacing: '1.5px', color: secondary, textTransform: 'uppercase', textAlign: 'center' }}>
        Request the honour of your presence at
      </p>

      {/* Event title */}
      <h2 style={{ fontSize: 'clamp(12px,2.5vw,24px)', fontWeight: 400, textAlign: 'center', margin: '0 12px', color: primary }}>
        {data.eventTitle}
      </h2>

      {/* Photo */}
      {data.photo && (
        <div style={{ width: 'clamp(60px,15vw,100px)', height: 'clamp(60px,15vw,100px)', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${accent}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.photo} alt="Event photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Event details box */}
      <div style={{ textAlign: 'center', background: 'rgba(255,253,248,0.8)', border: `1px solid ${accent}30`, borderRadius: '8px', padding: 'clamp(8px,2vw,18px) clamp(12px,3vw,28px)' }}>
        <p style={{ fontSize: 'clamp(10px,1.8vw,16px)', fontWeight: 600, color: primary, margin: '0 0 4px', letterSpacing: '0.5px' }}>{data.date}</p>
        <p style={{ fontSize: 'clamp(8px,1.4vw,13px)', color: secondary, margin: '0 0 6px' }}>{data.time}</p>
        <p style={{ fontSize: 'clamp(9px,1.5vw,14px)', fontStyle: 'italic', color: primary, margin: 0 }}>{data.venue}</p>
        {data.mapLink && (
          <a href={data.mapLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'clamp(7px,1.1vw,11px)', color: accent, display: 'block', marginTop: '4px' }}>
            View map ↗
          </a>
        )}
      </div>

      {/* Message */}
      {data.message && (
        <p style={{ fontSize: 'clamp(7px,1.2vw,11px)', fontStyle: 'italic', color: secondary, textAlign: 'center', maxWidth: '75%', lineHeight: 1.7 }}>
          &ldquo;{data.message}&rdquo;
        </p>
      )}

      {/* Bottom botanical SVG border */}
      <svg viewBox="0 0 400 90" className="w-full" style={{ transform: 'scaleY(-1)', opacity: 0.7 }} aria-hidden="true">
        <ellipse cx="200" cy="10" rx="180" ry="8" fill="none" stroke={secondary} strokeWidth="0.6" />
        {[40,80,120,160,200,240,280,320,360].map((x, i) => (
          <g key={i} transform={`translate(${x},18)`}>
            <ellipse rx="10" ry="16" fill="none" stroke={accent} strokeWidth="0.8" transform={`rotate(${i % 2 === 0 ? -20 : 20})`} />
            <circle r="2" fill={accent} />
          </g>
        ))}
        <path d="M10 50 Q200 30 390 50" fill="none" stroke={secondary} strokeWidth="0.5" />
      </svg>
    </div>
  );
}

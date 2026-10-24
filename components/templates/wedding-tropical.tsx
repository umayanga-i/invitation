'use client';

import type { TemplateData } from './types';

/**
 * Wedding Tropical — deep green, orange/yellow tropical leaves (CSS polygon
 * decorations), warm modern font.
 */
export default function WeddingTropical(data: TemplateData) {
  const { primary, secondary, accent } = data.colors;

  const leaves = [
    { x: '-2%', y: '10%', r: '-20', s: 1 },
    { x: '-2%', y: '30%', r: '10', s: 0.8 },
    { x: '88%', y: '5%', r: '160', s: 1.1 },
    { x: '90%', y: '28%', r: '200', s: 0.9 },
    { x: '5%', y: '65%', r: '-30', s: 0.85 },
    { x: '85%', y: '70%', r: '170', s: 0.95 },
  ];

  return (
    <div
      className="h-full w-full relative overflow-hidden flex flex-col items-center justify-center"
      style={{ background: `linear-gradient(140deg, #0d3320 0%, #1a5c35 60%, #0d3320 100%)`, fontFamily: 'system-ui, sans-serif', color: '#fff' }}
    >
      {/* Tropical leaf decorations */}
      {leaves.map((l, i) => (
        <svg
          key={i}
          viewBox="0 0 60 120"
          style={{ position: 'absolute', left: l.x, top: l.y, width: 'clamp(30px,7vw,70px)', transform: `rotate(${l.r}deg) scale(${l.s})`, opacity: 0.55 }}
          aria-hidden="true"
        >
          <path d="M30 115 Q5 70 15 10 Q30 0 45 10 Q55 70 30 115Z" fill={primary} />
          <path d="M30 115 L30 20" stroke={secondary} strokeWidth="1.5" fill="none" />
          {[20,35,50,65,80,95].map((y, j) => (
            <path key={j} d={`M30 ${y} Q${j%2===0?'15':'45'} ${y-8} ${j%2===0?'10':'50'} ${y-4}`} stroke={secondary} strokeWidth="0.8" fill="none" />
          ))}
        </svg>
      ))}

      {/* Sun circle */}
      <div style={{ position: 'absolute', top: '-8%', right: '15%', width: 'clamp(60px,12vw,120px)', height: 'clamp(60px,12vw,120px)', borderRadius: '50%', background: `radial-gradient(circle, ${accent}88 0%, ${accent}22 60%, transparent 80%)` }} aria-hidden="true" />

      <div style={{ textAlign: 'center', zIndex: 1, padding: '0 clamp(16px,5vw,40px)', maxWidth: '90%' }}>
        {data.guestName && (
          <p style={{ fontSize: 'clamp(8px,1.4vw,13px)', letterSpacing: '1.5px', color: accent, marginBottom: '10px' }}>
            Dear {data.guestName},
          </p>
        )}

        <p style={{ fontSize: 'clamp(7px,1.1vw,10px)', letterSpacing: '3px', color: accent, textTransform: 'uppercase', marginBottom: '8px', opacity: 0.85 }}>
          You are warmly invited to
        </p>

        <h1 style={{ fontSize: 'clamp(22px,5vw,50px)', fontWeight: 700, lineHeight: 1.1, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
          {data.hostNames}
        </h1>

        <h2 style={{ fontSize: 'clamp(11px,2.2vw,20px)', fontWeight: 400, color: accent, margin: '0 0 20px', letterSpacing: '1px' }}>
          {data.eventTitle}
        </h2>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '18px' }}>
          <div style={{ width: 'clamp(30px,8vw,60px)', height: '1px', background: accent, opacity: 0.5 }} />
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <circle cx="10" cy="10" r="3" fill={accent} />
            <circle cx="10" cy="10" r="7" fill="none" stroke={accent} strokeWidth="1" opacity="0.5" />
          </svg>
          <div style={{ width: 'clamp(30px,8vw,60px)', height: '1px', background: accent, opacity: 0.5 }} />
        </div>

        {data.photo && (
          <div style={{ width: 'clamp(60px,14vw,90px)', height: 'clamp(60px,14vw,90px)', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${accent}`, margin: '0 auto 14px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.photo} alt="Event" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', borderRadius: '10px', padding: 'clamp(10px,2vw,18px)', marginBottom: '14px', border: `1px solid ${accent}30` }}>
          <p style={{ fontSize: 'clamp(10px,1.8vw,15px)', fontWeight: 600, margin: '0 0 4px', color: accent }}>{data.date}</p>
          <p style={{ fontSize: 'clamp(8px,1.3vw,12px)', color: 'rgba(255,255,255,0.75)', margin: '0 0 4px' }}>{data.time}</p>
          <p style={{ fontSize: 'clamp(9px,1.5vw,13px)', color: '#fff', margin: 0 }}>{data.venue}</p>
          {data.mapLink && (
            <a href={data.mapLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'clamp(7px,1.1vw,10px)', color: accent, display: 'block', marginTop: '4px' }}>
              View map ↗
            </a>
          )}
        </div>

        {data.message && (
          <p style={{ fontSize: 'clamp(7px,1.2vw,11px)', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: 1.7, maxWidth: '75%', margin: '0 auto' }}>
            {data.message}
          </p>
        )}
      </div>
    </div>
  );
}

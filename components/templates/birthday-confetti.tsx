'use client';

import type { TemplateData } from './types';

/**
 * Birthday Confetti — purple/pink gradient, confetti dots, playful style, balloons.
 */
export default function BirthdayConfetti(data: TemplateData) {
  const { primary, secondary, accent } = data.colors;

  // Confetti positions
  const confetti = Array.from({ length: 28 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    top: `${(i * 53) % 100}%`,
    size: 4 + (i % 5) * 2,
    color: [primary, secondary, accent, '#f472b6', '#facc15', '#34d399'][i % 6],
    rot: (i * 47) % 360,
    shape: i % 3,
  }));

  return (
    <div
      className="h-full w-full relative overflow-hidden flex flex-col items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 50%, #ec4899 100%)`, fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Confetti dots */}
      {confetti.map((c, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: c.left,
            top: c.top,
            width: c.size,
            height: c.size * (c.shape === 2 ? 2 : 1),
            background: c.color,
            borderRadius: c.shape === 0 ? '50%' : c.shape === 1 ? '1px' : '0',
            transform: `rotate(${c.rot}deg)`,
            opacity: 0.7,
          }}
        />
      ))}

      {/* Balloon CSS shapes */}
      {[
        { left: '4%', top: '12%', color: accent },
        { left: '85%', top: '8%', color: secondary },
        { left: '8%', top: '70%', color: '#f472b6' },
        { left: '80%', top: '68%', color: primary },
      ].map((b, i) => (
        <div key={i} aria-hidden="true" style={{ position: 'absolute', left: b.left, top: b.top }}>
          <div style={{ width: 'clamp(16px,4vw,32px)', height: 'clamp(20px,5vw,40px)', background: b.color, borderRadius: '50% 50% 45% 45%', opacity: 0.75 }} />
          <div style={{ width: '1px', height: 'clamp(12px,3vw,24px)', background: '#fff', margin: '0 auto', opacity: 0.5 }} />
        </div>
      ))}

      <div style={{ textAlign: 'center', zIndex: 1, padding: '0 clamp(16px,4vw,32px)', maxWidth: '88%' }}>
        {data.guestName && (
          <p style={{ fontSize: 'clamp(8px,1.4vw,13px)', color: 'rgba(255,255,255,0.85)', marginBottom: '8px', letterSpacing: '1px' }}>
            Hey {data.guestName}! 🎉
          </p>
        )}

        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: 'clamp(8px,2vw,16px)', marginBottom: '14px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}>
          <p style={{ fontSize: 'clamp(9px,1.5vw,14px)', color: 'rgba(255,255,255,0.85)', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>
            🎂 You&apos;re invited to celebrate 🎂
          </p>
          <h1 style={{ fontSize: 'clamp(16px,4vw,38px)', fontWeight: 800, color: '#fff', margin: '4px 0', lineHeight: 1.1, textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            {data.hostNames}
          </h1>
          <h2 style={{ fontSize: 'clamp(10px,2vw,18px)', fontWeight: 600, color: accent, margin: '0', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {data.eventTitle}
          </h2>
        </div>

        {data.photo && (
          <div style={{ width: 'clamp(55px,13vw,85px)', height: 'clamp(55px,13vw,85px)', borderRadius: '50%', overflow: 'hidden', border: '3px solid #fff', margin: '0 auto 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.photo} alt="Birthday" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: 'clamp(8px,1.5vw,14px)', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.3)' }}>
          <p style={{ fontSize: 'clamp(10px,1.8vw,15px)', color: '#fff', fontWeight: 700, margin: '0 0 2px' }}>📅 {data.date}</p>
          <p style={{ fontSize: 'clamp(8px,1.3vw,12px)', color: 'rgba(255,255,255,0.8)', margin: '0 0 2px' }}>⏰ {data.time}</p>
          <p style={{ fontSize: 'clamp(8px,1.3vw,12px)', color: 'rgba(255,255,255,0.9)', margin: 0 }}>📍 {data.venue}</p>
          {data.mapLink && (
            <a href={data.mapLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'clamp(7px,1.1vw,10px)', color: accent, display: 'block', marginTop: '4px' }}>
              Get directions ↗
            </a>
          )}
        </div>

        {data.message && (
          <p style={{ fontSize: 'clamp(7px,1.2vw,11px)', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', lineHeight: 1.7 }}>
            {data.message}
          </p>
        )}
      </div>
    </div>
  );
}

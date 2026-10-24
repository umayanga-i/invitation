'use client';

import type { TemplateData } from './types';

/**
 * Birthday Fun — bright yellow, red, orange. Big bold BIRTHDAY text. Festive.
 */
export default function BirthdayFun(data: TemplateData) {
  const { primary, secondary, accent } = data.colors;

  return (
    <div
      className="h-full w-full relative overflow-hidden flex flex-col items-center justify-center"
      style={{ background: primary, fontFamily: 'Impact, Arial Black, sans-serif', color: '#fff' }}
    >
      {/* Zigzag top banner */}
      <svg viewBox="0 0 400 30" style={{ position: 'absolute', top: 0, left: 0, width: '100%' }} aria-hidden="true">
        <polyline points="0,0 20,28 40,0 60,28 80,0 100,28 120,0 140,28 160,0 180,28 200,0 220,28 240,0 260,28 280,0 300,28 320,0 340,28 360,0 380,28 400,0" fill={secondary} />
      </svg>

      {/* Stars scattered */}
      {[
        {x:'8%',y:'15%',s:22},{x:'88%',y:'12%',s:18},{x:'5%',y:'75%',s:16},{x:'88%',y:'78%',s:20},{x:'50%',y:'6%',s:14},{x:'45%',y:'92%',s:14},
      ].map((st,i)=>(
        <svg key={i} viewBox="0 0 20 20" style={{ position:'absolute', left:st.x, top:st.y, width:st.s, height:st.s, opacity:0.7 }} aria-hidden="true">
          <polygon points="10,1 12.6,7.4 19.5,7.4 14,11.6 16.2,18 10,13.8 3.8,18 6,11.6 0.5,7.4 7.4,7.4" fill={accent} />
        </svg>
      ))}

      {data.guestName && (
        <p style={{ fontSize: 'clamp(9px,1.6vw,14px)', color: accent, letterSpacing: '1px', marginBottom: '8px', zIndex: 1, textShadow: '1px 1px 0 rgba(0,0,0,0.3)', fontFamily: 'system-ui, sans-serif', fontWeight: 700 }}>
          HEY {data.guestName.toUpperCase()}! 🎉
        </p>
      )}

      <div style={{ textAlign: 'center', zIndex: 1, padding: '0 clamp(12px,4vw,28px)' }}>
        {/* Big BIRTHDAY banner */}
        <div style={{ background: secondary, padding: 'clamp(4px,1vw,10px) clamp(12px,3vw,24px)', marginBottom: '10px', transform: 'rotate(-1.5deg)', boxShadow: `4px 4px 0 ${accent}` }}>
          <p style={{ fontSize: 'clamp(12px,3vw,28px)', letterSpacing: '4px', color: '#fff', margin: 0, textShadow: '2px 2px 0 rgba(0,0,0,0.25)' }}>
            🎉 BIRTHDAY PARTY 🎉
          </p>
        </div>

        <h1 style={{ fontSize: 'clamp(20px,5vw,52px)', lineHeight: 1, color: '#fff', margin: '4px 0 8px', textShadow: `3px 3px 0 ${secondary}`, letterSpacing: '-1px' }}>
          {data.hostNames}
        </h1>

        <div style={{ background: accent, display: 'inline-block', padding: 'clamp(4px,1vw,8px) clamp(12px,3vw,24px)', transform: 'rotate(1deg)', marginBottom: '16px', boxShadow: `3px 3px 0 rgba(0,0,0,0.2)` }}>
          <p style={{ fontSize: 'clamp(8px,1.5vw,14px)', color: '#fff', margin: 0, letterSpacing: '2px' }}>
            {data.eventTitle.toUpperCase()}
          </p>
        </div>

        {data.photo && (
          <div style={{ width: 'clamp(55px,13vw,85px)', height: 'clamp(55px,13vw,85px)', borderRadius: '50%', overflow: 'hidden', border: `4px solid #fff`, margin: '0 auto 12px', boxShadow: `0 0 0 4px ${accent}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.photo} alt="Birthday" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.18)', border: `3px solid #fff`, padding: 'clamp(8px,1.5vw,14px)', marginBottom: '10px' }}>
          <p style={{ fontSize: 'clamp(10px,1.8vw,16px)', color: '#fff', margin: '0 0 2px', textShadow: '1px 1px 0 rgba(0,0,0,0.2)' }}>{data.date}</p>
          <p style={{ fontSize: 'clamp(8px,1.3vw,13px)', color: accent, margin: '0 0 2px' }}>{data.time}</p>
          <p style={{ fontSize: 'clamp(8px,1.3vw,13px)', color: '#fff', margin: 0 }}>{data.venue}</p>
          {data.mapLink && (
            <a href={data.mapLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'clamp(7px,1.1vw,10px)', color: accent, display: 'block', marginTop: '4px' }}>
              Get there ↗
            </a>
          )}
        </div>

        {data.message && (
          <p style={{ fontSize: 'clamp(7px,1.2vw,11px)', color: 'rgba(255,255,255,0.9)', lineHeight: 1.7, fontFamily: 'system-ui, sans-serif', fontWeight: 400, fontStyle: 'italic' }}>
            {data.message}
          </p>
        )}
      </div>

      {/* Zigzag bottom banner */}
      <svg viewBox="0 0 400 30" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', transform: 'scaleY(-1)' }} aria-hidden="true">
        <polyline points="0,0 20,28 40,0 60,28 80,0 100,28 120,0 140,28 160,0 180,28 200,0 220,28 240,0 260,28 280,0 300,28 320,0 340,28 360,0 380,28 400,0" fill={secondary} />
      </svg>
    </div>
  );
}

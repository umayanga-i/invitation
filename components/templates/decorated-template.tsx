'use client';

import type { CSSProperties } from 'react';
import type { TemplateData } from './types';

export type DecoratedProps = TemplateData & { variant: number; motif: string };

/** Shared responsive canvas; each template supplies a different composition and motif. */
export function DecoratedTemplate({
  hostNames, eventTitle, date, time, venue, mapLink, message, photo, colors, guestName,
  variant, motif,
}: DecoratedProps) {
  const layouts = [
    { align: 'center', radius: '0', frame: 'inset 5%', weight: 400 },
    { align: 'left', radius: '0', frame: 'inset 0 7%', weight: 600 },
    { align: 'center', radius: '50% 50% 8px 8px', frame: 'inset 8% 12%', weight: 400 },
    { align: 'center', radius: '18px', frame: 'inset 6%', weight: 700 },
    { align: 'left', radius: '0 24px 0 24px', frame: 'inset 0 9%', weight: 400 },
    { align: 'center', radius: '50%', frame: 'inset 11% 14%', weight: 500 },
    { align: 'right', radius: '0', frame: 'inset 0 8%', weight: 400 },
    { align: 'center', radius: '8px 8px 40px 40px', frame: 'inset 6% 10%', weight: 500 },
    { align: 'left', radius: '14px 0', frame: 'inset 6%', weight: 700 },
    { align: 'center', radius: '0', frame: 'inset 9% 5%', weight: 300 },
    { align: 'right', radius: '30px 0 30px 0', frame: 'inset 5% 10%', weight: 600 },
    { align: 'center', radius: '4px', frame: 'inset 4%', weight: 400 },
  ] as const;
  const layout = layouts[variant % layouts.length];
  const align = layout.align;
  const panel: CSSProperties = {
    position: 'absolute', inset: layout.frame, border: `1px solid ${colors.accent}99`,
    borderRadius: layout.radius, pointerEvents: 'none',
  };
  const items = Array.from({ length: 8 }, (_, index) => index);

  return (
    <article className="relative isolate flex min-h-[500px] w-full flex-col items-center justify-center overflow-hidden px-7 py-12 text-center sm:min-h-[640px] sm:px-14 sm:py-16" style={{ background: `linear-gradient(${variant % 2 ? '145deg' : '35deg'}, ${colors.secondary}, ${colors.secondary} 55%, ${colors.accent}30)`, color: colors.primary, fontFamily: variant % 3 === 0 ? 'Georgia, serif' : 'var(--font-geist-sans), sans-serif', textAlign: align }}>
      <div style={panel} />
      <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-35" viewBox="0 0 400 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {variant % 4 === 0 ? <>
          {items.map((item) => <g key={item} transform={`translate(${item % 2 ? 350 : 50} ${70 + item * 72}) rotate(${item * 26})`} fill="none" stroke={colors.accent} strokeWidth="1.2"><ellipse rx="17" ry="42" /><ellipse rx="7" ry="27" /><circle r="4" fill={colors.accent} /></g>)}
          <path d="M0 0Q110 120 0 240M400 400Q290 520 400 640" fill="none" stroke={colors.primary} strokeWidth="2" />
        </> : variant % 4 === 1 ? <>
          {items.map((item) => <path key={item} d={`M${item * 56 - 30} 0L${item * 56 + 30} 640`} stroke={colors.accent} strokeWidth={item % 2 ? '1' : '4'} opacity=".6" />)}
          {items.slice(0, 5).map((item) => <circle key={`c${item}`} cx={40 + item * 80} cy={80 + (item % 2) * 480} r={20 + item * 3} fill="none" stroke={colors.primary} strokeWidth="1.5" />)}
        </> : variant % 4 === 2 ? <>
          {items.map((item) => <g key={item} transform={`translate(${30 + (item % 4) * 110} ${45 + Math.floor(item / 4) * 535})`} fill="none" stroke={colors.accent} strokeWidth="1.5"><circle r="24"/><circle r="15"/><path d="M-34 0H34M0-34V34" /></g>)}
        </> : <>
          <path d="M-20 120Q200 -20 420 120V0H-20ZM-20 520Q200 660 420 520V640H-20Z" fill={colors.accent} opacity=".24" />
          {items.map((item) => <polygon key={item} points="0,-13 4,-4 13,0 4,4 0,13 -4,4 -13,0 -4,-4" transform={`translate(${30 + item * 50} ${80 + (item % 2) * 480})`} fill={colors.primary} opacity=".5" />)}
        </>}
      </svg>

      <span className="mb-5 text-[10px] font-semibold uppercase tracking-[.28em] opacity-75 sm:text-xs">{motif}</span>
      {guestName && <p className="mb-4 text-xs italic sm:text-sm">Dear {guestName},</p>}
      {photo && <div className="mb-5 h-20 w-20 overflow-hidden rounded-full border-2 sm:h-28 sm:w-28" style={{ borderColor: colors.accent }}><img src={photo} alt="Celebration" className="h-full w-full object-cover" /></div>}
      <p className="mb-3 text-[10px] uppercase tracking-[.22em] opacity-70 sm:text-xs">You are warmly invited</p>
      <h1 className="max-w-full text-balance text-3xl leading-tight sm:text-5xl" style={{ fontWeight: layout.weight }}>{hostNames}</h1>
      <span className="my-5 block h-px w-20" style={{ background: colors.accent }} />
      <h2 className="max-w-lg text-lg font-medium sm:text-2xl">{eventTitle}</h2>
      {message && <p className="mt-4 max-w-lg text-xs leading-6 opacity-80 sm:text-sm sm:leading-7">{message}</p>}
      <div className="mt-7 space-y-1 text-xs sm:mt-9 sm:text-sm">
        <p className="font-semibold tracking-wide">{date}</p><p>{time}</p><p>{venue}</p>
        {mapLink && <a href={mapLink} target="_blank" rel="noreferrer" className="mt-2 inline-block underline underline-offset-4">View location ↗</a>}
      </div>
      <span className="mt-8 text-xl" aria-hidden="true" style={{ color: colors.accent }}>{motif.includes('Corporate') ? '✦' : '❧'}</span>
    </article>
  );
}

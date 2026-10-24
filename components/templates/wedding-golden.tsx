'use client';

// Adapted from the supplied Nimesh & Dilhani wedding invitation HTML.
import { useEffect, useId, useState, type CSSProperties } from 'react';
import { GOLDEN_WEDDING_DETAILS, type WeddingPhotoSlot } from '@/lib/wedding-golden';
import { TemplatePhotoSlot } from './template-photo-slot';
import type { TemplateData } from './types';
import styles from './wedding-golden.module.css';
import keepsakeStyles from './wedding-keepsake.module.css';

function Ornament() {
  return <div className={styles.ornament} aria-hidden="true"><i /></div>;
}

function EventIcon({ index }: { index: number }) {
  return <svg viewBox="0 0 48 48" aria-hidden="true">
    {index === 0 ? <><circle cx="24" cy="4" r="1.4" /><path d="M24 6v6M21 16c0-4 6-4 6 0" /><ellipse cx="24" cy="17" rx="8" ry="2.4" /><path d="M24 19v18" /><ellipse cx="24" cy="38" rx="10" ry="2.4" /><path d="M16 41h16" /></>
      : index === 1 ? <><path d="M21 11l3-4 3 4" /><circle cx="18" cy="28" r="9" /><circle cx="30" cy="28" r="9" /></>
        : index === 2 ? <path d="M14 8h8l-1 7c-.5 4-2 6-3 6s-2.5-2-3-6zM18 21v17M14 39h8M26 8h8l-1 7c-.5 4-2 6-3 6s-2.5-2-3-6zM30 21v17M26 39h8" />
          : <><rect x="20" y="14" width="8" height="6" /><rect x="16" y="22" width="16" height="7" /><rect x="12" y="31" width="24" height="8" /><path d="M10 41h28M24 7v6" /></>}
  </svg>;
}

function Countdown({ eventTime }: { eventTime: number }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!Number.isFinite(eventTime)) return;
    const update = () => setRemaining(Math.max(0, Math.floor((eventTime - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [eventTime]);
  const units = remaining === null ? ['—', '—', '—', '—'] : [Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60];
  return <div className={styles.boxes} aria-label="Wedding countdown">{units.map((value, index) => <div className={styles.box} key={index}><b>{value}</b><hr /><span>{['Days', 'Hours', 'Min', 'Sec'][index]}</span></div>)}</div>;
}

function eventDate(date: string, time = '12:00') {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(time) ? new Date(`${date}T${time}:00+05:30`) : new Date(NaN);
}

function formatDate(date: string, options: Intl.DateTimeFormatOptions) {
  const value = eventDate(date);
  return Number.isFinite(value.getTime()) ? new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'Asia/Colombo' }).format(value) : date;
}

function formatTime(time: string) {
  const value = eventDate('2026-12-27', time);
  return Number.isFinite(value.getTime()) ? new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Colombo', hour: 'numeric', minute: '2-digit' }).format(value) : time;
}

export default function WeddingGolden(data: TemplateData & { keepsake?: boolean }) {
  const mode = data.displayMode ?? 'thumbnail';
  const thumbnail = mode === 'thumbnail';
  const publicPage = mode === 'public';
  const details = data.weddingDetails ?? GOLDEN_WEDDING_DETAILS;
  const id = useId().replace(/:/g, '');
  const names = data.hostNames.split(/\s*(?:&|\band\b)\s*/i).filter(Boolean);
  const photos = data.photos ?? {};
  const dateLabel = formatDate(data.date, { day: 'numeric', month: 'long', year: 'numeric' });
  const shortDate = formatDate(data.date, { day: 'numeric', month: 'short', year: 'numeric' });
  const dayLabel = formatDate(data.date, { weekday: 'long' });
  const eventTime = eventDate(data.date, data.time).getTime();
  const palette = { '--wg-cream': data.colors.secondary, '--wg-ink': data.colors.primary, '--wg-gold': data.colors.accent } as CSSProperties;
  const gallerySlots = Array.from({ length: 6 }, (_, index) => `gallery${index + 1}` as WeddingPhotoSlot);
  const visibleGallery = publicPage ? gallerySlots.filter((slot) => photos[slot]) : gallerySlots;
  const directions = data.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([data.venue, details.venueAddress].filter(Boolean).join(', '))}`;
  const calendar = Number.isFinite(eventTime) ? `https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: 'TEMPLATE', text: data.eventTitle || `${data.hostNames} Wedding`,
    dates: [eventTime, eventTime + 2 * 60 * 60 * 1000].map((value) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')).join('/'),
    location: [data.venue, details.venueAddress].filter(Boolean).join(', '), ctz: 'Asia/Colombo',
  })}` : undefined;
  const editor = mode === 'preview' ? { onChange: data.onPhotoChange, onBusyChange: data.onPhotoUploadStateChange } : {};

  return <div className={`${styles.root} ${thumbnail ? styles.thumbnail : ''} ${data.keepsake ? keepsakeStyles.theme : ''}`} style={palette} data-display-mode={mode}>
    <div className={styles.layout}>
      <section className={styles.hero} data-section="hero" tabIndex={-1}>
        <div className={styles.inner}>
          <div data-hero-copy>
          {data.guestName && <p className={styles.greeting}>Dear {data.guestName},</p>}
          <p className={styles.eyebrow}>Together with their families</p><Ornament />
          <h1 className={styles.names}>{names.map((name, index) => <span key={index}>{index > 0 && <em>&amp;</em>}{name}</span>)}</h1>
          <Ornament />
          <div className={styles.parents}>
            {details.firstParents && <div><small>Son of</small><span>{details.firstParents}</span></div>}
            {details.secondParents && <div><small>Daughter of</small><span>{details.secondParents}</span></div>}
          </div>
          <p className={styles.invite}>request the honour of your presence<br />at the celebration of their marriage</p>
          <p className={styles.day}>on {dayLabel}</p><p className={styles.date}>{dateLabel}</p>
          <p className={styles.time}>at {formatTime(data.time)}</p><p className={styles.venueName}>{data.venue}</p>
          </div>
          <TemplatePhotoSlot slot="hero" label="Couple photo" src={photos.hero || data.photo} className={styles.heroPhoto} contain {...editor} />
        </div>
        {!thumbnail && <a className={styles.scroll} href={`#${id}-story`} onClick={(event) => {
          if (mode === 'preview') {
            event.preventDefault();
            event.currentTarget.closest(`.${styles.layout}`)?.querySelector('[data-section="story"]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }}>Scroll<b /></a>}
      </section>

      {!thumbnail && <>
        <section className={styles.countdown}><div className={styles.inner}><Ornament /><p className={styles.eyebrow}>Counting Down To The Wedding</p><Countdown key={String(eventTime)} eventTime={eventTime} /><Ornament /></div></section>

        <section className={styles.section} id={`${id}-story`} data-section="story"><div className={`${styles.inner} ${styles.story}`}>
          <div><p className={styles.eyebrow}>Our Story</p><div className={styles.rule} /><h2>{details.storyTitle}</h2><p className={styles.storyText}>{data.message}</p></div>
          <TemplatePhotoSlot slot="story" label="Story photo" src={photos.story} className={styles.storyPhoto} contain {...editor} />
        </div></section>

        <section className={`${styles.section} ${styles.events}`} data-section="events"><div className={styles.inner}>
          <p className={styles.eyebrow}>Events</p><div className={styles.rule} /><h2>Celebrate With Us</h2>
          <div className={styles.eventGrid}>{details.events.map((event, index) => <article key={index} className={styles.event}>
            <div className={styles.arch}><EventIcon index={index} /></div><h3>{event.title}</h3><p>{shortDate}</p><p>{formatTime(index === 1 ? data.time : event.time)}</p><p className={styles.place}>⌖ {index === 1 ? data.venue : event.venue}</p>
          </article>)}</div>
        </div></section>

        {visibleGallery.length > 0 && <section className={styles.section} data-section="gallery"><div className={styles.inner}>
          <p className={styles.eyebrow}>Gallery</p><h2>Our Moments</h2><Ornament />
          <div className={styles.gallery}>{visibleGallery.map((slot) => <TemplatePhotoSlot key={slot} slot={slot} label={`Gallery photo ${slot.replace('gallery', '')}`} src={photos[slot]} className={styles.galleryPhoto} {...editor} />)}</div>
        </div></section>}

        <section className={`${styles.section} ${styles.venue}`} data-section="venue"><div className={styles.inner}>
          <p className={styles.eyebrow}>Location</p><h2>Wedding Venue</h2><h3 className={styles.location}>⌖ {data.venue}</h3><p className={styles.address}>{details.venueAddress}</p>
          <div className={styles.map}><a className={styles.button} href={directions} target="_blank" rel="noopener noreferrer">Open in Maps</a></div>
          {calendar && <a className={styles.calendar} href={calendar} target="_blank" rel="noopener noreferrer"><span className={styles.calendarIcon} aria-hidden="true">▦</span><span><b>Add to Calendar</b><small>Save the date to your calendar</small></span><span aria-hidden="true">›</span></a>}
        </div></section>

        <section className={`${styles.section} ${styles.rsvp}`} data-section="rsvp"><div className={styles.inner}>
          <p className={styles.eyebrow}>{data.rsvpDeadline ? `Kindly RSVP by ${formatDate(data.rsvpDeadline, { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Kindly RSVP'}</p><h2>We Can’t Wait To Celebrate With You!</h2><Ornament />
          <div className={styles.rsvpPanel}>{data.rsvpContent || <p className={styles.previewRsvp}>Your guests can send their reply here when you share the invitation.</p>}</div>
        </div></section>

        <footer className={styles.footer}><div className={styles.footerGrid}>
          <div><p className={styles.eyebrow}>With love,</p><p className={styles.footerNames}>{[...names].reverse().join(' & ')}</p><p>{dateLabel} · {data.venue}</p><div className={styles.contacts}>{[details.firstPhone, details.secondPhone].map((phone, index) => phone && <a key={index} href={`tel:${phone.replace(/[^+\d]/g, '')}`}>Call {names[index] || `Partner ${index + 1}`}</a>)}</div></div>
          <div><p className={styles.thankYou}>Thank You</p><p>Thank you for being a part of our special day!</p><span aria-hidden="true">♥</span></div>
        </div></footer>
      </>}
    </div>
    {publicPage && <><div className={styles.frame} aria-hidden="true" /><div className={styles.leaves} aria-hidden="true">{[3, 14, 25, 36, 47, 58, 69, 80, 90, 8, 20, 31, 42, 53, 64, 74, 85, 95].map((left, index) => <span key={index} style={{ left: `${left}%`, animationDuration: `${17 + index % 9}s`, animationDelay: `-${index * 5 % 22}s` }}><svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 36 + index % 5 * 6, animationDuration: `${8 + index % 7}s`, animationDirection: index % 2 ? 'reverse' : 'normal' }}><path d="M12 2Q17 7 17 12Q17 17 12 22Q7 17 7 12Q7 7 12 2Z" opacity=".85" /><path d="M12 4L12 21M12 9L14.6 7.2M12 9L9.4 7.2M12 13L15 11M12 13L9 11M12 17L14.4 15.2M12 17L9.6 15.2" stroke="#fff" strokeOpacity=".45" strokeWidth=".7" fill="none" /></svg></span>)}</div></>}
  </div>;
}

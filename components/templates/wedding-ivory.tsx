'use client';

/* Adapted from the supplied wedding invitation index.html. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import type { TemplateData } from './types';
import styles from './wedding-ivory.module.css';

const assets = '/images/templates/wedding-ivory';
const navigation = [['hero', 'Home'], ['story', 'Our Story'], ['events', 'Details'], ['gallery', 'Gallery'], ['venue', 'Location'], ['rsvp', 'RSVP']] as const;

function Ornament() {
  return <div className={styles.ornament} aria-hidden="true">◆</div>;
}

function Countdown({ eventTime }: { eventTime: number }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!Number.isFinite(eventTime)) return;
    const update = () => setRemaining(Math.max(0, eventTime - Date.now()));
    const timer = window.setInterval(update, 1000);
    update();
    return () => window.clearInterval(timer);
  }, [eventTime]);
  const seconds = remaining === null ? null : Math.floor(remaining / 1000);
  const values = seconds === null ? ['—', '—', '—', '—'] : [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60];
  return <div className={styles.boxes} aria-label="Wedding countdown">
    {values.map((value, index) => <div className={styles.box} key={index}><b>{typeof value === 'number' ? String(value).padStart(2, '0') : value}</b><span>{['Days', 'Hours', 'Minutes', 'Seconds'][index]}</span></div>)}
  </div>;
}

export default function WeddingIvory(data: TemplateData) {
  const mode = data.displayMode ?? 'thumbnail';
  const id = useId().replace(/:/g, '');
  const root = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const envelope = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);
  const [active, setActive] = useState('hero');
  const isPublic = mode === 'public';
  const isThumbnail = mode === 'thumbnail';
  const names = data.hostNames.split(/\s*(?:&|\band\b)\s*/i).filter(Boolean);
  const initials = names.map((name) => Array.from(name.trim())[0] ?? '').slice(0, 2);
  const eventTime = /^\d{4}-\d{2}-\d{2}$/.test(data.date) && /^\d{2}:\d{2}$/.test(data.time)
    ? new Date(`${data.date}T${data.time}:00+05:30`).getTime() : NaN;
  const eventDate = Number.isFinite(eventTime) ? new Date(eventTime) : null;
  const dateLabel = eventDate ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(eventDate) : data.date;
  const timeLabel = eventDate ? new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Colombo', hour: 'numeric', minute: '2-digit' }).format(eventDate) : data.time;
  const footerDate = eventDate ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(eventDate).replaceAll('/', ' . ') : data.date;
  const photo = data.photo || `${assets}/couple-hero.webp`;
  const directions = data.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.venue)}`;
  const href = (section: string) => `#${id}-${section}`;
  const palette = { '--wi-ink': data.colors.primary, '--wi-bg': data.colors.secondary, '--wi-gold': data.colors.accent } as CSSProperties;

  useEffect(() => {
    if (!isPublic || opened) return;
    const dialog = envelope.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
    };
  }, [isPublic, opened]);

  useEffect(() => {
    if (!opened || !isPublic) return;
    hero.current?.focus({ preventScroll: true });
  }, [opened, isPublic]);

  useEffect(() => {
    if (!isPublic || !opened || !root.current) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.getAttribute('data-section') || 'hero');
    }, { rootMargin: '-10% 0px -55% 0px' });
    root.current.querySelectorAll('[data-section]').forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [isPublic, opened]);

  function navigate(event: React.MouseEvent<HTMLAnchorElement>, section: string) {
    if (mode !== 'preview') return;
    event.preventDefault();
    root.current?.querySelector(`[data-section="${section}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  const calendar = eventDate ? `https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: 'TEMPLATE', text: `${data.hostNames} — ${data.eventTitle}`,
    dates: [eventDate, new Date(eventTime + 4 * 60 * 60 * 1000)].map((date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')).join('/'),
    location: data.venue, details: data.message || '', ctz: 'Asia/Colombo',
  })}` : undefined;

  return <div ref={root} className={`${styles.root} ${isThumbnail ? styles.thumbnail : styles.page}`} style={palette} data-display-mode={mode}>
    {isPublic && !opened && <dialog ref={envelope} className={styles.envelope} aria-label="Wedding invitation" onCancel={(event) => { event.preventDefault(); setOpened(true); }}>
      <div className={styles.envelopeTop}><p className={styles.script}>You are invited</p><span className={styles.monogram}>{initials.join(' & ')}</span>{data.guestName && <p>Dear {data.guestName},</p>}</div>
      <button className={styles.button} type="button" autoFocus onClick={() => setOpened(true)}>Tap to open</button>
    </dialog>}

    <div inert={isPublic && !opened}>
      {!isThumbnail && <header className={styles.header}>
        <a className={styles.monogram} href={href('hero')} onClick={(event) => navigate(event, 'hero')} aria-label={data.hostNames}>{initials.join(' & ')}</a>
        <nav aria-label="Wedding navigation">{navigation.map(([section, label]) => <a key={section} href={href(section)} aria-current={active === section ? 'location' : undefined} onClick={(event) => navigate(event, section)}>{label}</a>)}</nav>
      </header>}

      <section ref={hero} tabIndex={-1} className={styles.hero} id={`${id}-hero`} data-section="hero">
        <div className={styles.heroText}>
          {data.guestName && <p className={styles.greeting}>Dear {data.guestName},</p>}
          <p className={styles.caps}>Together with their families</p>
          <h1 className={styles.names}>{names.map((name, index) => <span key={index}>{index > 0 && <em className={styles.and}>&amp;</em>}{name}</span>)}</h1>
          <p className={styles.invite}>joyfully invite you to celebrate their marriage</p>
          <Ornament />
          <h2 className={styles.eventTitle}>{data.eventTitle}</h2>
          <p className={styles.date}>{dateLabel}</p>
          <p className={styles.details}>{timeLabel} · {data.venue}</p>
        </div>
        <div className={styles.arch}><img src={photo} alt={data.hostNames} className={styles.photo} style={{ objectPosition: '50% 30%' }} /></div>
      </section>

      {!isThumbnail && <>
        <section className={styles.countdown} aria-label="Countdown to our wedding">
          <img src={`${assets}/countdown-floral.webp`} alt="" className={styles.countdownFloral} loading="lazy" />
          <p className={styles.script}>We are getting</p><h2>Married</h2>
          <Countdown key={String(eventTime)} eventTime={eventTime} />
          <p className={styles.caps}>Until {dateLabel}</p>
        </section>

        <section className={styles.section} id={`${id}-story`} data-section="story">
          <div className={styles.sectionHead}><p className={styles.caps}>Our next chapter</p><h2>Our Story</h2><Ornament /></div>
          <div className={styles.story}>
            <div className={styles.arch}><img src={`${assets}/story.webp`} alt="A couple walking hand in hand by the Galle lighthouse" className={styles.photo} loading="lazy" /></div>
            <div className={styles.storyText}><p className={styles.script}>A lifetime of little moments.</p><p>{data.message || 'A new chapter begins, surrounded by the people we love. We would be delighted to share our wedding day with you.'}</p><Ornament /><p className={styles.caps}>{data.hostNames}</p></div>
          </div>
        </section>

        <section className={styles.section} id={`${id}-events`} data-section="events">
          <div className={styles.sectionHead}><p className={styles.caps}>{dateLabel}</p><h2>The Celebration</h2><Ornament /></div>
          <div className={styles.events}>
            <article className={styles.event}><span className={styles.icon} aria-hidden="true">⚭</span><h3>{data.eventTitle}</h3><p className={styles.eventTime}>{timeLabel}</p><p>{data.venue}</p><p>Join us as we begin our forever.</p></article>
            <article className={styles.event}><span className={styles.icon} aria-hidden="true">♡</span><h3>Celebrate with us</h3><p className={styles.eventTime}>{dateLabel}</p><p>With our families and friends</p><p>A day of love, laughter and memories.</p></article>
          </div>
          {calendar && <a className={`${styles.button} ${styles.saveDate}`} href={calendar} target="_blank" rel="noopener noreferrer">Save our date ↗</a>}
        </section>

        <section className={styles.section} id={`${id}-gallery`} data-section="gallery">
          <div className={styles.sectionHead}><p className={styles.caps}>Moments we treasure</p><h2>Photo Gallery</h2><Ornament /></div>
          <div className={styles.gallery}>{['story', 'hero', 'story', 'hero', 'story', 'hero'].map((image, index) => <div key={index} className={index === 0 || index === 3 ? styles.tall : undefined}><img src={image === 'hero' ? photo : `${assets}/story.webp`} alt={`${image === 'hero' ? data.hostNames : 'A walk together in Galle'} — moment ${index + 1}`} className={styles.photo} style={{ objectPosition: ['45% 50%', '55% 35%', '60% 25%', '68% 50%', '30% 85%', '25% 70%'][index] }} loading="lazy" /></div>)}</div>
        </section>

        <section className={styles.section} id={`${id}-venue`} data-section="venue">
          <div className={styles.sectionHead}><p className={styles.caps}>Where we celebrate</p><h2>The Venue</h2><Ornament /></div>
          <div className={styles.venue}>
            <div className={styles.venueCard}><span className={styles.icon} aria-hidden="true">⌖</span><p className={styles.script}>Venue</p><h3>{data.venue}</h3><p>{dateLabel}<br />{timeLabel}</p></div>
            <div className={styles.map}><span aria-hidden="true">⌖</span><p>{data.venue}</p><a className={styles.button} href={directions} target="_blank" rel="noopener noreferrer">Open in Maps ↗</a></div>
          </div>
        </section>

        <section className={styles.rsvp} id={`${id}-rsvp`} data-section="rsvp">
          <div className={styles.sectionHead}><p className={styles.caps}>Kindly reply</p><h2>Will you join us?</h2><Ornament /><p>It would mean so much to have you with us.</p>{data.rsvpDeadline && <p className={styles.caps}>Please reply by {data.rsvpDeadline}</p>}</div>
          <div className={styles.rsvpPanel}>{data.rsvpContent || <div className={styles.previewReply}><span className={styles.icon} aria-hidden="true">✉</span><p>Your guests can respond here when you share this invitation.</p></div>}</div>
        </section>

        <footer className={styles.footer}>
          <div className={styles.footerCard}><img src={`${assets}/footer-floral.webp`} alt="" className={styles.footerFloral} loading="lazy" /><p className={styles.caps}>Save the date</p><p className={styles.footerDate}>{footerDate}</p><p className={styles.script}>Sealed with love.</p><p className={styles.monogram}>{initials.join(' & ')}</p><p>{data.hostNames}</p><a className={styles.pill} href={href('rsvp')} onClick={(event) => navigate(event, 'rsvp')}>RSVP with love ♡</a></div>
        </footer>

        {isPublic && <><div className={styles.petals} aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span key={index} style={{ left: `${4 + index * 8}%`, animationDelay: `-${index * 2}s`, animationDuration: `${13 + index % 7}s` }} />)}</div><nav className={styles.bottomNav} aria-label="Wedding quick links">{navigation.filter(([section]) => section !== 'story').map(([section, label]) => <a key={section} href={href(section)} aria-current={active === section ? 'location' : undefined}><span aria-hidden="true">{({ hero: '⌂', events: '◇', gallery: '▧', venue: '⌖', rsvp: '♡' } as Record<string, string>)[section]}</span>{label}</a>)}</nav></>}
      </>}
    </div>
  </div>;
}

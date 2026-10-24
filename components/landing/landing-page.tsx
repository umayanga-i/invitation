'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthUser } from '@/components/layout/AuthProvider';
import { BRAND_NAME, shortLinkExample, TAGLINE } from '@/lib/brand';
import { HARDCODED_TEMPLATES } from '@/lib/mock-data';
import { templateRegistry } from '@/components/templates/registry';
import type { TemplateData } from '@/components/templates/types';
import { pricingPlans } from '@/lib/pricing';
import { MagneticButton, Reveal, SplitHeading } from './motion/reveal';

const PetalCanvas = dynamic(() => import('./motion/petal-canvas').then((module) => module.PetalCanvas), { ssr: false });

const categoryNames: Record<string, string> = { wedding: 'Weddings', birthday: 'Birthdays', baby_shower: 'Baby Showers', housewarming: 'Housewarming', religious_cultural: 'Religious & Cultural', corporate: 'Corporate' };
const sample: TemplateData = { hostNames: 'Amaya & Dilan', eventTitle: 'Wedding Celebration', date: 'February 14, 2027', time: '4:30 PM', venue: 'Lotus Garden Hall, Galle', mapLink: 'https://maps.google.com/?q=Galle', message: 'We would love to celebrate this day with you.', colors: { primary: '#6d201c', secondary: '#b8934f', accent: '#c9a84c' } };
const faqs = [
  ['What are personal links?', 'Each guest can receive a unique invitation link addressed to them. You can also share one common link with everyone.'],
  ['Do guests need an account?', 'No. Guests can open their invitation and respond without creating an account.'],
  ['How does WhatsApp sending work?', 'A wa.me link opens WhatsApp with your invitation message ready. You review it and tap send.'],
  ['How does RSVP tracking work?', 'Guest responses appear together in your invitation dashboard so you can see who is attending, declined, or still pending.'],
  ['Can I add many guests at once?', 'Yes. Add several names by pasting a list, or import a guest list from a CSV file.'],
  ['Is guest data private?', 'Your guest list is associated with your invitation and account. Only share invitation links with the people you intend to invite.'],
];

function Preview({ id, data }: { id: string; data?: TemplateData }) {
  const entry = templateRegistry.find((item) => item.id === id) ?? templateRegistry[0];
  const Component = entry.Component;
  const templateSample = entry.supportsWeddingDetails ? HARDCODED_TEMPLATES.find((item) => item.id === id)?.sampleData : undefined;
  const previewData = data ?? (templateSample ? { ...sample, ...templateSample, colors: entry.defaultColors } : sample);
  return <div className="iv-preview-art"><Component {...previewData} /></div>;
}

export function LandingPage() {
  const loggedIn = Boolean(useAuthUser());
  const [category, setCategory] = useState('wedding');
  const [active, setActive] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuVisible, setMenuVisible] = useState(true);
  const [guestName, setGuestName] = useState('Nimal');
  const [personal, setPersonal] = useState(true);
  const [bulk, setBulk] = useState('');
  const [bulkNames, setBulkNames] = useState<string[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'once'>('monthly');
  const modalRef = useRef<HTMLDivElement>(null);
  const previousScroll = useRef(0);
  const categories = [...new Set(HARDCODED_TEMPLATES.map((template) => template.category))];
  const templates = useMemo(() => HARDCODED_TEMPLATES.filter((template) => template.category === category), [category]);
  const activeTemplate = HARDCODED_TEMPLATES.find((template) => template.id === active);

  useEffect(() => {
    const scroll = () => { const y = window.scrollY; setScrolled(y > 40); setMenuVisible(y < 80 || y < previousScroll.current); previousScroll.current = y; };
    window.addEventListener('scroll', scroll, { passive: true });
    return () => { window.removeEventListener('scroll', scroll); };
  }, []);
  useEffect(() => {
    if (!active && !menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setActive(null); setMenuOpen(false); }
      if (event.key === 'Tab') {
        const root = active ? modalRef.current : document.querySelector('.iv-mobile-menu');
        const elements = root?.querySelectorAll<HTMLElement>('a,button,input,[tabindex="0"]');
        if (!elements?.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = active || menuOpen ? 'hidden' : '';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [active, menuOpen]);

  const goCreate = loggedIn ? '/dashboard' : '/signup';
  const anchorLinks = [['Templates', '#templates'], ['How it works', '#how'], ['Guests', '#guests'], ['Pricing', '#pricing'], ['FAQ', '#faq']];

  return <div className={`iv-site${loggedIn ? ' iv-site-authenticated' : ''}`}>
    <div className="iv-noise" aria-hidden="true" />
    <PetalCanvas />
    {!loggedIn && <header className={`iv-header ${scrolled ? 'is-scrolled' : ''} ${menuVisible ? '' : 'is-hidden'}`}>
      <Link href="/" className="iv-brand" aria-label={`${BRAND_NAME} home`}>{BRAND_NAME}<span>✦</span></Link>
      <nav className="iv-nav" aria-label="Main navigation">{anchorLinks.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
      <div className="iv-header-actions"><Link className="iv-login" href="/login">Log in</Link><Link className="iv-pill iv-pill-dark" href={goCreate}>{loggedIn ? 'Go to dashboard' : 'Create invitation'}<span>↗</span></Link></div>
      <button type="button" className="iv-menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
    </header>}
    {!loggedIn && menuOpen && <div className="iv-mobile-menu"><button className="iv-menu-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">×</button><span className="iv-kicker">{BRAND_NAME}</span>{anchorLinks.map(([label, href], i) => <a key={href} style={{ transitionDelay: `${i * 70}ms` }} href={href} onClick={() => setMenuOpen(false)}>{label}<span>↗</span></a>)}<Link className="iv-pill iv-pill-gold" href={goCreate}>{loggedIn ? 'Go to dashboard' : 'Create invitation'} ↗</Link></div>}

    <main>
      <section className="iv-hero" aria-labelledby="hero-title">
        <div className="iv-hero-glow" aria-hidden="true" /><div className="iv-mandala" aria-hidden="true">✺</div>
        <div className="iv-hero-inner">
          <div className="iv-hero-copy"><p className="iv-kicker">An invitation to make a memory</p><h1 id="hero-title"><SplitHeading>{TAGLINE}</SplitHeading></h1><p className="iv-hero-sub">Choose a template, personalise it in minutes, and send a unique link to each guest on WhatsApp. Track every RSVP live.</p><div className="iv-hero-actions"><MagneticButton href={goCreate} className="iv-pill iv-pill-dark">Start for free <span>↗</span></MagneticButton><button className="iv-watch" onClick={() => setActive('wedding-classic')}><span className="iv-play">▶</span> Watch preview</button></div><div className="iv-proofline"><span>✦</span> Thoughtful by design, made for your moment</div></div>
          <div className="iv-hero-cards" aria-label="Invitation design previews"><div className="iv-hero-card iv-side-card iv-card-left"><Preview id="birthday-festive" /></div><div className="iv-hero-card iv-center-card"><Preview id="wedding-classic" /></div><div className="iv-hero-card iv-side-card iv-card-right"><Preview id="religious-first-birthday" /></div><span className="iv-card-watermark">{BRAND_NAME} ✦ {BRAND_NAME}</span></div>
        </div><a className="iv-scroll-cue" href="#templates"><span>Scroll to discover</span><i /></a>
      </section>
      <div className="iv-marquee" aria-label="Celebrations"><div>{Array.from({ length: 2 }, (_, i) => <span key={i}>Weddings <b>✦</b> Birthdays <b>✦</b> Engagements <b>✦</b> Baby Showers <b>✦</b> Housewarming <b>✦</b> Religious &amp; Cultural <b>✦</b> Corporate <b>✦</b></span>)}</div></div>

      <section id="templates" className="iv-section iv-templates"><div className="iv-container"><div className="iv-section-head"><div><p className="iv-kicker">A little something for every occasion</p><h2><SplitHeading>Templates for every story</SplitHeading></h2></div><p className="iv-head-note">Thoughtfully made designs, ready to become yours.</p></div><div className="iv-tabs" role="tablist" aria-label="Template categories">{categories.map((cat) => <button role="tab" aria-selected={category === cat} key={cat} onClick={() => setCategory(cat)}>{categoryNames[cat]}</button>)}</div><div className="iv-template-row">{templates.map((template) => <button key={template.id} className="iv-template-card" onClick={() => setActive(template.id)} aria-label={`Preview ${template.name}`}><div className="iv-template-visual"><Preview id={template.id} /><span className="iv-watermark">{BRAND_NAME}</span><span className="iv-preview-pill">Preview ↗</span></div><div className="iv-template-meta"><h3>{template.name}</h3><span>{categoryNames[template.category]} <i>✦</i></span></div></button>)}</div></div></section>

      <section id="how" className="iv-section iv-how"><div className="iv-container"><div className="iv-section-head"><div><p className="iv-kicker">Thoughtful from the very first click</p><h2><SplitHeading>Simple, from hello to RSVP</SplitHeading></h2></div><p className="iv-head-note">Four small steps. One lovely invitation.</p></div><div className="iv-steps">{[
        ['01', 'Pick a template', 'Find a design that feels just right for your celebration.'], ['02', 'Make it yours', 'Add the names, date and place that make this day yours.'], ['03', 'Send personal links', 'Share with a tap on WhatsApp, with a message ready to send.'], ['04', 'Track every RSVP', 'See replies gather in one calm, clear place.'],
      ].map(([n, title, text], i) => <Reveal key={n} className="iv-step"><span className="iv-step-number">{n}</span><div><h3>{title}</h3><p>{text}</p>{i === 2 && <span className="iv-link-chip">{shortLinkExample()}</span>}</div><div className="iv-step-visual">{i === 0 ? <div className="iv-mini-templates"><Preview id="wedding-classic" /><Preview id="birthday-elegant" /></div> : i === 1 ? <div className="iv-typing-card"><span>Names</span><strong>Amaya &amp; Dilan</strong><span>Date</span><strong>February 14, 2027</strong></div> : i === 2 ? <div className="iv-chat-card"><span>WhatsApp</span><p>Dear Nimal, you’re invited…</p><b>Send ↗</b></div> : <div className="iv-rsvp-card"><strong>RSVPs</strong><span>Attending <b>12</b></span><span>Pending <b>4</b></span><span>Declined <b>2</b></span></div>}</div></Reveal>)}</div></div></section>

      <section id="guests" className="iv-section iv-guests"><div className="iv-container iv-guests-grid"><div><p className="iv-kicker">A personal touch, at any scale</p><h2><SplitHeading>One link for everyone, or a personal one for each guest</SplitHeading></h2><p className="iv-body-copy">Make every guest feel welcome from the very first line. Personal links keep replies easy to follow, while a shared link is ready when you need it.</p><div className="iv-toggle"><button className={personal ? 'selected' : ''} onClick={() => setPersonal(true)}>Personal link</button><button className={!personal ? 'selected' : ''} onClick={() => setPersonal(false)}>Common link</button></div><code className="iv-link-chip">{personal ? `${shortLinkExample()}?guest=${encodeURIComponent(guestName || 'Guest')}` : shortLinkExample()}</code><div className="iv-bulk"><label htmlFor="bulk-names">Try a little guest list</label><div><input id="bulk-names" value={bulk} maxLength={200} onChange={(e) => setBulk(e.target.value)} placeholder="Nimal, Anu, Kasun"/><button onClick={() => { setBulkNames(bulk.split(/[\n,]+/).map((name) => name.trim()).filter(Boolean).slice(0, 5)); setBulk(''); }}>Add names ↗</button></div><ul>{bulkNames.map((name, i) => <li key={`${name}-${i}`} style={{ animationDelay: `${i * 120}ms` }}>✦ {name}</li>)}</ul></div></div><div className="iv-live-preview"><span className="iv-preview-label">A note just for you</span><div className="iv-live-card"><label htmlFor="guest-name">Your guest’s name</label><input id="guest-name" value={guestName} maxLength={40} onChange={(e) => setGuestName(e.target.value)} placeholder="Type a guest name…"/><p className="iv-script">Dear {guestName || 'you'},</p><p>We’d love for you to join us on our special day.</p><span className="iv-shimmer-line"/><small>Amaya &amp; Dilan</small></div><span className="iv-preview-corner">LIVE PERSONALISATION ✦</span></div></div></section>

      <section className="iv-section iv-features"><div className="iv-container"><div className="iv-section-head"><div><p className="iv-kicker">All the little details, taken care of</p><h2><SplitHeading>Made for the way you celebrate</SplitHeading></h2></div></div><div className="iv-feature-grid">{[['♡','Live RSVP dashboard','See attending, declined and pending replies come together.'],['↗','WhatsApp sending','Open WhatsApp with a personal invitation message ready.'],['＋','Bulk guest import','Paste names or bring in a guest list from CSV.'],['⌁','Short secure links','Share an easy-to-send link for each guest.'],['▣','Mobile-first invitations','Beautifully readable on the phone in every pocket.'],['✧','Protected artwork','Keep your invitation art safe from casual saving.']].map(([icon,title,text], i) => <Reveal key={title}><article className="iv-feature-card"><span className="iv-feature-icon" style={{ transitionDelay: `${i * 80}ms` }}>{icon}</span><h3>{title}</h3><p>{text}</p><i>0{i + 1}</i></article></Reveal>)}</div></div></section>

      <section className="iv-numbers"><div className="iv-container">{[['18+', 'templates'], ['6', 'event categories'], ['1', 'link per guest']].map(([n,label]) => <div key={label}><strong>{n}</strong><span>{label}</span></div>)}</div></section>
      <section id="pricing" className="iv-section iv-pricing"><div className="iv-container"><div className="iv-section-head"><div><p className="iv-kicker">A plan for your kind of celebration</p><h2><SplitHeading>Choose how you celebrate</SplitHeading></h2><p className="iv-pricing-note">Pricing coming soon. We’re putting the finishing touches on plans.</p></div><div className="iv-toggle iv-billing"><button className={billing === 'monthly' ? 'selected' : ''} onClick={() => setBilling('monthly')}>Monthly</button><button className={billing === 'once' ? 'selected' : ''} onClick={() => setBilling('once')}>One-time</button></div></div><div className="iv-plan-grid">{pricingPlans.map((plan, i) => <article key={plan.name} className={`iv-plan ${i === 1 ? 'iv-plan-featured' : ''}`}><span className="iv-kicker">{plan.name}</span><h3>{plan.note}</h3><p className="iv-coming">Pricing coming soon</p><ul>{plan.points.map((point) => <li key={point}>✦ {point}</li>)}</ul><Link className={i === 1 ? 'iv-pill iv-pill-gold' : 'iv-pill iv-pill-outline'} href="/signup">Choose {plan.name} ↗</Link></article>)}</div></div></section>
      <section id="faq" className="iv-section iv-faq"><div className="iv-container iv-faq-grid"><div><p className="iv-kicker">A few things you might wonder</p><h2><SplitHeading>Good to know</SplitHeading></h2></div><div className="iv-faq-list">{faqs.map(([q,a], i) => <article key={q} className={openFaq === i ? 'open' : ''}><button aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)}><span>{q}</span><i>{openFaq === i ? '−' : '+'}</i></button><div className="iv-faq-answer"><div><p>{a}</p></div></div></article>)}</div></div></section>

      <section className="iv-cta"><div className="iv-cta-ornament" aria-hidden="true">✧　✦　✧</div><p className="iv-kicker">Make this moment yours</p><h2>Your story deserves a beautiful invitation.</h2><Link className="iv-pill iv-pill-gold" href={goCreate}>Create your invitation <span>↗</span></Link></section>
    </main>
    <footer className="iv-footer"><div className="iv-container"><div className="iv-footer-top"><Link href="/" className="iv-brand">{BRAND_NAME}<span>✦</span></Link><p>Made with love in Sri Lanka</p><nav aria-label="Footer">{[['Templates','#templates'],['How it works','#how'],['Pricing','#pricing'],['FAQ','#faq'],['Log in','/login'],['Sign up','/signup'],['Terms','/terms'],['Privacy','/privacy']].map(([label,href]) => <Link href={href} key={label}>{label}</Link>)}</nav></div><div className="iv-footer-bottom"><span>© {new Date().getFullYear()} {BRAND_NAME}</span><span>For all the moments worth keeping.</span></div></div></footer>

    {active && activeTemplate && <div className="iv-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setActive(null); }}><div className="iv-modal" role="dialog" aria-modal="true" aria-label={`${activeTemplate.name} preview`} ref={modalRef}><button className="iv-modal-close" onClick={() => setActive(null)} autoFocus aria-label="Close preview">×</button><div className="iv-phone"><Preview id={active} data={{ ...sample, ...activeTemplate.sampleData, colors: activeTemplate.colors }} /></div><div className="iv-modal-details"><p className="iv-kicker">{categoryNames[activeTemplate.category]}</p><h2>{activeTemplate.name}</h2><p>{activeTemplate.description}</p><Link className="iv-pill iv-pill-dark" href={loggedIn ? `/templates/${activeTemplate.id}` : '/signup'}>Use this template ↗</Link><button className="iv-text-button" onClick={() => setActive(null)}>Close preview</button></div></div></div>}
  </div>;
}

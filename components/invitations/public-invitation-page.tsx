'use client';

import { useEffect, useState } from 'react';
import type { Guest, Invitation, RsvpStatus } from '@/lib/mock-data';
import { submitCommonRsvp, submitRsvp } from '@/lib/invitations';
import { getTemplate } from '@/components/templates/registry';
import { GuestEventExtras } from './guest-event-extras';
import { guestMessages, type GuestLanguage } from '@/lib/i18n';
import { getPartyLimit, isRsvpClosed } from '@/lib/rsvp-rules';

type PublicInvitation = Pick<Invitation, 'id' | 'slug' | 'title' | 'templateId' | 'customData'>;
type PublicGuest = Pick<Guest, 'id' | 'name' | 'rsvpStatus'> & Partial<Pick<Guest, 'partySize' | 'rsvpMessage' | 'maxPartySize' | 'openedAt' | 'respondedAt' | 'phone'>>;
type Props = { invitation: PublicInvitation; guest?: PublicGuest };

export function PublicInvitationPage({ invitation, guest: initialGuest }: Props) {
  const [guest, setGuest] = useState<PublicGuest | null>(initialGuest ?? null);
  const [guestName, setGuestName] = useState(initialGuest?.name ?? '');
  const [phone, setPhone] = useState(initialGuest?.phone ?? '');
  const [status, setStatus] = useState<RsvpStatus>(initialGuest?.rsvpStatus === 'pending' ? 'attending' : initialGuest?.rsvpStatus ?? 'attending');
  const [partySize, setPartySize] = useState(initialGuest?.partySize || 1);
  const [message, setMessage] = useState(initialGuest?.rsvpMessage ?? '');
  const [editing, setEditing] = useState(!initialGuest?.respondedAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<GuestLanguage>('en');
  useEffect(() => {
    const saved = window.localStorage.getItem('guest-language');
    if (saved === 'en' || saved === 'si' || saved === 'ta') {
      const timer = window.setTimeout(() => setLanguage(saved), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);
  const [, refreshDeadline] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => refreshDeadline(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const template = getTemplate(invitation.templateId);

  if (!template) {
    return <main className="grid min-h-screen place-items-center bg-[var(--iv-ivory)] px-5 text-center text-[var(--iv-muted)]">This invitation design is unavailable.</main>;
  }

  const InvitationTemplate = template.Component;
  const isPersonal = Boolean(initialGuest);
  const labels = guestMessages[language];
  const rsvpClosed = isRsvpClosed(invitation.customData.rsvpDeadline);
  const partyLimit = getPartyLimit(invitation.customData.maxPartySize, guest?.maxPartySize);
  const responseLabel = (value: RsvpStatus) => value === 'not_attending' ? labels.notAttending : value === 'maybe' ? labels.maybe : labels.attending;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isPersonal && !guestName.trim()) {
      setError('Please enter your name.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = { rsvpStatus: status, partySize: status === 'attending' ? Math.min(partySize, partyLimit) : 0, rsvpMessage: message.trim() || undefined };
      const updated = isPersonal
        ? await submitRsvp(guest!.id, response)
        : guest
          ? await submitRsvp(guest.id, response)
          : await submitCommonRsvp(invitation.id, { ...response, name: guestName.trim(), phone: phone.trim() });
      setGuest(updated);
      setGuestName(updated.name);
      setPhone(updated.phone ?? '');
      setEditing(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your response could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const data = { ...invitation.customData, guestName: guest?.name ?? invitation.customData.guestName };
  const rsvpPanel = (
        <aside className="order-2 h-fit rounded-2xl border border-[var(--iv-gold-soft)] bg-[var(--iv-cream)] p-5 shadow-xl shadow-black/20 sm:p-7">
          <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-300">{labels.youAreInvited}</p><label className="flex items-center gap-2 text-xs text-[var(--iv-muted)]"><span>{labels.language}</span><select value={language} onChange={(event) => { const next = event.target.value as GuestLanguage; setLanguage(next); window.localStorage.setItem('guest-language', next); }} aria-label={labels.language} className="rounded-md border border-[var(--iv-gold-soft)] bg-[var(--iv-ivory)] px-2 py-1.5 text-[var(--iv-ivory)]"><option value="en">English</option><option value="si">සිංහල</option><option value="ta">தமிழ்</option></select></label></div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--iv-ivory)]">{invitation.title}</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--iv-muted)]">
            <time dateTime={invitation.customData.date}>{invitation.customData.date}</time>
            {invitation.customData.time ? ` · ${invitation.customData.time}` : ''}
            {invitation.customData.venue && <><br />{invitation.customData.venue}</>}
          </p>

          {template.layout !== 'page' && <GuestEventExtras invitation={invitation} messages={labels} />}

          {rsvpClosed ? (
            <div role="status" className="mt-6 rounded-xl border border-amber-900 bg-amber-950/40 p-4">
              <p className="font-semibold text-amber-200">{labels.closed}</p>
              <p className="mt-1 text-sm text-amber-100/80">{labels.closedDescription}</p>
              <p className="mt-3 text-sm text-[var(--iv-muted)]">{guest?.respondedAt ? `${labels.existingAnswer}: ${responseLabel(guest.rsvpStatus)}${guest.partySize ? ` · ${guest.partySize}` : ''}` : labels.noAnswer}</p>
            </div>
          ) : guest && !editing ? (
            <div role="status" className="mt-6 rounded-xl border border-emerald-800 bg-emerald-950/50 p-4">
              <p className="font-semibold text-emerald-200">{labels.thankYou}{isPersonal ? `, ${guest.name}` : ''}!</p>
              <p className="mt-1 text-sm text-emerald-100/80">{labels.responseSaved}: {responseLabel(guest.rsvpStatus)}.</p>
              <button type="button" onClick={() => setEditing(true)} className="mt-3 text-sm font-semibold text-emerald-200 underline underline-offset-2">{labels.changeAnswer}</button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              {isPersonal ? (
                <div className="rounded-lg border border-[var(--iv-gold-soft)] bg-[var(--iv-cream)] px-3 py-2.5 text-sm text-[var(--iv-muted)]">{labels.name}: <strong>{guest?.name}</strong></div>
              ) : (
                <>
                  <label className="block text-sm font-medium text-[var(--iv-muted)]">{labels.name}<input value={guestName} onChange={(event) => setGuestName(event.target.value)} required className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] bg-[var(--iv-ivory)] px-3 py-2.5 text-[var(--iv-ivory)] outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" /></label>
                  <label className="block text-sm font-medium text-[var(--iv-muted)]">{labels.phone}<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] bg-[var(--iv-ivory)] px-3 py-2.5 text-[var(--iv-ivory)] outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" /></label>
                </>
              )}
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-[var(--iv-muted)]">{labels.rsvpQuestion}</legend>
                <div className="space-y-2">
                  {([['attending', labels.attending], ['not_attending', labels.notAttending], ['maybe', labels.maybe]] as const).map(([value, label]) => (
                    <label key={value} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition ${status === value ? 'border-[var(--iv-maroon)] bg-[var(--iv-maroon)] text-[var(--iv-ivory)]' : 'border-[var(--iv-gold-soft)] text-[var(--iv-ink)] hover:border-[var(--iv-gold)]'}`}>
                      <input type="radio" name="rsvp" value={value} checked={status === value} onChange={() => setStatus(value)} className="accent-[var(--iv-maroon)]" /><span aria-hidden="true">{value === 'attending' ? '✓' : value === 'not_attending' ? '×' : '?'}</span>{label}
                    </label>
                  ))}
                </div>
              </fieldset>
              {status === 'attending' && <label className="block text-sm font-medium text-[var(--iv-muted)]">{labels.partySize}<select value={Math.min(partySize, partyLimit)} onChange={(event) => setPartySize(Number(event.target.value))} className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] bg-[var(--iv-ivory)] px-3 py-2.5 text-[var(--iv-ivory)] outline-none focus:border-amber-400">{Array.from({ length: partyLimit }, (_, index) => index + 1).map((number) => <option key={number} value={number}>{number}</option>)}</select></label>}
              <label className="block text-sm font-medium text-[var(--iv-muted)]">{labels.message}<textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] bg-[var(--iv-ivory)] px-3 py-2.5 text-[var(--iv-ivory)] outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20" /></label>
              {error && <p role="alert" className="rounded-lg border border-rose-900 bg-rose-950/60 p-3 text-sm text-rose-200">{error}</p>}
              <button disabled={saving} className="w-full min-h-12 rounded-full bg-[var(--iv-maroon)] px-4 py-3 text-sm font-semibold text-[var(--iv-ivory)] transition hover:bg-[var(--iv-deep)] disabled:cursor-wait disabled:opacity-60">{saving ? labels.saving : guest ? labels.updateRsvp : labels.sendRsvp}</button>
              {guest && <button type="button" onClick={() => setEditing(false)} className="w-full text-sm text-[var(--iv-muted)] hover:text-[var(--iv-ivory)]">{labels.cancel}</button>}
            </form>
          )}
        </aside>
  );

  if (template.layout === 'page') {
    return <main lang={language} className="iv-public-page min-h-screen">
      <InvitationTemplate {...data} displayMode="public" rsvpContent={rsvpPanel} />
    </main>;
  }


  return (
    <main lang={language} style={{ fontFamily: language === 'si' ? 'var(--font-noto-sinhala), var(--font-outfit), sans-serif' : language === 'ta' ? 'var(--font-noto-tamil), var(--font-outfit), sans-serif' : 'var(--font-outfit), sans-serif' }} className="iv-public-page min-h-screen bg-[var(--iv-ivory)] px-4 py-6 text-[var(--iv-ink)] sm:px-8 sm:py-10">
      <div className="mx-auto grid max-w-6xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
        <section className="order-1 overflow-hidden rounded-2xl border border-[var(--iv-gold-soft)] bg-white shadow-2xl shadow-black/30" aria-label="Invitation design">
          <InvitationTemplate {...data} />
        </section>
        {rsvpPanel}
      </div>
    </main>
  );
}

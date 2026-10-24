'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createInvitation, updateInvitation } from '@/lib/invitations';
import { getCurrentUser } from '@/lib/auth';
import { uploadInvitationPhoto } from '@/lib/storage';
import { getTemplate, templateRegistry } from './registry';
import type { Invitation } from '@/lib/mock-data';
import { HARDCODED_TEMPLATES } from '@/lib/mock-data';
import type { TemplateComponent } from './types';
import { GOLDEN_WEDDING_DETAILS, type WeddingPhotos, type WeddingPhotoSlot } from '@/lib/wedding-golden';
import { WeddingGoldenFields } from './wedding-golden-fields';

type Props = { template: TemplateComponent; invitation?: Invitation };

export function TemplateEditor({ template, invitation }: Props) {
  const router = useRouter();
  const saved = invitation?.customData;
  const sample = template.layout === 'page' ? HARDCODED_TEMPLATES.find((item) => item.id === template.id)?.sampleData : undefined;
  const [hostNames, setHostNames] = useState(saved?.hostNames ?? sample?.hostNames ?? 'Amaya & Dilan');
  const [eventTitle, setEventTitle] = useState(saved?.eventTitle ?? invitation?.title ?? sample?.eventTitle ?? 'Wedding Celebration');
  const [date, setDate] = useState(saved?.date ?? sample?.date ?? '2027-02-14');
  const [time, setTime] = useState(saved?.time ?? sample?.time ?? '16:30');
  const [rsvpDeadline, setRsvpDeadline] = useState(saved?.rsvpDeadline ?? sample?.rsvpDeadline ?? '');
  const [maxPartySize, setMaxPartySize] = useState(saved?.maxPartySize ?? (template.supportsWeddingDetails ? 10 : 6));
  const [venue, setVenue] = useState(saved?.venue ?? sample?.venue ?? 'Lotus Garden Hall, Galle');
  const [mapLink, setMapLink] = useState(saved?.mapLink ?? '');
  const [message, setMessage] = useState(saved?.message ?? sample?.message ?? 'We would be delighted to celebrate this special day with you.');
  const [photo, setPhoto] = useState(saved?.photo ?? '');
  const [photos, setPhotos] = useState<WeddingPhotos>(saved?.photos ?? {});
  const [weddingDetails, setWeddingDetails] = useState(saved?.weddingDetails ?? sample?.weddingDetails ?? GOLDEN_WEDDING_DETAILS);
  const [uploadingSlots, setUploadingSlots] = useState<Set<WeddingPhotoSlot>>(new Set());
  const [photoError, setPhotoError] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const [guestName, setGuestName] = useState(saved?.guestName ?? '');
  const [invitationType, setInvitationType] = useState<'common' | 'personal'>(invitation?.type ?? 'common');
  const [colors, setColors] = useState(saved?.colors ?? template.defaultColors);
  const [selectedTemplateId, setSelectedTemplateId] = useState(invitation?.templateId ?? template.id);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const selectedTemplate = getTemplate(selectedTemplateId) ?? template;
  const isGolden = selectedTemplate.supportsWeddingDetails === true;
  const uploading = photoLoading || uploadingSlots.size > 0;
  const Invitation = selectedTemplate.Component;

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const confirmNavigation = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank') return;
      const targetUrl = new URL(anchor.href, window.location.href);
      if (targetUrl.origin === window.location.origin && targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search) return;
      if (targetUrl.origin === window.location.origin && targetUrl.href !== window.location.href && !window.confirm('You have unsaved changes. Leave this page?')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', confirmNavigation, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', confirmNavigation, true);
    };
  }, [dirty]);

  async function saveInvitation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading) return;
    setError('');
    if (invitationType === 'personal' && !guestName.trim()) {
      setError('Add a guest name for a personal invitation.');
      return;
    }
    setSaving(true);
    try {
      const customData = {
          hostNames: hostNames.trim(),
          eventTitle: eventTitle.trim(),
          date,
          time,
          rsvpDeadline: rsvpDeadline || undefined,
          maxPartySize,
          venue: venue.trim(),
          mapLink: mapLink.trim() || undefined,
          message: message.trim(),
          photo: photo.trim() || undefined,
          ...(isGolden ? {
            photos,
            weddingDetails: { ...weddingDetails, events: weddingDetails.events.map((event, index) => index === 1 ? { ...event, time, venue: venue.trim() } : event) },
          } : {}),
          colors,
          guestName: invitationType === 'personal' ? guestName.trim() : undefined,
        };
      if (invitation) {
        await updateInvitation(invitation.id, {
          title: eventTitle.trim() || hostNames,
          templateId: selectedTemplateId,
          type: invitationType,
          customData,
        });
        setDirty(false);
        router.push(`/invitations/${invitation.id}`);
      } else {
        const user = getCurrentUser();
        if (!user) throw new Error('Please sign in again to save this invitation.');
        const created = await createInvitation({
          title: eventTitle.trim() || hostNames,
          templateId: selectedTemplateId,
          userId: user.id,
          type: invitationType,
          customData,
        });
        setDirty(false);
        router.push(`/invitations/${created.id}`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save this invitation.');
      setSaving(false);
    }
  }

  return (
    <main className="iv-editor min-h-screen bg-[var(--iv-ivory)] px-4 py-8 text-[var(--iv-ink)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-[var(--iv-maroon)]">{selectedTemplate.category.replace('_', ' ')}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{invitation ? 'Edit invitation' : selectedTemplate.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--iv-muted)]">{selectedTemplate.description}</p>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(300px,440px)_minmax(0,1fr)] lg:gap-10">
          <form onSubmit={saveInvitation} className="iv-editor-form order-1 space-y-5 rounded-2xl border border-[var(--iv-gold-soft)] bg-[var(--iv-cream)] p-5 shadow-sm sm:p-7">
            <label className="block text-sm font-medium">Template<select value={selectedTemplateId} onChange={(event) => { setSelectedTemplateId(event.target.value); setDirty(true); }} className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--iv-maroon)]">{templateRegistry.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.category.replace('_', ' ')}</option>)}</select></label>
            <fieldset>
              <legend className="mb-3 text-sm font-semibold">Invitation type</legend>
              <div className="grid grid-cols-2 gap-2">
                {(['common', 'personal'] as const).map((type) => (
                  <button key={type} type="button" onClick={() => { setInvitationType(type); setDirty(true); }} aria-pressed={invitationType === type}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-medium capitalize ${invitationType === type ? 'border-[var(--iv-maroon)] bg-[var(--iv-maroon)] text-[var(--iv-ivory)]' : 'border-[var(--iv-gold-soft)] text-[var(--iv-deep)] hover:bg-[var(--iv-cream)]'}`}>
                    {type === 'common' ? 'Common' : 'Personal'}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[var(--iv-muted)]">{invitationType === 'common' ? 'One shared invitation for everyone.' : 'Personal invitations include a guest greeting.'}</p>
            </fieldset>

            {invitationType === 'personal' && <Field label="Guest name" value={guestName} onChange={(value) => { setGuestName(value); setDirty(true); }} placeholder="e.g. Nadeesha Perera" />}
            <Field label="Host name(s)" value={hostNames} onChange={(value) => { setHostNames(value); setDirty(true); }} required />
            <Field label="Event title" value={eventTitle} onChange={(value) => { setEventTitle(value); setDirty(true); }} required />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date" type="date" value={date} onChange={(value) => { setDate(value); setDirty(true); }} required />
              <Field label="Time" type="time" value={time} onChange={(value) => { setTime(value); setDirty(true); }} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="RSVP deadline (optional)" type="date" value={rsvpDeadline} onChange={(value) => { setRsvpDeadline(value); setDirty(true); }} />
              <label className="block text-sm font-medium">Maximum party size<select value={maxPartySize} onChange={(event) => { setMaxPartySize(Number(event.target.value)); setDirty(true); }} className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--iv-maroon)]">{Array.from({ length: 20 }, (_, index) => index + 1).map((size) => <option key={size} value={size}>{size} {size === 1 ? 'person' : 'people'}</option>)}</select></label>
            </div>
            <Field label="Venue" value={venue} onChange={(value) => { setVenue(value); setDirty(true); }} required />
            <Field label="Map link (optional)" type="url" value={mapLink} onChange={(value) => { setMapLink(value); setDirty(true); }} placeholder="https://maps.google.com/..." />
            {isGolden && <WeddingGoldenFields value={weddingDetails} onChange={(value) => { setWeddingDetails(value); setDirty(true); }} />}
            {!isGolden && <div>
              <label className="block text-sm font-medium">Invitation photo (optional)<input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setPhotoError(''); setPhotoLoading(true);
                try { const optimizedPhoto = await uploadInvitationPhoto(file); setPhoto(optimizedPhoto); setDirty(true); }
                catch (cause) { setPhotoError(cause instanceof Error ? cause.message : 'Could not process this image.'); event.target.value = ''; }
                finally { setPhotoLoading(false); }
              }} className="mt-1.5 block w-full rounded-lg border border-[var(--iv-gold-soft)] bg-white px-3 py-2.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--iv-cream)] file:px-3 file:py-1.5 file:text-xs file:font-semibold" /></label>
              <p className="mt-1 text-xs text-[var(--iv-muted)]">JPG, PNG, or WebP · up to 5 MB · resized to 1600 px wide</p>
              {photoLoading && <p role="status" className="mt-2 text-xs text-[var(--iv-maroon)]">Optimizing photo…</p>}
              {photoError && <p role="alert" className="mt-2 text-xs text-red-700">{photoError}</p>}
              {photo && <div className="mt-3 flex items-center gap-3"><img src={photo} alt="Invitation photo preview" className="h-20 w-28 rounded-lg border border-[var(--iv-gold-soft)] object-cover" /><button type="button" onClick={() => { setPhoto(''); setDirty(true); if (photoInput.current) photoInput.current.value = ''; }} className="text-xs font-medium text-[var(--iv-maroon)] underline">Remove photo</button></div>}
            </div>}
            <label className="block text-sm font-medium">{isGolden ? 'Our story' : 'Message'}<textarea value={message} onChange={(event) => { setMessage(event.target.value); setDirty(true); }} rows={4} maxLength={500} className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] px-3 py-2.5 text-sm outline-none focus:border-[var(--iv-maroon)] focus:ring-2 focus:ring-[var(--iv-maroon)]/20" /></label>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Invitation colors</legend>
              <div className="flex flex-wrap gap-4">
                {(['primary', 'secondary', 'accent'] as const).map((key) => <label key={key} className="flex items-center gap-2 text-xs capitalize text-[var(--iv-muted)]">{key}<input type="color" value={colors[key]} onChange={(event) => { setColors((current) => ({ ...current, [key]: event.target.value })); setDirty(true); }} className="h-8 w-10 cursor-pointer rounded border border-[var(--iv-gold-soft)] bg-white p-1" /></label>)}
              </div>
            </fieldset>
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="flex gap-3"><button type="submit" disabled={saving || uploading} className="flex-1 rounded-lg bg-[var(--iv-maroon)] px-4 py-3 text-sm font-semibold text-[var(--iv-ivory)] transition hover:bg-[var(--iv-deep)] disabled:opacity-60">{saving ? 'Saving…' : uploading ? 'Adding photos…' : invitation ? 'Save changes' : 'Save invitation'}</button>{invitation && <Link href={`/invitations/${invitation.id}`} className="rounded-lg border border-[var(--iv-gold-soft)] px-4 py-3 text-sm font-medium text-[var(--iv-deep)]">Cancel</Link>}</div>
          </form>

          <section className="order-2 min-w-0 lg:sticky lg:top-20" aria-label="Live invitation preview">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Live preview</h2>
              <span className="text-xs text-[var(--iv-muted)]">Updates as you type</span>
            </div>
            {isGolden && <p className="mb-3 rounded-lg border border-[var(--iv-gold-soft)] bg-[var(--iv-cream)] p-3 text-xs leading-5 text-[var(--iv-muted)]">Select the + on any photo space below to add a picture. Each space saves its own photo. JPG, PNG or WebP · up to 5 MB per picture.</p>}
            <div className={`iv-editor-preview overflow-hidden rounded-2xl border border-[var(--iv-gold-soft)] bg-white shadow-lg${selectedTemplate.layout === 'page' ? ' max-h-[780px] overflow-y-auto' : ''}`}>
              <Invitation displayMode="preview" rsvpDeadline={rsvpDeadline} weddingDetails={weddingDetails} photos={photos} onPhotoChange={(slot, value) => { if (slot === 'hero') setPhoto(''); setPhotos((current) => { const next = { ...current }; if (value) next[slot] = value; else delete next[slot]; return next; }); setDirty(true); }} onPhotoUploadStateChange={(slot, busy) => setUploadingSlots((current) => { const next = new Set(current); if (busy) next.add(slot); else next.delete(slot); return next; })} hostNames={hostNames || 'Host names'} eventTitle={eventTitle || 'Event title'} date={date} time={time} venue={venue || 'Venue'} mapLink={mapLink || undefined} message={message} photo={photo || undefined} colors={colors} guestName={invitationType === 'personal' ? guestName || 'Guest name' : undefined} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return <label className="block text-sm font-medium">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] px-3 py-2.5 text-sm outline-none focus:border-[var(--iv-maroon)] focus:ring-2 focus:ring-[var(--iv-maroon)]/20" /></label>;
}

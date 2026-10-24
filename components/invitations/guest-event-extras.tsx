'use client';

import { useEffect, useState } from 'react';
import type { Invitation } from '@/lib/mock-data';
import type { guestMessages } from '@/lib/i18n';

type Messages = (typeof guestMessages)[keyof typeof guestMessages];
type PublicInvitation = Pick<Invitation, 'id' | 'slug' | 'title' | 'customData'>;
type Props = { invitation: PublicInvitation; messages: Messages };

function escapeIcs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function icsTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function createEventDate(invitation: PublicInvitation): Date {
  const date = invitation.customData.date;
  const time = invitation.customData.time || '09:00';
  return new Date(`${date}T${time}:00+05:30`);
}

export function GuestEventExtras({ invitation, messages }: Props) {
  const eventTime = createEventDate(invitation).getTime();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!Number.isFinite(eventTime)) return;
    const update = () => setRemaining(Math.max(0, eventTime - Date.now()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [eventTime]);

  function downloadCalendar() {
    const start = createEventDate(invitation);
    if (!Number.isFinite(start.getTime())) return;
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const url = invitation.customData.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(invitation.customData.venue)}`;
    const calendar = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Invitation Studio//Events//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      `UID:${invitation.id}@invitation-studio`, `DTSTAMP:${icsTimestamp(new Date())}`, `DTSTART:${icsTimestamp(start)}`, `DTEND:${icsTimestamp(end)}`,
      `SUMMARY:${escapeIcs(invitation.customData.eventTitle || invitation.title)}`, `LOCATION:${escapeIcs(invitation.customData.venue)}`,
      `DESCRIPTION:${escapeIcs(invitation.customData.message || '')}`, `URL:${url.replace(/[\r\n]/g, '')}`, 'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const blobUrl = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = `${(invitation.slug || invitation.id).replace(/[^\w-]/g, '-')}.ics`;
    anchor.click();
    URL.revokeObjectURL(blobUrl);
  }

  const directions = invitation.customData.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(invitation.customData.venue)}`;
  const totalSeconds = remaining === null ? null : Math.floor(remaining / 1000);
  const units = totalSeconds === null ? null : [Math.floor(totalSeconds / 86400), Math.floor(totalSeconds / 3600) % 24, Math.floor(totalSeconds / 60) % 60, totalSeconds % 60];

  return <section className="mt-6 border-t border-[var(--iv-gold-soft)] pt-5" aria-label={messages.countdown}>
    <h2 className="text-sm font-semibold text-[var(--iv-muted)]">{messages.countdown}</h2>
    {units && totalSeconds !== null && totalSeconds > 0 ? <div className="mt-3 grid grid-cols-4 gap-2 text-center">{units.map((value, index) => <div key={index} className="rounded-lg bg-[var(--iv-ivory)] px-2 py-2"><span className="block text-lg font-semibold text-amber-300">{value}</span><span className="text-[10px] text-[var(--iv-muted)]">{[messages.days, messages.hours, messages.minutes, messages.seconds][index]}</span></div>)}</div> : <p className="mt-2 text-sm text-[var(--iv-muted)]">{messages.eventPassed}</p>}
    <div className="mt-4 grid grid-cols-2 gap-2">
      <button type="button" onClick={downloadCalendar} className="rounded-lg border border-[var(--iv-gold-soft)] px-3 py-2.5 text-xs font-semibold text-[var(--iv-muted)] hover:bg-[var(--iv-cream)]">{messages.addCalendar}</button>
      <a href={directions} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-amber-400 px-3 py-2.5 text-center text-xs font-semibold text-[var(--iv-deep)] hover:bg-amber-300">{messages.directions}</a>
    </div>
  </section>;
}

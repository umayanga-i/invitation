'use client';

import Papa from 'papaparse';
import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { Guest, Invitation, RsvpStatus } from '@/lib/mock-data';
import { addGuest, addGuests, deleteGuest, getCommonInvitationUrl, getGuestInvitationUrl, normalizeSriLankanPhone, revokeGuestLink, updateGuest, updateInvitation } from '@/lib/invitations';

type Props = { invitation: Invitation; guests: Guest[]; onGuestsChange: (guests: Guest[]) => void; onInvitationChange: (invitation: Invitation) => void };
type Tab = 'single' | 'paste' | 'csv';
type Candidate = { name: string; phone: string; email?: string; maxPartySize?: number; normalized: string; state: 'ready' | 'duplicate' | 'invalid' };
type QueueItem = { guest: Guest; message: string };

const STATUS_LABEL: Record<RsvpStatus, string> = {
  pending: 'No reply', attending: 'Attending', not_attending: 'Not attending', maybe: 'Maybe',
};

function guestLink(_invitation: Invitation, guest: Guest): string {
  return getGuestInvitationUrl(guest);
}

function whatsappLink(guest: Guest, message: string): string {
  return `https://wa.me/${guest.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

function statusClass(status: RsvpStatus): string {
  const classes: Record<RsvpStatus, string> = {
    pending: 'iv-status-pending', attending: 'iv-status-attending',
    not_attending: 'iv-status-declined', maybe: 'iv-status-maybe',
  };
  return classes[status];
}

export function InvitationManagement({ invitation, guests, onGuestsChange, onInvitationChange }: Props) {
  const [filter, setFilter] = useState<'all' | RsvpStatus>('all');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const [notice, setNotice] = useState('');
  const [publishing, setPublishing] = useState(false);
  const canShare = invitation.status === 'published';

  async function publishInvitation() {
    setPublishing(true);
    try {
      const updated = await updateInvitation(invitation.id, { status: 'published' });
      onInvitationChange(updated);
      setNotice('Invitation published. Its links are now available to guests.');
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Could not publish this invitation.');
    } finally {
      setPublishing(false);
    }
  }

  const count = (status: RsvpStatus) => guests.filter((guest) => guest.rsvpStatus === status).length;
  const attending = guests.filter((guest) => guest.rsvpStatus === 'attending');
  const headcount = attending.reduce((sum, guest) => sum + (guest.partySize ?? 1), 0);
  const stats = [
    { label: 'Invited', value: guests.length },
    { label: 'Opened', value: guests.filter((guest) => Boolean(guest.openedAt)).length },
    { label: 'Attending', value: count('attending') },
    { label: 'Not attending', value: count('not_attending') },
    { label: 'Maybe', value: count('maybe') },
    { label: 'No reply', value: count('pending') },
    { label: 'Total headcount', value: headcount },
  ];

  const filteredGuests = useMemo(() => guests.filter((guest) => {
    const matchesStatus = filter === 'all' || guest.rsvpStatus === filter;
    const matchesName = guest.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
    return matchesStatus && matchesName;
  }), [filter, guests, search]);

  function exportCsv() {
    const csvValue = (value: string | number) => {
      const safe = /^[=+\-@\t\r]/.test(String(value)) ? `'${value}` : String(value);
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const rows = [
      ['Name', 'Phone', 'Status', 'Party size', 'Message', 'Responded date'],
      ...filteredGuests.map((guest) => [
        guest.name,
        guest.phone,
        STATUS_LABEL[guest.rsvpStatus],
        guest.partySize ?? '',
        guest.rsvpMessage ?? '',
        guest.respondedAt ? new Date(guest.respondedAt).toISOString() : '',
      ]),
    ];
    const csv = `\ufeff${rows.map((row) => row.map((value) => csvValue(value)).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${invitation.slug || invitation.id}-guests.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${filteredGuests.length} guest${filteredGuests.length === 1 ? '' : 's'} from the current filter.`);
  }

  const buildQueue = (list: Guest[], reminder = false) => {
    if (!canShare) return setNotice('Publish this invitation before sharing guest links.');
    if (!list.length) return setNotice('There are no guests to send to.');
    setQueue(list.filter((guest) => !guest.revoked).map((guest) => {
      const link = guestLink(invitation, guest);
      return { guest, message: reminder ? `Hi ${guest.name}, a friendly reminder to RSVP for ${invitation.title}: ${link}` : `Hi ${guest.name}, you're invited to ${invitation.title}! Please view your personal invitation and RSVP here: ${link}` };
    }));
    setQueueIndex(0);
  };

  async function copyLink(guest: Guest) {
    if (!canShare) return setNotice('Publish this invitation before sharing guest links.');
    try { await navigator.clipboard.writeText(guestLink(invitation, guest)); setNotice(`Personal link copied for ${guest.name}.`); }
    catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Unable to access the clipboard.'); }
  }

  async function copyCommonLink() {
    if (!canShare) return setNotice('Publish this invitation before sharing guest links.');
    try {
      const link = getCommonInvitationUrl(invitation);
      await navigator.clipboard.writeText(link);
      setNotice('Common invitation link copied.');
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Unable to create the invitation link.');
    }
  }

  async function openWhatsApp(guest: Guest) {
    if (!canShare) return setNotice('Publish this invitation before sharing guest links.');
    const popup = window.open('about:blank', '_blank');
    if (popup) popup.opener = null;
    try {
      const link = guestLink(invitation, guest);
      const message = `Hi ${guest.name}, you're invited to ${invitation.title}! Please RSVP here: ${link}`;
      const target = whatsappLink(guest, message);
      if (popup) popup.location.href = target;
      else setNotice('Allow pop-ups to open WhatsApp, or copy the personal link.');
    } catch (cause) {
      popup?.close();
      setNotice(cause instanceof Error ? cause.message : 'Could not create the invitation link.');
    }
  }

  async function removeGuest(guest: Guest) {
    if (!window.confirm(`Delete ${guest.name} from this invitation?`)) return;
    await deleteGuest(guest.id);
    onGuestsChange(guests.filter((item) => item.id !== guest.id));
    setNotice(`${guest.name} was removed.`);
  }

  async function revoke(guest: Guest) {
    try {
      const updated = await revokeGuestLink(guest.id);
      onGuestsChange(guests.map((item) => item.id === updated.id ? updated : item));
      setNotice(`Personal link revoked for ${guest.name}.`);
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Could not revoke this link.'); }
  }

  async function saveGuest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const phone = normalizeSriLankanPhone(String(form.get('phone') ?? ''));
    if (!name || !/^947\d{8}$/.test(phone)) return setNotice('Enter a name and valid Sri Lankan mobile number.');
    const partyLimitValue = String(form.get('maxPartySize') ?? '').trim();
    const maxPartySize = partyLimitValue ? Number(partyLimitValue) : invitation.customData.maxPartySize ?? 6;
    if (maxPartySize !== undefined && (!Number.isInteger(maxPartySize) || maxPartySize < 1 || maxPartySize > (invitation.customData.maxPartySize ?? 6))) return setNotice(`Guest party limit must be between 1 and ${invitation.customData.maxPartySize ?? 6}.`);
    const updated = await updateGuest(editing.id, { name, phone, email: String(form.get('email') ?? '').trim() || undefined, maxPartySize });
    onGuestsChange(guests.map((item) => item.id === updated.id ? updated : item));
    setEditing(null);
    setNotice('Guest details updated.');
  }

  return (
    <section className="mt-8 space-y-6">
      {!canShare && <div role="status" className="flex flex-col gap-3 rounded-xl border border-amber-800 bg-amber-950/40 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-amber-200">This invitation is a draft</p><p className="mt-1 text-sm text-amber-100/70">Guest links show “Invitation not available” until you publish this invitation.</p></div><button type="button" onClick={() => void publishInvitation()} disabled={publishing} className="shrink-0 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-[var(--iv-deep)] hover:bg-amber-300 disabled:opacity-50">{publishing ? 'Publishing…' : 'Publish invitation'}</button></div>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
        {stats.map((stat) => <article key={stat.label} className="rounded-xl border border-[var(--iv-gold-soft)] bg-[var(--iv-cream)] p-4"><p className="text-xs text-[var(--iv-muted)]">{stat.label}</p><p className="mt-2 text-2xl font-semibold text-[var(--iv-ivory)]">{stat.value}</p></article>)}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--iv-gold-soft)] bg-[var(--iv-cream)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div><h2 className="text-lg font-semibold">Guest list</h2><p className="mt-1 text-sm text-[var(--iv-muted)]">Manage invitations and track replies.</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCsv} disabled={!filteredGuests.length} className="rounded-lg border border-[var(--iv-gold-soft)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--iv-cream)] disabled:cursor-not-allowed disabled:opacity-40">Export CSV</button>
          <button type="button" onClick={() => void copyCommonLink()} disabled={!canShare} title={!canShare ? 'Publish this invitation before sharing' : undefined} className="rounded-lg border border-[var(--iv-gold-soft)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--iv-cream)] disabled:cursor-not-allowed disabled:opacity-40">Copy common link</button>
          <button type="button" onClick={() => buildQueue(guests)} disabled={!canShare} title={!canShare ? 'Publish this invitation before sharing' : undefined} className="rounded-lg border border-[var(--iv-gold-soft)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--iv-cream)] disabled:cursor-not-allowed disabled:opacity-40">Send to all</button>
          <button type="button" onClick={() => buildQueue(guests.filter((guest) => guest.rsvpStatus === 'pending'), true)} disabled={!canShare || !guests.some((guest) => guest.rsvpStatus === 'pending')} className="rounded-lg border border-[var(--iv-gold-soft)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--iv-cream)] disabled:cursor-not-allowed disabled:opacity-40">Send reminder</button>
          <button type="button" onClick={() => setAddOpen(true)} className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-[var(--iv-deep)] hover:bg-amber-300">＋ Add guests</button>
        </div>
      </div>

      {notice && <div role="status" className="flex items-center justify-between rounded-lg border border-[var(--iv-gold-soft)] bg-[var(--iv-cream)] px-4 py-3 text-sm text-[var(--iv-muted)]"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss message" className="ml-4 text-[var(--iv-muted)] hover:text-[var(--iv-ivory)]">×</button></div>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><span className="sr-only">Search guests by name</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search guests by name…" className="w-full rounded-lg border border-[var(--iv-gold-soft)] bg-[var(--iv-cream)] px-4 py-3 text-sm text-[var(--iv-ivory)] placeholder:text-[var(--iv-muted)] focus:border-[var(--iv-gold)] focus:outline-none" /></label>
        <label className="sm:w-52"><span className="sr-only">Filter guests by RSVP status</span><select value={filter} onChange={(event) => setFilter(event.target.value as 'all' | RsvpStatus)} className="w-full rounded-lg border border-[var(--iv-gold-soft)] bg-[var(--iv-cream)] px-3 py-3 text-sm text-[var(--iv-ivory)] focus:border-[var(--iv-gold)] focus:outline-none"><option value="all">All RSVP statuses</option><option value="pending">No reply</option><option value="attending">Attending</option><option value="not_attending">Not attending</option><option value="maybe">Maybe</option></select></label>
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-[var(--iv-gold-soft)] md:block">
        <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
          <thead className="bg-[var(--iv-cream)] text-xs uppercase tracking-wide text-[var(--iv-muted)]"><tr>{['Guest', 'Phone', 'RSVP', 'Party size', 'Guest limit', 'Message', 'Responded', 'Actions'].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-[var(--iv-gold-soft)] bg-[var(--iv-ivory)]">{filteredGuests.map((guest) => <tr key={guest.id} className="text-[var(--iv-muted)]"><td className="px-4 py-4"><div className="font-medium text-[var(--iv-ivory)]">{guest.name}</div><button disabled={!canShare} onClick={() => void copyLink(guest)} className="mt-1 text-xs text-sky-300 hover:underline disabled:cursor-not-allowed disabled:opacity-40">Copy personal link</button></td><td className="px-4 py-4">{guest.phone}</td><td className="px-4 py-4"><StatusBadge status={guest.rsvpStatus} /></td><td className="px-4 py-4">{guest.partySize ?? '—'}</td><td className="px-4 py-4">{guest.maxPartySize ?? invitation.customData.maxPartySize ?? 6}</td><td className="max-w-52 truncate px-4 py-4 text-[var(--iv-muted)]" title={guest.rsvpMessage}>{guest.rsvpMessage || '—'}</td><td className="px-4 py-4 text-[var(--iv-muted)]">{formatDate(guest.respondedAt)}</td><td className="px-4 py-4"><GuestActions guest={guest} canShare={canShare} onCopy={() => void copyLink(guest)} onWhatsApp={() => void openWhatsApp(guest)} onEdit={() => setEditing(guest)} onDelete={() => void removeGuest(guest)} onRevoke={() => void revoke(guest)} /></td></tr>)}</tbody>
        </table>
        {!filteredGuests.length && <p className="bg-[var(--iv-ivory)] p-8 text-center text-sm text-[var(--iv-muted)]">No guests match this search.</p>}
      </div>

      <div className="space-y-3 md:hidden">{filteredGuests.map((guest) => <article key={guest.id} className="rounded-xl border border-[var(--iv-gold-soft)] bg-[var(--iv-cream)] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-[var(--iv-ivory)]">{guest.name}</h3><p className="mt-1 text-sm text-[var(--iv-muted)]">{guest.phone}</p></div><StatusBadge status={guest.rsvpStatus} /></div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><Info label="Party size" value={guest.partySize?.toString() ?? '—'} /><Info label="Guest limit" value={(guest.maxPartySize ?? invitation.customData.maxPartySize ?? 6).toString()} /><Info label="Responded" value={formatDate(guest.respondedAt)} /></div>{guest.rsvpMessage && <p className="mt-3 rounded-lg bg-[var(--iv-ivory)] p-3 text-sm text-[var(--iv-muted)]">{guest.rsvpMessage}</p>}<GuestActions guest={guest} canShare={canShare} onCopy={() => void copyLink(guest)} onWhatsApp={() => void openWhatsApp(guest)} onEdit={() => setEditing(guest)} onDelete={() => void removeGuest(guest)} onRevoke={() => void revoke(guest)} /></article>)}{!filteredGuests.length && <p className="rounded-xl border border-[var(--iv-gold-soft)] bg-[var(--iv-cream)] p-8 text-center text-sm text-[var(--iv-muted)]">No guests match this search.</p>}</div>

      {addOpen && <AddGuestsModal invitationId={invitation.id} invitationMaxPartySize={invitation.customData.maxPartySize} guests={guests} onClose={() => setAddOpen(false)} onAdded={(newGuests) => { onGuestsChange([...guests, ...newGuests]); setAddOpen(false); setNotice(`${newGuests.length} guest${newGuests.length === 1 ? '' : 's'} added.`); }} />}
      {editing && <Modal title="Edit guest" onClose={() => setEditing(null)}><form onSubmit={saveGuest} className="space-y-4"><InputField label="Name" name="name" defaultValue={editing.name} required /><InputField label="Phone" name="phone" defaultValue={editing.phone} required /><InputField label="Email (optional)" name="email" type="email" defaultValue={editing.email ?? ''} /><InputField label={`Maximum party size (invitation max ${invitation.customData.maxPartySize ?? 6})`} name="maxPartySize" type="number" min={1} max={invitation.customData.maxPartySize ?? 6} defaultValue={editing.maxPartySize?.toString() ?? ''} /><div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-[var(--iv-gold-soft)] px-4 py-2 text-sm">Cancel</button><button className="rounded-lg bg-[var(--iv-cream)] px-4 py-2 text-sm font-semibold text-[var(--iv-ivory)]">Save changes</button></div></form></Modal>}
      {queue && <Modal title={queue.length ? `Send invitations · ${queueIndex + 1} of ${queue.length}` : 'Send invitations'} onClose={() => setQueue(null)}><div className="space-y-4"><p className="text-sm text-[var(--iv-muted)]">{queue[queueIndex]?.guest.name}</p><div className="rounded-lg bg-[var(--iv-cream)] p-3 text-sm leading-6 text-[var(--iv-muted)]">{queue[queueIndex]?.message}</div><div className="flex flex-wrap justify-end gap-2"><button onClick={() => setQueue(null)} className="rounded-lg border border-[var(--iv-gold-soft)] px-4 py-2 text-sm">Close</button><a target="_blank" rel="noreferrer" href={queue[queueIndex] ? whatsappLink(queue[queueIndex].guest, queue[queueIndex].message) : '#'} onClick={() => { if (queueIndex + 1 >= queue.length) setQueue(null); else setQueueIndex(queueIndex + 1); }} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-[var(--iv-ivory)]">Open WhatsApp</a><button onClick={() => queueIndex + 1 >= queue.length ? setQueue(null) : setQueueIndex(queueIndex + 1)} className="rounded-lg border border-[var(--iv-gold-soft)] px-4 py-2 text-sm">{queueIndex + 1 >= queue.length ? 'Finish' : 'Next guest →'}</button></div></div></Modal>}
    </section>
  );
}

function StatusBadge({ status }: { status: RsvpStatus }) { const icon = status === 'attending' ? '✓' : status === 'not_attending' ? '×' : status === 'maybe' ? '?' : '·'; return <span className={`iv-status inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(status)}`}><span aria-hidden="true">{icon}</span>{STATUS_LABEL[status]}</span>; }
function formatDate(value?: string) { return value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-[var(--iv-muted)]">{label}</p><p className="mt-1 text-sm text-[var(--iv-muted)]">{value}</p></div>; }

function GuestActions({ guest, canShare, onCopy, onWhatsApp, onEdit, onDelete, onRevoke }: { guest: Guest; canShare: boolean; onCopy: () => void; onWhatsApp: () => void; onEdit: () => void; onDelete: () => void; onRevoke: () => void }) {
  return <div className="mt-4 flex flex-wrap gap-2 md:mt-0"><button type="button" disabled={!canShare} onClick={onWhatsApp} className="rounded-md bg-emerald-700 px-2.5 py-1.5 text-xs font-medium text-[var(--iv-ivory)] hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40">WhatsApp</button><button type="button" disabled title="Coming soon" className="cursor-not-allowed rounded-md border border-[var(--iv-gold-soft)] px-2.5 py-1.5 text-xs text-[var(--iv-muted)]">Email · Coming soon</button><button type="button" onClick={onCopy} disabled={guest.revoked || !canShare} className="rounded-md border border-[var(--iv-gold-soft)] px-2.5 py-1.5 text-xs hover:bg-[var(--iv-cream)] disabled:opacity-40">Copy link</button><button type="button" disabled={guest.revoked} onClick={onRevoke} className="rounded-md border border-amber-800 px-2.5 py-1.5 text-xs text-amber-300 disabled:opacity-40">{guest.revoked ? 'Link revoked' : 'Revoke link'}</button><button type="button" onClick={onEdit} className="rounded-md border border-[var(--iv-gold-soft)] px-2.5 py-1.5 text-xs hover:bg-[var(--iv-cream)]">Edit</button><button type="button" onClick={onDelete} className="rounded-md border border-rose-900 px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-950">Delete</button></div>;
}

function InputField({ label, name, defaultValue, type = 'text', required, min, max }: { label: string; name: string; defaultValue?: string; type?: string; required?: boolean; min?: number; max?: number }) { return <label className="block text-sm font-medium text-[var(--iv-muted)]">{label}<input name={name} type={type} defaultValue={defaultValue} required={required} min={min} max={max} className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] px-3 py-2.5 outline-none focus:border-[var(--iv-gold)]" /></label>; }

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleClose = () => closeRef.current();
    dialog.addEventListener('close', handleClose);
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLElement>('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])')?.focus();
    return () => {
      dialog.removeEventListener('close', handleClose);
      previousFocus?.focus();
    };
  }, []);

  return <dialog ref={dialogRef} aria-labelledby={titleId} onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current?.close(); }} className="backdrop:bg-[var(--iv-deep)]/60 m-auto max-h-[92vh] w-[calc(100%-1rem)] max-w-3xl overflow-y-auto rounded-t-2xl bg-white p-5 text-[var(--iv-deep)] shadow-2xl sm:rounded-2xl sm:p-7"><div className="mb-5 flex items-center justify-between"><h2 id={titleId} className="text-xl font-semibold">{title}</h2><button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close dialog" className="rounded-md px-2 py-1 text-2xl leading-none text-[var(--iv-muted)] hover:bg-[var(--iv-cream)]">×</button></div>{children}</dialog>;
}

function AddGuestsModal({ invitationId, invitationMaxPartySize, guests, onClose, onAdded }: { invitationId: string; invitationMaxPartySize?: number; guests: Guest[]; onClose: () => void; onAdded: (guests: Guest[]) => void }) {
  const [tab, setTab] = useState<Tab>('single');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [maxPartySize, setMaxPartySize] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function makeCandidates(rows: string[][]) {
    const seen = new Set(guests.map((guest) => guest.phone.replace(/\D/g, '')));
    const next = rows.flatMap((row) => {
      const cells = row.map((cell) => cell.trim());
      if (!cells.some(Boolean) || (cells[0]?.toLowerCase() === 'name' && cells[1]?.toLowerCase().includes('phone'))) return [];
      const candidateName = cells[0] ?? '';
      const rawPhone = cells[1] ?? '';
      const rawMaxPartySize = cells[3] ?? '';
      const guestPartyLimit = rawMaxPartySize ? Number(rawMaxPartySize) : undefined;
      const normalized = normalizeSriLankanPhone(rawPhone);
      const validPhone = /^947\d{8}$/.test(normalized);
      const validPartyLimit = guestPartyLimit === undefined || (Number.isInteger(guestPartyLimit) && guestPartyLimit >= 1 && guestPartyLimit <= (invitationMaxPartySize ?? 6));
      const duplicate = validPhone && seen.has(normalized);
      if (validPhone && !duplicate) seen.add(normalized);
      return [{ name: candidateName, phone: rawPhone, email: cells[2] || undefined, maxPartySize: guestPartyLimit, normalized, state: !candidateName || !validPhone || !validPartyLimit ? 'invalid' : duplicate ? 'duplicate' : 'ready' } as Candidate];
    });
    setCandidates(next);
    return next;
  }

  function parseText(text: string) {
    setSourceText(text);
    const normalizedText = text.split(/\r?\n/).map((line) => line.includes('\t') && !line.includes(',') ? line.replace(/\t/g, ',') : line).join('\n');
    const result = Papa.parse<string[]>(normalizedText, { skipEmptyLines: true });
    makeCandidates(result.data);
  }

  function handleCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') || (file.type && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel')) {
      setCandidates([]);
      setError('Please choose a CSV file.');
      event.target.value = '';
      return;
    }
    setError('');
    Papa.parse<string[]>(file, { skipEmptyLines: true, complete: (result) => makeCandidates(result.data) });
  }

  async function submit() {
    setError('');
    setSaving(true);
    try {
      if (tab === 'single') {
        const normalized = normalizeSriLankanPhone(phone);
        if (!name.trim() || !/^947\d{8}$/.test(normalized)) throw new Error('Enter a name and valid Sri Lankan mobile number.');
        if (guests.some((guest) => guest.phone.replace(/\D/g, '') === normalized)) throw new Error('This phone number is already on the guest list.');
        const guestLimit = maxPartySize ? Number(maxPartySize) : undefined;
        if (guestLimit !== undefined && (!Number.isInteger(guestLimit) || guestLimit < 1 || guestLimit > (invitationMaxPartySize ?? 6))) throw new Error(`Party limit must be between 1 and ${invitationMaxPartySize ?? 6}.`);
        const created = await addGuest(invitationId, { name, phone: normalized, email, maxPartySize: guestLimit });
        onAdded([created]);
      } else {
        const preview = candidates.length ? candidates : makeCandidates(Papa.parse<string[]>(sourceText, { skipEmptyLines: true }).data);
        const valid = preview.filter((candidate) => candidate.state === 'ready');
        if (!valid.length) throw new Error('There are no valid, unique guests to add.');
        const created = await addGuests(invitationId, valid.map(({ name: guestName, normalized, email: guestEmail, maxPartySize: guestLimit }) => ({ name: guestName, phone: normalized, email: guestEmail, maxPartySize: guestLimit })));
        onAdded(created);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add guests.');
      setSaving(false);
    }
  }

  return <Modal title="Add guests" onClose={onClose}>
    <div className="mb-5 grid grid-cols-3 rounded-lg bg-[var(--iv-cream)] p-1">{(['single', 'paste', 'csv'] as const).map((item) => <button key={item} type="button" onClick={() => { setTab(item); setError(''); }} className={`rounded-md px-2 py-2 text-sm font-medium capitalize ${tab === item ? 'bg-white text-[var(--iv-deep)] shadow-sm' : 'text-[var(--iv-muted)]'}`}>{item === 'csv' ? 'Upload CSV' : item === 'paste' ? 'Paste list' : 'Single'}</button>)}</div>
    {tab === 'single' ? <div key="single" className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-medium text-[var(--iv-muted)]">Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Guest name" className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] px-3 py-2.5" /></label><label className="block text-sm font-medium text-[var(--iv-muted)]">Phone<input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0771234567" className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] px-3 py-2.5" /><span className="mt-1 block text-xs text-[var(--iv-muted)]">Saved as 94XXXXXXXXX</span></label><label className="block text-sm font-medium text-[var(--iv-muted)]">Guest max party size (optional)<input type="number" min={1} max={invitationMaxPartySize ?? 6} value={maxPartySize} onChange={(event) => setMaxPartySize(event.target.value)} placeholder={`Invitation default: ${invitationMaxPartySize ?? 6}`} className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] px-3 py-2.5" /></label><label className="block text-sm font-medium text-[var(--iv-muted)] sm:col-span-2">Email (optional)<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] px-3 py-2.5" /></label></div> : tab === 'paste' ? <div key="paste"><label className="block text-sm font-medium text-[var(--iv-muted)]">Paste rows as name, phone, email, max party size<textarea value={sourceText} onChange={(event) => parseText(event.target.value)} rows={6} placeholder={'Name, Phone, Email, Max party size\nNadeesha Perera, 0771234567, nadeesha@example.com, 3'} className="mt-2 w-full rounded-lg border border-[var(--iv-gold-soft)] px-3 py-2.5 font-mono text-sm" /></label><p className="mt-2 text-xs text-[var(--iv-muted)]">Party size is optional; leave blank to use the invitation limit.</p></div> : <div key="csv"><label className="block text-sm font-medium text-[var(--iv-muted)]">Choose a CSV file<input type="file" accept=".csv,text/csv" onChange={handleCsv} className="mt-2 block w-full rounded-lg border border-[var(--iv-gold-soft)] p-3 text-sm" /></label><p className="mt-2 text-xs text-[var(--iv-muted)]">Columns: name, phone, email, max party size. Header row is optional.</p></div>}
    {candidates.length > 0 && tab !== 'single' && <div className="mt-5 overflow-x-auto rounded-lg border border-[var(--iv-gold-soft)]"><table className="w-full min-w-[540px] text-left text-xs"><thead className="bg-[var(--iv-cream)] text-[var(--iv-muted)]"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Phone</th><th className="px-3 py-2">Normalized</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Check</th></tr></thead><tbody className="divide-y divide-[var(--iv-gold-soft)]">{candidates.map((candidate, index) => <tr key={`${candidate.phone}-${index}`}><td className="px-3 py-2">{candidate.name || '—'}</td><td className="px-3 py-2">{candidate.phone || '—'}</td><td className="px-3 py-2">{candidate.normalized || '—'}</td><td className="px-3 py-2">{candidate.email || '—'}</td><td className={`px-3 py-2 font-medium ${candidate.state === 'ready' ? 'text-emerald-700' : 'text-rose-700'}`}>{candidate.state === 'ready' ? 'Ready' : candidate.state === 'duplicate' ? 'Duplicate' : 'Invalid'}</td></tr>)}</tbody></table></div>}
    {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-[var(--iv-gold-soft)] px-4 py-2.5 text-sm">Cancel</button><button type="button" disabled={saving} onClick={() => void submit()} className="rounded-lg bg-[var(--iv-cream)] px-4 py-2.5 text-sm font-semibold text-[var(--iv-ivory)] disabled:opacity-50">{saving ? 'Adding…' : 'Add guests'}</button></div>
  </Modal>;
}

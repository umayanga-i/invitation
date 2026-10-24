'use client';

import { useRef, useState } from 'react';
import { uploadInvitationPhoto } from '@/lib/storage';
import type { WeddingPhotoSlot } from '@/lib/wedding-golden';
import styles from './template-photo-slot.module.css';

type Props = {
  slot: WeddingPhotoSlot;
  label: string;
  src?: string;
  className?: string;
  contain?: boolean;
  onChange?: (slot: WeddingPhotoSlot, photo: string) => void;
  onBusyChange?: (slot: WeddingPhotoSlot, uploading: boolean) => void;
};

export function TemplatePhotoSlot({ slot, label, src, className = '', contain = false, onChange, onBusyChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const editable = Boolean(onChange);
  return <div className={`${styles.slot} ${className}`} data-photo-slot={slot}>
    {src ? (
      // User photos are optimized at selection time and saved as data URLs.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={label} loading={slot === 'hero' ? 'eager' : 'lazy'} className={styles.image} style={{ objectFit: contain ? 'contain' : 'cover' }} />
    ) : <div className={styles.empty} aria-hidden="true"><span>♡</span></div>}
    {editable && <>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label={`Choose ${label.toLowerCase()}`} hidden disabled={busy} onChange={async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setError('');
        setBusy(true);
        onBusyChange?.(slot, true);
        try {
          const photo = await uploadInvitationPhoto(file, { maxDataUrlLength: 600_000 });
          onChange?.(slot, photo);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : 'Could not add this photo.');
        } finally {
          if (input.current) input.current.value = '';
          setBusy(false);
          onBusyChange?.(slot, false);
        }
      }} />
      <button type="button" className={`${styles.add} ${src ? styles.replace : ''}`} aria-label={`${src ? 'Replace' : 'Add'} ${label.toLowerCase()}`} disabled={busy} onClick={() => input.current?.click()}>
        <span className={styles.plus} aria-hidden="true">+</span><span>{busy ? 'Adding photo…' : src ? 'Replace photo' : 'Add photo'}</span>
      </button>
      {src && !busy && <button type="button" className={styles.remove} aria-label={`Remove ${label.toLowerCase()}`} onClick={() => { setError(''); onChange?.(slot, ''); }}><span aria-hidden="true">×</span></button>}
      {busy && <span className={styles.progress} role="status">Optimizing photo…</span>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </>}
  </div>;
}

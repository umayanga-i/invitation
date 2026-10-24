'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import styles from './golden-envelope.module.css';

type Props = {
  hostNames: string;
  guestName?: string;
  colors: { primary: string; secondary: string; accent: string };
  onComplete: () => void;
  preview?: boolean;
};

/** The supplied envelope's inline JavaScript, adapted to React with cleanup and keyboard support. */
export function GoldenEnvelope({ hostNames, guestName, colors, onComplete, preview }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const openButton = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);
  const [phase, setPhase] = useState<'sealed' | 'opening' | 'revealing'>('sealed');

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element?.showModal();
    openButton.current?.focus({ preventScroll: true });
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  function open() {
    if (phase !== 'sealed') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete();
      return;
    }
    setPhase('opening');
    timers.current.push(window.setTimeout(() => setPhase('revealing'), 1250));
    timers.current.push(window.setTimeout(onComplete, 1850));
  }

  return <dialog ref={dialog} className={styles.dialog} data-phase={phase} style={{ '--envelope-paper': colors.secondary, '--envelope-ink': colors.primary, '--envelope-gold': colors.accent } as CSSProperties} aria-label="Wedding envelope" onCancel={(event) => { event.preventDefault(); onComplete(); }}>
    {preview && <button type="button" className={styles.close} aria-label="Close envelope preview" onClick={onComplete}>×</button>}
    <div className={styles.content}>
      <p className={styles.eyebrow}>An invitation, sealed with love</p>
      {guestName && <p className={styles.greeting}>Dear {guestName},</p>}
      <button ref={openButton} type="button" autoFocus className={styles.envelope} aria-label="Open invitation" disabled={phase !== 'sealed'} onClick={open}>
        <span className={styles.back} />
        <span className={styles.letter}><span className={styles.letterEyebrow}>Together is a beautiful place to be</span><span className={styles.names}>{hostNames}</span><span className={styles.letterHeart} aria-hidden="true">♡</span></span>
        <span className={styles.front} />
        <span className={styles.flap} />
        <span className={styles.twine} />
        <span className={styles.seal} aria-hidden="true">♡</span>
      </button>
      <p className={styles.tap} aria-live="polite">{phase === 'sealed' ? 'Tap to open' : 'Opening your invitation…'}</p>
      <p className={styles.caption}>A day to remember. A love to celebrate.</p>
    </div>
  </dialog>;
}

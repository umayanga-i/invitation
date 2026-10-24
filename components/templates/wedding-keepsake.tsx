'use client';

import { useEffect, useRef, useState } from 'react';
import WeddingGolden from './wedding-golden';
import { GoldenEnvelope } from './golden-envelope';
import type { TemplateData } from './types';
import '../../public/assets/templates/golden-keepsake/fonts.css';
import styles from './wedding-keepsake.module.css';

export default function WeddingKeepsake(data: TemplateData) {
  const root = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState(false);
  const [previewEnvelope, setPreviewEnvelope] = useState(false);
  const publicPage = data.displayMode === 'public';
  const gated = publicPage && !opened;

  useEffect(() => {
    if (publicPage && opened) root.current?.querySelector<HTMLElement>('[data-section="hero"]')?.focus({ preventScroll: true });
  }, [publicPage, opened]);

  return <div ref={root} className={styles.wrapper}>
    {data.displayMode === 'preview' && <div className={styles.previewBar}><span>Sealed with love</span><button type="button" onClick={() => setPreviewEnvelope(true)}>Preview envelope ↗</button></div>}
    {(gated || previewEnvelope) && <GoldenEnvelope hostNames={data.hostNames} guestName={data.guestName} colors={data.colors} preview={previewEnvelope} onComplete={() => { if (publicPage) setOpened(true); setPreviewEnvelope(false); }} />}
    <div inert={gated}><WeddingGolden {...data} keepsake /></div>
  </div>;
}

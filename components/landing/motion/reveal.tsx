'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

const revealCallbacks = new Map<Element, () => void>();
let sharedObserver: IntersectionObserver | null = null;

export function Reveal({ children, variant = 'fade-up', className = '' }: { children: ReactNode; variant?: 'fade-up' | 'clip-up' | 'scale-in'; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVisible(true); return; }
    if (!sharedObserver) sharedObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) {
        revealCallbacks.get(entry.target)?.();
        revealCallbacks.delete(entry.target);
        sharedObserver?.unobserve(entry.target);
      }
    }, { threshold: 0.15 });
    revealCallbacks.set(node, () => setVisible(true));
    sharedObserver.observe(node);
    return () => { revealCallbacks.delete(node); sharedObserver?.unobserve(node); };
  }, []);
  return <div ref={ref} className={`iv-reveal iv-${variant} ${visible ? 'is-visible' : ''} ${className}`}>{children}</div>;
}

export function SplitHeading({ children, className = '' }: { children: string; className?: string }) {
  return <span className={`iv-split ${className}`} aria-label={children}>{children.split(' ').map((word, i) => <span className="iv-word-mask" key={`${word}-${i}`} aria-hidden="true"><span style={{ transitionDelay: `${i * 60}ms` }}>{word}&nbsp;</span></span>)}</span>;
}

export function MagneticButton({ children, className = '', ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} className={`iv-magnetic ${className}`} onMouseMove={(e) => { if (window.matchMedia('(hover: hover)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', `${(e.clientX - r.left - r.width / 2) * .08}px`); e.currentTarget.style.setProperty('--my', `${(e.clientY - r.top - r.height / 2) * .08}px`); } }} onMouseLeave={(e) => { e.currentTarget.style.setProperty('--mx', '0px'); e.currentTarget.style.setProperty('--my', '0px'); }}>{children}</a>;
}

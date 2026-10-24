'use client';

/**
 * Horizontal scrolling category row with left/right arrow navigation.
 * Arrows are desktop-only; mobile uses native swipe scroll.
 * Uses scroll-snap for smooth UX.
 */

import { useRef, useState, useCallback } from 'react';
import type { MockTemplate } from '@/lib/mock-data';
import { TemplateCard, TemplateCardSkeleton } from './template-card';

type Props = {
  title: string;
  emoji: string;
  templates: MockTemplate[];
  loading?: boolean;
};

const SCROLL_AMOUNT = 580; // px per arrow click

export function CategoryRow({ title, emoji, templates, loading = false }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Update arrow visibility based on scroll position
  const handleScroll = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  const scrollLeft = useCallback(() => {
    rowRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
  }, []);

  const scrollRight = useCallback(() => {
    rowRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
  }, []);

  return (
    <section className="mb-10" aria-label={`${title} templates`}>
      {/* Row header */}
      <div className="flex items-center gap-2 mb-3 px-4 md:px-8">
        <span className="text-lg" aria-hidden="true">{emoji}</span>
        <h2 className="text-[var(--iv-deep)] font-semibold text-base sm:text-lg tracking-tight">
          {title}
        </h2>
        <span className="text-[var(--iv-muted)] text-xs ml-1">
          ({loading ? '—' : templates.length})
        </span>
      </div>

      {/* Scroll container with arrows */}
      <div className="relative group/row">
        {/* Left arrow — desktop only */}
        <button
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          aria-label={`Scroll ${title} left`}
          className={[
            'hidden md:flex',
            'absolute left-0 top-0 bottom-0 z-10 w-12',
            'items-center justify-center',
            'bg-gradient-to-r from-[var(--iv-deep)]/90 to-transparent',
            'text-[var(--iv-gold-soft)] text-xl transition-opacity duration-200',
            'opacity-0 group-hover/row:opacity-100',
            canScrollLeft ? 'cursor-pointer' : 'cursor-default opacity-0! pointer-events-none',
          ].join(' ')}
        >
          ‹
        </button>

        {/* Right arrow — desktop only */}
        <button
          onClick={scrollRight}
          disabled={!canScrollRight}
          aria-label={`Scroll ${title} right`}
          className={[
            'hidden md:flex',
            'absolute right-0 top-0 bottom-0 z-10 w-12',
            'items-center justify-center',
            'bg-gradient-to-l from-[var(--iv-deep)]/90 to-transparent',
            'text-[var(--iv-gold-soft)] text-xl transition-opacity duration-200',
            'opacity-0 group-hover/row:opacity-100',
            canScrollRight ? 'cursor-pointer' : 'cursor-default opacity-0! pointer-events-none',
          ].join(' ')}
        >
          ›
        </button>

        {/* Scrollable cards track */}
        <div
          ref={rowRef}
          onScroll={handleScroll}
          className={[
            'flex gap-3 overflow-x-auto pb-2',
            'px-4 md:px-8',
            // Snap
            'snap-x snap-mandatory',
            // Hide scrollbar visually
            '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
          ].join(' ')}
          role="list"
        >
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="snap-start flex-none">
                  <TemplateCardSkeleton />
                </div>
              ))
            : templates.map((t) => (
                <div key={t.id} className="snap-start flex-none" role="listitem">
                  <TemplateCard template={t} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

'use client';

/**
 * Template Card component for the Netflix-style dashboard.
 * Poster-style (2:3 ratio), with optional template artwork.
 * Hover reveals overlay action buttons.
 */

import Link from 'next/link';
import type { MockTemplate } from '@/lib/mock-data';

// ──────────────────────────────────────────────────────────
// Skeleton
// ──────────────────────────────────────────────────────────

export function TemplateCardSkeleton() {
  return (
    <div
      className="flex-none w-[160px] sm:w-[190px]"
      aria-hidden="true"
    >
      <div className="w-full aspect-[2/3] rounded-lg bg-[var(--iv-cream)] animate-pulse" />
      <div className="mt-2 h-3 w-3/4 rounded bg-[var(--iv-cream)] animate-pulse" />
      <div className="mt-1 h-2.5 w-1/2 rounded bg-[var(--iv-gold-soft)] animate-pulse" />
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Template preview art (no external images)
// ──────────────────────────────────────────────────────────

function TemplateArt({ template }: { template: MockTemplate }) {
  if (template.thumbnail) {
    return <div className="relative h-full w-full overflow-hidden" style={{ background: template.bgColor }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={template.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#33291f] to-transparent px-3 pb-12 pt-16 text-center text-white">
        <span className="font-serif text-lg">{template.name}</span>
        <span className="mt-1 block text-[9px] uppercase tracking-[.25em]">Wedding invitation</span>
      </div>
    </div>;
  }
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: template.bgColor }}
    >
      {/* Decorative top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: template.secondaryColor }}
      />

      {/* Background pattern dots */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle, ${template.secondaryColor} 1px, transparent 1px)`,
          backgroundSize: '18px 18px',
        }}
      />

      {/* Center symbol */}
      <div
        className="text-4xl sm:text-5xl mb-3 relative z-10 drop-shadow-sm"
        aria-hidden="true"
        style={{ color: template.primaryColor }}
      >
        {template.symbol}
      </div>

      {/* Name lines */}
      <div className="relative z-10 px-3 text-center">
        <div
          className="font-serif text-xs sm:text-sm leading-tight font-semibold"
          style={{ color: template.primaryColor }}
        >
          {template.name}
        </div>
        <div
          className="mt-1.5 w-8 h-px mx-auto"
          style={{ backgroundColor: template.secondaryColor }}
        />
        <div
          className="mt-1.5 text-[10px] uppercase tracking-widest opacity-70"
          style={{ color: template.primaryColor }}
        >
          {template.category.replace('-', ' ')}
        </div>
      </div>

      {/* Premium badge */}
      {template.isPremium && (
        <div
          className="absolute top-2 right-2 rounded-sm bg-[var(--iv-deep)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--iv-ivory)] z-10"
        >
          PRO
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Main card
// ──────────────────────────────────────────────────────────

type Props = {
  template: MockTemplate;
  /** Shows the card in loading skeleton state */
  loading?: boolean;
};

export function TemplateCard({ template, loading = false }: Props) {
  if (loading) return <TemplateCardSkeleton />;

  return (
    <article
      className="flex-none w-[160px] sm:w-[190px] group cursor-pointer"
      aria-label={`${template.name} template`}
    >
      {/* Poster wrapper — 2:3 ratio */}
      <Link
        href={`/templates/${template.id}`}
        aria-label={`Use the ${template.name} template`}
        className="relative block w-full aspect-[2/3] rounded-lg overflow-hidden shadow-md transition-transform duration-300 ease-out group-hover:scale-105 group-hover:shadow-2xl group-hover:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <TemplateArt template={template} />
        <span className="absolute inset-x-2 bottom-2 rounded-md bg-[var(--iv-deep)]/85 px-2 py-2 text-center text-[11px] font-semibold text-[var(--iv-ivory)] sm:translate-y-2 sm:opacity-0 sm:transition sm:group-hover:translate-y-0 sm:group-hover:opacity-100">Use this template →</span>
      </Link>

      {/* Card footer */}
      <div className="mt-2 px-0.5">
        <p className="text-[var(--iv-deep)] text-xs font-medium leading-tight line-clamp-1">
          {template.name}
        </p>
        <p className="text-[var(--iv-muted)] text-[10px] mt-0.5 capitalize">
          {template.category.replace(/-/g, ' ')}
          {template.isPremium && (
            <span className="ml-1.5 text-amber-400 font-semibold">✦ Pro</span>
          )}
        </p>
      </div>
    </article>
  );
}

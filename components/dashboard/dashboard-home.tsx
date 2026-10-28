'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { HARDCODED_TEMPLATES, loadState, type MockTemplate, type Template } from '@/lib/mock-data';
import { CategoryRow } from './category-row';
import { MyInvitationsRow } from './my-invitations-row';

const CATEGORY_ROWS = [
  { key: 'wedding', title: 'Weddings', emoji: '💍' },
  { key: 'birthday', title: 'Birthdays', emoji: '🎂' },
  { key: 'baby_shower', title: 'Baby Showers', emoji: '🍼' },
  { key: 'housewarming', title: 'Housewarming', emoji: '🏡' },
  { key: 'religious_cultural', title: 'Religious', emoji: '🪷' },
  { key: 'corporate', title: 'Corporate', emoji: '✨' },
] as const;

function toCard(template: Template, index: number, tier?: 'free' | 'pro'): MockTemplate {
  return {
    ...template,
    bgColor: template.colors.secondary,
    primaryColor: template.colors.primary,
    secondaryColor: template.colors.accent,
    symbol: ['✦', '❋', '❀', '♡'][index % 4],
    isPremium: tier ? tier === 'pro' : index % 6 === 5,
  };
}

export function DashboardHome() {
  const [templates, setTemplates] = useState<MockTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const search = useSearchParams().get('q') ?? '';

  useEffect(() => {
    // Load templates asynchronously to avoid synchronous setState inside effect body
    const load = async () => {
      const storedTemplates = loadState().templates;
      const response = await fetch('/api/templates').catch(() => null);
      const enabled = response?.ok ? await response.json() as Array<Template & { tier: 'free' | 'pro' }> : HARDCODED_TEMPLATES.map((item,index)=>({...item,tier:index%6===5?'pro' as const:'free' as const}));
      const source = [...storedTemplates.filter(item=>enabled.some(template=>template.id===item.id)), ...enabled.filter((item) => !storedTemplates.some((stored) => stored.id === item.id))];
      setTemplates(source.map((template,index) => toCard(template,index,(template as Template & {tier?: 'free'|'pro'}).tier)));
      setLoading(false);
    };
    // Use microtask so setState is not called synchronously in the effect
    const id = window.setTimeout(load, 0);

    return () => window.clearTimeout(id);
  }, []);

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredTemplates = useMemo(() => {
    if (!normalizedSearch) return templates;
    return templates.filter((template) =>
      `${template.name} ${template.description} ${template.category}`.toLocaleLowerCase().includes(normalizedSearch),
    );
  }, [normalizedSearch, templates]);

  return (
    <main className="iv-dashboard min-h-screen overflow-hidden bg-[var(--iv-ivory)] pb-12 text-[var(--iv-ink)]">
      <section className="relative isolate min-h-[390px] overflow-hidden sm:min-h-[470px]">
        <div className="iv-dashboard-banner-bg absolute inset-0 -z-20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[var(--iv-deep)] via-[var(--iv-deep)]/35 to-[var(--iv-deep)]/10" />
        <div className="mx-auto flex min-h-[390px] max-w-screen-2xl items-end px-4 pb-10 pt-16 sm:min-h-[470px] sm:px-8 sm:pb-14">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">Your moments, beautifully told</p>
            <h1 className="max-w-xl font-serif text-4xl font-semibold tracking-tight sm:text-6xl">Make every invitation feel like an occasion.</h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--iv-muted)] sm:text-base">
              Find a design for the people and moments you want to celebrate. Make it yours, then share the joy.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/templates/wedding-classic" className="rounded-full bg-[var(--iv-gold-soft)] px-5 py-3 text-sm font-semibold text-[var(--iv-deep)] transition hover:bg-[var(--iv-gold)]">＋ Create invitation</Link>
              <Link href="/#templates" className="rounded-lg border border-[var(--iv-gold-soft)]/60 bg-white/10 px-5 py-3 text-sm font-semibold text-[var(--iv-ivory)] backdrop-blur transition hover:bg-white/15">Browse templates</Link>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--iv-deep)] to-transparent" />
      </section>

      <div id="templates" className="relative -mt-2 scroll-mt-20 space-y-8 sm:space-y-10">
        <MyInvitationsRow />
        {CATEGORY_ROWS.map(({ key, title, emoji }) => {
          const rowTemplates = filteredTemplates.filter((template) => template.category === key);
          return (
            <CategoryRow
              key={key}
              title={title}
              emoji={emoji}
              templates={rowTemplates}
              loading={loading}
            />
          );
        })}
        {!loading && normalizedSearch && filteredTemplates.length === 0 && (
          <p className="px-4 text-sm text-[var(--iv-muted)] md:px-8">No templates match “{search}”. Try another search.</p>
        )}
      </div>
    </main>
  );
}

'use client';

import type { GoldenWeddingDetails } from '@/lib/wedding-golden';

type Props = { value: GoldenWeddingDetails; onChange: (value: GoldenWeddingDetails) => void };

const inputClass = 'mt-1.5 w-full rounded-lg border border-[var(--iv-gold-soft)] bg-white px-3 py-2.5 text-sm';

export function WeddingGoldenFields({ value, onChange }: Props) {
  const field = (label: string, key: Exclude<keyof GoldenWeddingDetails, 'events'>, type = 'text') => <label className="block text-sm font-medium" key={key}>{label}<input type={type} value={value[key]} maxLength={type === 'tel' ? 30 : 250} onChange={(event) => onChange({ ...value, [key]: event.target.value })} className={inputClass} /></label>;
  return <div className="space-y-5" aria-label="Golden Journey details">
    <fieldset className="space-y-4 rounded-xl border border-[var(--iv-gold-soft)] p-4">
      <legend className="px-1 text-sm font-semibold">Family & story</legend>
      {field("First partner’s parents", 'firstParents')}
      {field("Second partner’s parents", 'secondParents')}
      {field('Story heading', 'storyTitle')}
      {field('Venue address', 'venueAddress')}
      {field('First partner’s phone', 'firstPhone', 'tel')}
      {field('Second partner’s phone', 'secondPhone', 'tel')}
    </fieldset>
    <fieldset className="space-y-4 rounded-xl border border-[var(--iv-gold-soft)] p-4">
      <legend className="px-1 text-sm font-semibold">Event schedule</legend>
      <p className="text-xs leading-5 text-[var(--iv-muted)]">All events use the wedding date above. The wedding ceremony uses the main time and venue.</p>
      {value.events.map((event, index) => <fieldset key={index} className="space-y-3 border-t border-[var(--iv-gold-soft)] pt-3">
        <legend className="text-xs font-semibold">Event {index + 1}</legend>
        {(['title', ...(index === 1 ? [] : ['time', 'venue'])] as const).map((key) => <label key={key} className="block text-sm font-medium">Event {index + 1} {key}<input type={key === 'time' ? 'time' : 'text'} value={event[key as keyof typeof event]} required={key === 'title' || key === 'time'} maxLength={key === 'title' ? 100 : 250} className={inputClass} onChange={(change) => onChange({ ...value, events: value.events.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: change.target.value } : item) })} /></label>)}
      </fieldset>)}
    </fieldset>
  </div>;
}

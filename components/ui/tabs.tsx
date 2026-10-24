'use client';

import { useState, type ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export function Tabs({ tabs, defaultTab, className = '' }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? '');
  const current = tabs.find((t) => t.id === active);

  return (
    <div className={className}>
      <div className="iv-tabs-ui flex border-b border-[var(--iv-gold-soft)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2.5 text-sm transition-colors relative ${
              active === tab.id
                ? 'text-[var(--iv-maroon)] font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--iv-gold)]'
                : 'text-[var(--iv-muted)] hover:text-[var(--iv-maroon)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{current?.content}</div>
    </div>
  );
}

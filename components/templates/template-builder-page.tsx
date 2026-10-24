'use client';

import Link from 'next/link';
import { getTemplate } from './registry';
import { TemplateEditor } from './template-editor';

export function TemplateBuilderPage({ templateId }: { templateId: string }) {
  const template = getTemplate(templateId);
  if (!template) return <main className="iv-state-page"><span className="iv-state-icon" aria-hidden="true">✉</span><h1>Template not found</h1><Link className="iv-state-link" href="/#templates">Browse templates</Link></main>;

  return <div className="relative"><Link href="/#templates" className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-[var(--iv-deep)] shadow-sm hover:bg-white">← Browse templates</Link><TemplateEditor template={template} /></div>;
}

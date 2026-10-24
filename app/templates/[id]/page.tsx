import type { Metadata } from 'next';
import { TemplateBuilderPage } from '@/components/templates/template-builder-page';
import { getTemplate } from '@/components/templates/registry';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const template = getTemplate(id);
  if (!template) return { title: 'Template not found', robots: { index: false, follow: false } };
  const description = `${template.description}. Personalize the ${template.name} invitation template and share it with your guests.`;
  return {
    title: template.name,
    description,
    openGraph: { title: `${template.name} Invitation Template`, description, type: 'website' },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TemplateBuilderPage templateId={id} />;
}

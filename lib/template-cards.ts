import type { MockTemplate, Template } from '@/lib/mock-data';

export function toTemplateCard(template: Template, index: number): MockTemplate {
  return {
    ...template,
    bgColor: template.colors.secondary,
    primaryColor: template.colors.primary,
    secondaryColor: template.colors.accent,
    symbol: ['✦', '❋', '❀', '♡'][index % 4],
    isPremium: index % 6 === 5,
  };
}

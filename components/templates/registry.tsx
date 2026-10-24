import { HARDCODED_TEMPLATES } from '@/lib/mock-data';
import type { TemplateComponent } from './types';
import WeddingFloral from './wedding-floral';
import WeddingModern from './wedding-modern';
import WeddingTropical from './wedding-tropical';
import WeddingIvory from './wedding-ivory';
import WeddingGolden from './wedding-golden';
import WeddingKeepsake from './wedding-keepsake';
import BirthdayConfetti from './birthday-confetti';
import BirthdayFun from './birthday-fun';
import BirthdayElegant from './birthday-elegant';
import BabyPastel from './baby-pastel';
import BabyReveal from './baby-reveal';
import BabyWoodland from './baby-woodland';
import HouseModern from './house-modern';
import HouseTraditional from './house-traditional';
import HouseGarden from './house-garden';
import ReligiousAlmsgiving from './religious-almsgiving';
import ReligiousFirstBirthday from './religious-first-birthday';
import ReligiousPooja from './religious-pooja';
import CorporateConference from './corporate-conference';
import CorporateGala from './corporate-gala';
import CorporateLaunch from './corporate-launch';

const components: Record<string, TemplateComponent['Component']> = {
  'wedding-classic': WeddingFloral,
  'wedding-modern': WeddingModern,
  'wedding-tropical': WeddingTropical,
  'wedding-ivory': WeddingIvory,
  'wedding-golden': WeddingGolden,
  'wedding-keepsake': WeddingKeepsake,
  'birthday-festive': BirthdayConfetti,
  'birthday-kids': BirthdayFun,
  'birthday-elegant': BirthdayElegant,
  'baby-pastel': BabyPastel,
  'baby-gender-reveal': BabyReveal,
  'baby-woodland': BabyWoodland,
  'house-modern': HouseModern,
  'house-traditional': HouseTraditional,
  'house-garden': HouseGarden,
  'religious-almsgiving': ReligiousAlmsgiving,
  'religious-first-birthday': ReligiousFirstBirthday,
  'religious-pooja': ReligiousPooja,
  'corporate-conference': CorporateConference,
  'corporate-gala': CorporateGala,
  'corporate-launch': CorporateLaunch,
};

export const templateRegistry: TemplateComponent[] = HARDCODED_TEMPLATES.map((template) => ({
  id: template.id,
  name: template.name,
  category: template.category,
  description: template.description,
  layout: ['wedding-ivory', 'wedding-golden', 'wedding-keepsake'].includes(template.id) ? 'page' : undefined,
  supportsWeddingDetails: ['wedding-golden', 'wedding-keepsake'].includes(template.id),
  defaultColors: template.colors,
  Component: components[template.id],
}));

export function getTemplate(id: string): TemplateComponent | undefined {
  return templateRegistry.find((template) => template.id === id);
}

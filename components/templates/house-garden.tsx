'use client';
import type { TemplateData } from './types';
import { DecoratedTemplate } from './decorated-template';
export default function HouseGarden(props: TemplateData) { return <DecoratedTemplate {...props} variant={5} motif="Come gather in our garden" />; }

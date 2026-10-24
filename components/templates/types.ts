import type React from 'react';
import type { GoldenWeddingDetails, WeddingPhotos, WeddingPhotoSlot } from '@/lib/wedding-golden';

/**
 * Shared data shape passed to every invitation template component.
 */
export interface TemplateData {
  /** e.g. 'Amaya & Dilan' */
  hostNames: string;
  /** e.g. 'Wedding Celebration' */
  eventTitle: string;
  /** Human-readable date string, e.g. 'February 14, 2027' */
  date: string;
  /** e.g. '4:30 PM' */
  time: string;
  /** Venue / location name */
  venue: string;
  mapLink?: string;
  message?: string;
  /** base64 data URL or remote URL */
  photo?: string;
  photos?: WeddingPhotos;
  weddingDetails?: GoldenWeddingDetails;
  /** Editor callbacks are omitted from guest-facing invitations. */
  onPhotoChange?: (slot: WeddingPhotoSlot, photo: string) => void;
  onPhotoUploadStateChange?: (slot: WeddingPhotoSlot, uploading: boolean) => void;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  /** When set, personalises the header: 'Dear {guestName},' */
  guestName?: string;
  /** Full page templates use compact artwork in gallery cards by default. */
  displayMode?: 'thumbnail' | 'preview' | 'public';
  /** The shared, persisted RSVP form supplied by the public invitation page. */
  rsvpContent?: React.ReactNode;
  rsvpDeadline?: string;
}

/**
 * Registry entry for a single template.
 */
export interface TemplateComponent {
  id: string;
  name: string;
  /** One of the EventCategory strings */
  category: string;
  description: string;
  layout?: 'page';
  supportsWeddingDetails?: boolean;
  defaultColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  Component: React.ComponentType<TemplateData>;
}

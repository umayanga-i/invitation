export type EventCategory =
  | "wedding"
  | "birthday"
  | "baby-shower"
  | "housewarming"
  | "religious-ceremony"
  | "corporate-event";

export type InvitationColors = {
  primary: string;
  secondary: string;
  background: string;
  text: string;
};

export type InvitationData = {
  title: string;
  hostNames: string[];
  eventType: string;
  date: string;
  time: string;
  venueName: string;
  venueAddress: string;
  mapLink?: string;
  photoUrl?: string;
  message?: string;
  colors: InvitationColors;
  guestName?: string;
};

export type TemplateConfig = {
  code: string;
  name: string;
  category: EventCategory;
  previewImage: string;
  fields: readonly (keyof InvitationData)[];
  defaultColors: InvitationColors;
  isPremium: boolean;
};

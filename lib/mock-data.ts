// lib/mock-data.ts
// Central mock data store for the invitation platform
// TODO: Replace with Supabase database calls when backend is ready
import { GOLDEN_WEDDING_DETAILS, type GoldenWeddingDetails, type WeddingPhotos } from './wedding-golden';

// ─── Types ─────────────────────────────────────────────────────────────────

export type RsvpStatus = 'pending' | 'attending' | 'not_attending' | 'maybe';

export type TemplateCategory =
  | 'wedding'
  | 'birthday'
  | 'baby_shower'
  | 'housewarming'
  | 'religious_cultural'
  | 'corporate';

export interface TemplateColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface TemplateSampleData {
  hostNames: string;
  eventTitle: string;
  date: string;
  time: string;
  venue: string;
  message: string;
  rsvpDeadline?: string;
  weddingDetails?: GoldenWeddingDetails;
}

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  colors: TemplateColors;
  sampleData: TemplateSampleData;
  thumbnail?: string;
}

/** Presentation shape used by the dashboard template cards. */
export type MockTemplate = Template & {
  bgColor: string;
  primaryColor: string;
  secondaryColor: string;
  symbol: string;
  isPremium: boolean;
};

/** Compact presentation shape used by the dashboard invitation row. */
export interface MockInvitation {
  id: string;
  title: string;
  templateId: string;
  category: TemplateCategory;
  date: string;
  guestCount: number;
  status: 'draft' | 'sent' | 'archived';
  rsvpCount: number;
  primaryColor: string;
  symbol: string;
}

export interface Guest {
  id: string;
  invitationId: string;
  name: string;
  phone: string;
  email?: string;
  code?: string;
  personalToken: string;
  revoked?: boolean;
  rsvpStatus: RsvpStatus;
  partySize?: number;
  rsvpMessage?: string;
  maxPartySize?: number;
  openedAt?: string;   // ISO date string
  respondedAt?: string; // ISO date string
}

export interface InvitationCustomData {
  hostNames: string;
  eventTitle: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM (24h)
  venue: string;
  mapLink?: string;
  message: string;
  photo?: string;      // URL or base64
  photos?: WeddingPhotos;
  weddingDetails?: GoldenWeddingDetails;
  colors: TemplateColors;
  guestName?: string;  // For personal invitations
  rsvpDeadline?: string;
  maxPartySize?: number;
}

export interface Invitation {
  id: string;
  slug: string;
  title: string;
  templateId: string;
  userId: string;
  type: 'common' | 'personal';
  customData: InvitationCustomData;
  createdAt: string;   // ISO date string
  status: 'draft' | 'published' | 'archived';
  guestCount?: number;
  rsvpCount?: number;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  provider: 'email' | 'google' | 'phone';
  createdAt: string;
}

// ─── Template Data ──────────────────────────────────────────────────────────

export const HARDCODED_TEMPLATES: Template[] = [
  {
    id: 'wedding-ivory',
    name: 'Ivory & Gold',
    category: 'wedding',
    description: 'An embossed floral envelope opens to an ivory and gold wedding invitation, with photos, a countdown, venue details and RSVP.',
    colors: { primary: '#5a4d41', secondary: '#fbf9f4', accent: '#a98a4a' },
    thumbnail: '/images/templates/wedding-ivory/couple-hero.webp',
    sampleData: {
      hostNames: 'Hiruni & Kavindu',
      eventTitle: 'Wedding Celebration',
      date: '2027-01-23',
      time: '10:30',
      venue: 'Cinnamon Grand Colombo',
      message: 'Together with our families, we joyfully invite you to celebrate our marriage. It would mean so much to share this new chapter with you.',
    },
  },
  // ── Weddings ──────────────────────────────────────────────────────────────
  {
    id: 'wedding-classic',
    name: 'Classic Elegance',
    category: 'wedding',
    description: 'Timeless ivory and gold wedding invitation with floral accents',
    colors: { primary: '#6d201c', secondary: '#f5f0eb', accent: '#c9a84c' },
    sampleData: {
      hostNames: 'Amaya & Dilan',
      eventTitle: 'Wedding Celebration',
      date: '2027-02-14',
      time: '16:30',
      venue: 'Lotus Garden Hall, 42 Lighthouse Road, Galle',
      message:
        'After years of friendship, laughter, and unforgettable memories, we are beginning our next chapter together. Your presence would make our special day even more meaningful.',
    },
  },
  {
    id: 'wedding-modern',
    name: 'Modern Minimalist',
    category: 'wedding',
    description: 'Clean, contemporary design with bold typography and subtle geometric patterns',
    colors: { primary: '#1a1a2e', secondary: '#ffffff', accent: '#e94560' },
    sampleData: {
      hostNames: 'Priya & Kavin',
      eventTitle: 'A Wedding to Remember',
      date: '2027-04-20',
      time: '17:00',
      venue: 'Sky Lounge, Colombo 07',
      message:
        'Two hearts, one love story. Join us as we celebrate the beginning of forever. We can\'t imagine this day without you.',
    },
  },
  {
    id: 'wedding-tropical',
    name: 'Tropical Paradise',
    category: 'wedding',
    description: 'Vibrant tropical floral design perfect for beach and garden weddings',
    colors: { primary: '#2d6a4f', secondary: '#d8f3dc', accent: '#f4845f' },
    sampleData: {
      hostNames: 'Sanduni & Ruwan',
      eventTitle: 'Beach Wedding Bliss',
      date: '2027-01-08',
      time: '15:00',
      venue: 'Palm Shore Resort, Hikkaduwa',
      message:
        'Where the sea meets the sky, and two souls become one. Please share in our joy as we tie the knot by the ocean.',
    },
  },

  // ── Birthdays (3 templates) ────────────────────────────────────────────────
  {
    id: 'birthday-festive',
    name: 'Festive Celebration',
    category: 'birthday',
    description: 'Colorful and fun birthday invitation with balloons and confetti elements',
    colors: { primary: '#6a0dad', secondary: '#fff9c4', accent: '#ff6b6b' },
    sampleData: {
      hostNames: 'The Perera Family',
      eventTitle: 'Nimal\'s 50th Birthday Bash',
      date: '2027-03-15',
      time: '18:00',
      venue: 'Grand Monarch Ballroom, Negombo',
      message:
        'Half a century of amazing! Come help us celebrate a milestone birthday with food, music, and memories.',
    },
  },
  {
    id: 'birthday-kids',
    name: 'Kids\' Party',
    category: 'birthday',
    description: 'Bright, playful design with cartoon elements perfect for children\'s parties',
    colors: { primary: '#ff6b35', secondary: '#fff3e0', accent: '#4fc3f7' },
    sampleData: {
      hostNames: 'Amma & Thatha',
      eventTitle: 'Dinuka Turns 7! 🎉',
      date: '2027-05-10',
      time: '14:00',
      venue: 'Little Stars Event Hall, Kandy',
      message:
        'Calling all superheroes and princesses! Come join Dinuka for an afternoon of games, cake, and fun!',
    },
  },
  {
    id: 'birthday-elegant',
    name: 'Elegant Soirée',
    category: 'birthday',
    description: 'Sophisticated birthday party invitation with gold foil and deep jewel tones',
    colors: { primary: '#1b1b2f', secondary: '#f8f9fa', accent: '#ffd700' },
    sampleData: {
      hostNames: 'The Fernando Family',
      eventTitle: 'Chandrika\'s 30th',
      date: '2027-06-21',
      time: '19:30',
      venue: 'Heritance Kandalama, Dambulla',
      message:
        'Thirty, flirty, and thriving. Join us for an evening of celebrations, cocktails, and dancing under the stars.',
    },
  },

  // ── Baby Showers (3 templates) ─────────────────────────────────────────────
  {
    id: 'baby-pastel',
    name: 'Pastel Dreams',
    category: 'baby_shower',
    description: 'Soft pastel watercolor design with delicate floral and baby elements',
    colors: { primary: '#b5838d', secondary: '#fce4ec', accent: '#81c784' },
    sampleData: {
      hostNames: 'Nishani & Chamara',
      eventTitle: 'Baby Shower',
      date: '2027-07-05',
      time: '11:00',
      venue: '45 Flower Road, Colombo 03',
      message:
        'A little one is on the way! Please join us to shower the parents-to-be with love, gifts, and blessings.',
    },
  },
  {
    id: 'baby-gender-reveal',
    name: 'Gender Reveal Fiesta',
    category: 'baby_shower',
    description: 'Exciting gender reveal themed invitation with pink and blue accents',
    colors: { primary: '#5c6bc0', secondary: '#fce4ec', accent: '#f06292' },
    sampleData: {
      hostNames: 'Team Pink or Team Blue?',
      eventTitle: 'Gender Reveal Party',
      date: '2027-08-22',
      time: '15:00',
      venue: 'Garden of Eden Event Center, Battaramulla',
      message:
        'What will it be? Pink or Blue? Come find out with us as we reveal the big news together!',
    },
  },
  {
    id: 'baby-woodland',
    name: 'Woodland Friends',
    category: 'baby_shower',
    description: 'Adorable forest animals themed invitation in earthy natural tones',
    colors: { primary: '#5d4037', secondary: '#efebe9', accent: '#8bc34a' },
    sampleData: {
      hostNames: 'Hiruni & Tharindu',
      eventTitle: 'Baby Shower',
      date: '2027-09-14',
      time: '10:30',
      venue: 'Spice Garden Hotel, Gampaha',
      message:
        'The forest animals are ready to welcome a new friend! Join us to celebrate the arrival of our little one.',
    },
  },

  // ── Housewarming (3 templates) ─────────────────────────────────────────────
  {
    id: 'house-modern',
    name: 'New Home Chic',
    category: 'housewarming',
    description: 'Sleek modern housewarming invitation with architectural line-art elements',
    colors: { primary: '#263238', secondary: '#eceff1', accent: '#ff7043' },
    sampleData: {
      hostNames: 'Sachini & Malith',
      eventTitle: 'Housewarming Party',
      date: '2027-10-11',
      time: '17:00',
      venue: '12/3 Sunset Avenue, Rajagiriya',
      message:
        'Our house is built with bricks and beams, but a home is built with love and dreams. Please join us to celebrate our new home!',
    },
  },
  {
    id: 'house-traditional',
    name: 'Griha Pravesha',
    category: 'housewarming',
    description: 'Traditional Sri Lankan and South Asian housewarming (Griha Pravesha) ceremony invitation',
    colors: { primary: '#8d1c00', secondary: '#fff8e1', accent: '#f9a825' },
    sampleData: {
      hostNames: 'Kumara Family',
      eventTitle: 'Griha Pravesha Ceremony',
      date: '2027-11-01',
      time: '07:00',
      venue: '78 Flower Blossom Lane, Nugegoda',
      message:
        'With the blessings of the divine, we invite you to our Griha Pravesha ceremony. Your presence and blessings are our greatest gift.',
    },
  },
  {
    id: 'house-garden',
    name: 'Garden Gathering',
    category: 'housewarming',
    description: 'Fresh and bright garden-party style housewarming invitation',
    colors: { primary: '#2e7d32', secondary: '#f1f8e9', accent: '#ff8f00' },
    sampleData: {
      hostNames: 'The Jayawardena Family',
      eventTitle: 'Our New Home! Come Visit!',
      date: '2027-12-06',
      time: '16:00',
      venue: '5 Orchid Lane, Pannipitiya',
      message:
        'After months of hard work, we are finally home! Come join us for drinks, food, and a tour of our new space.',
    },
  },

  // ── Religious & Cultural (3 templates) ────────────────────────────────────
  {
    id: 'religious-almsgiving',
    name: 'Dana / Almsgiving',
    category: 'religious_cultural',
    description: 'Serene and respectful Buddhist almsgiving ceremony invitation',
    colors: { primary: '#6d4c00', secondary: '#fff8e1', accent: '#e65100' },
    sampleData: {
      hostNames: 'Wickramasinghe Family',
      eventTitle: 'Pirith Ceremony & Almsgiving',
      date: '2027-01-15',
      time: '06:30',
      venue: '22 Temple Road, Kelaniya',
      message:
        'We humbly invite you to join us in this meritorious occasion. Your presence and blessings will bring great merit to all.',
    },
  },
  {
    id: 'religious-first-birthday',
    name: 'First Birthday (Daanem)',
    category: 'religious_cultural',
    description: 'Traditional Sri Lankan first rice-feeding (Daanem) ceremony invitation',
    colors: { primary: '#880e4f', secondary: '#fce4ec', accent: '#f9a825' },
    sampleData: {
      hostNames: 'Ranasinghe Family',
      eventTitle: 'Sena\'s First Birthday & Rice-Feeding Ceremony',
      date: '2027-03-22',
      time: '09:00',
      venue: 'Lotus Hall, 34 Main Street, Moratuwa',
      message:
        'With grateful hearts, we invite you to witness this auspicious ceremony as our little one takes their first taste of rice.',
    },
  },
  {
    id: 'religious-pooja',
    name: 'Special Pooja',
    category: 'religious_cultural',
    description: 'Elegant invitation for Hindu poojas, thevaram, and religious observances',
    colors: { primary: '#b71c1c', secondary: '#fff3e0', accent: '#f9a825' },
    sampleData: {
      hostNames: 'Nadarajah Family',
      eventTitle: 'Sathyanarayana Pooja',
      date: '2027-04-14',
      time: '10:00',
      venue: '56 Jaffna Road, Chavakachcheri',
      message:
        'We seek your blessings and presence as we conduct this sacred pooja. May the divine grace us all with health, peace, and prosperity.',
    },
  },

  // ── Corporate (3 templates) ────────────────────────────────────────────────
  {
    id: 'corporate-conference',
    name: 'Business Conference',
    category: 'corporate',
    description: 'Professional conference and seminar invitation with clean corporate design',
    colors: { primary: '#0d47a1', secondary: '#e3f2fd', accent: '#ff6f00' },
    sampleData: {
      hostNames: 'Insight Lanka Pvt Ltd',
      eventTitle: 'Annual Digital Summit 2027',
      date: '2027-05-28',
      time: '08:30',
      venue: 'BMICH, Bauddhaloka Mawatha, Colombo 07',
      message:
        'Join industry leaders and innovators for a full day of insights, networking, and inspiration. Register now to secure your seat.',
    },
  },
  {
    id: 'corporate-gala',
    name: 'Awards Gala',
    category: 'corporate',
    description: 'Black-tie corporate awards night invitation with luxurious gold accents',
    colors: { primary: '#212121', secondary: '#fafafa', accent: '#ffd700' },
    sampleData: {
      hostNames: 'Ceylon Business Awards',
      eventTitle: 'Excellence Awards Ceremony 2027',
      date: '2027-06-15',
      time: '18:30',
      venue: 'Cinnamon Grand Colombo, Ballroom',
      message:
        'An evening celebrating outstanding achievement and excellence across Sri Lanka\'s business landscape. Black tie attire requested.',
    },
  },
  {
    id: 'corporate-launch',
    name: 'Product Launch',
    category: 'corporate',
    description: 'Dynamic product launch event invitation with modern gradient design',
    colors: { primary: '#4a00e0', secondary: '#f3f4f6', accent: '#00d2ff' },
    sampleData: {
      hostNames: 'TechForward Solutions',
      eventTitle: 'Product Launch Event',
      date: '2027-07-19',
      time: '14:00',
      venue: 'Tech Hub Colombo, 60 Flower Road',
      message:
        'We\'re changing the game. Join us for an exclusive first look at the product that will redefine your industry.',
    },
  },
  {
    id: 'wedding-golden',
    name: 'Golden Journey',
    category: 'wedding',
    description: 'A cream and gold wedding invitation with falling leaves, a ceremony timeline and eight photo spaces you can fill directly in the preview.',
    colors: { primary: '#302015', secondary: '#fffaf2', accent: '#c58925' },
    sampleData: {
      hostNames: 'Nimesh & Dilhani',
      eventTitle: 'Nimesh & Dilhani Wedding',
      date: '2026-12-27',
      time: '10:30',
      venue: 'Grand Monarch, Colombo',
      message: 'From a chance meeting to a beautiful friendship, and now to a lifetime together. We are blessed to begin this new chapter of our lives and can’t wait to celebrate with you.',
      rsvpDeadline: '2026-08-10',
      weddingDetails: GOLDEN_WEDDING_DETAILS,
    },
  },
  {
    id: 'wedding-keepsake',
    name: 'Golden Keepsake',
    category: 'wedding',
    description: 'An animated gold envelope reveals an elegant cream wedding invitation, with fine paper details, local fonts and eight personal photo spaces.',
    colors: { primary: '#302015', secondary: '#fffaf2', accent: '#c58925' },
    thumbnail: '/assets/templates/golden-keepsake/cover.svg',
    sampleData: {
      hostNames: 'Nimesh & Dilhani',
      eventTitle: 'Nimesh & Dilhani Wedding',
      date: '2026-12-27',
      time: '10:30',
      venue: 'Grand Monarch, Colombo',
      message: 'From a chance meeting to a beautiful friendship, and now to a lifetime together. We are blessed to begin this new chapter of our lives and can’t wait to celebrate with you.',
      rsvpDeadline: '2026-08-10',
      weddingDetails: GOLDEN_WEDDING_DETAILS,
    },
  },
];

// ─── Mock Users ─────────────────────────────────────────────────────────────

export const HARDCODED_USERS: User[] = [
  {
    id: 'user-001',
    name: 'Demo User',
    email: 'demo@invite.test',
    provider: 'email',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

// ─── Mock Invitations ────────────────────────────────────────────────────────

export const HARDCODED_INVITATIONS: Invitation[] = [
  {
    id: 'inv-001',
    slug: 'amaya-dilan-wedding',
    title: 'Amaya & Dilan\'s Wedding',
    templateId: 'wedding-classic',
    userId: 'user-001',
    type: 'personal',
    customData: {
      hostNames: 'Amaya & Dilan',
      eventTitle: 'Wedding Celebration',
      date: '2027-02-14',
      time: '16:30',
      venue: 'Lotus Garden Hall, 42 Lighthouse Road, Galle',
      mapLink: 'https://maps.google.com/?q=Galle,Sri+Lanka',
      message:
        'After years of friendship, laughter, and unforgettable memories, we are beginning our next chapter together. Your presence would make our special day even more meaningful.',
      colors: { primary: '#6d201c', secondary: '#f5f0eb', accent: '#c9a84c' },
    },
    createdAt: '2026-09-01T10:00:00.000Z',
    status: 'published',
  },
  {
    id: 'inv-002',
    slug: 'nimal-50th-birthday',
    title: 'Nimal\'s 50th Birthday Bash',
    templateId: 'birthday-festive',
    userId: 'user-001',
    type: 'common',
    customData: {
      hostNames: 'The Perera Family',
      eventTitle: 'Nimal\'s 50th Birthday Bash',
      date: '2027-03-15',
      time: '18:00',
      venue: 'Grand Monarch Ballroom, Negombo',
      message:
        'Half a century of amazing! Come help us celebrate a milestone birthday with food, music, and memories.',
      colors: { primary: '#6a0dad', secondary: '#fff9c4', accent: '#ff6b6b' },
    },
    createdAt: '2026-09-15T14:30:00.000Z',
    status: 'published',
  },
  {
    id: 'inv-003',
    slug: 'annual-digital-summit-2027',
    title: 'Annual Digital Summit 2027',
    templateId: 'corporate-conference',
    userId: 'user-001',
    type: 'common',
    customData: {
      hostNames: 'Insight Lanka Pvt Ltd',
      eventTitle: 'Annual Digital Summit 2027',
      date: '2027-05-28',
      time: '08:30',
      venue: 'BMICH, Bauddhaloka Mawatha, Colombo 07',
      mapLink: 'https://maps.google.com/?q=BMICH+Colombo',
      message:
        'Join industry leaders and innovators for a full day of insights, networking, and inspiration. Register now to secure your seat.',
      colors: { primary: '#0d47a1', secondary: '#e3f2fd', accent: '#ff6f00' },
    },
    createdAt: '2026-10-01T09:00:00.000Z',
    status: 'draft',
  },
];

// ─── Mock Guests ─────────────────────────────────────────────────────────────
// 12 guests for inv-001 (wedding) with mixed RSVP statuses

export const HARDCODED_GUESTS: Guest[] = [
  {
    id: 'guest-001',
    invitationId: 'inv-001',
    name: 'Kumari Perera',
    phone: '+94711234567',
    email: 'kumari@example.com',
    personalToken: 'tok_kp001',
    rsvpStatus: 'attending',
    partySize: 2,
    rsvpMessage: 'So excited! We\'ll be there!',
    openedAt: '2026-09-05T08:22:00.000Z',
    respondedAt: '2026-09-05T08:30:00.000Z',
  },
  {
    id: 'guest-002',
    invitationId: 'inv-001',
    name: 'Suresh Jayawardena',
    phone: '+94722345678',
    email: 'suresh.j@example.com',
    personalToken: 'tok_sj002',
    rsvpStatus: 'attending',
    partySize: 3,
    rsvpMessage: 'Looking forward to celebrating with you!',
    openedAt: '2026-09-06T10:00:00.000Z',
    respondedAt: '2026-09-06T10:15:00.000Z',
  },
  {
    id: 'guest-003',
    invitationId: 'inv-001',
    name: 'Nirosha Fernando',
    phone: '+94733456789',
    personalToken: 'tok_nf003',
    rsvpStatus: 'attending',
    partySize: 1,
    openedAt: '2026-09-07T14:30:00.000Z',
    respondedAt: '2026-09-07T14:45:00.000Z',
  },
  {
    id: 'guest-004',
    invitationId: 'inv-001',
    name: 'Prasad Wickramasinghe',
    phone: '+94744567890',
    email: 'prasad.w@example.com',
    personalToken: 'tok_pw004',
    rsvpStatus: 'attending',
    partySize: 4,
    rsvpMessage: 'Whole family will be there!',
    openedAt: '2026-09-08T09:00:00.000Z',
    respondedAt: '2026-09-08T09:30:00.000Z',
  },
  {
    id: 'guest-005',
    invitationId: 'inv-001',
    name: 'Dilani Ranasinghe',
    phone: '+94755678901',
    personalToken: 'tok_dr005',
    rsvpStatus: 'maybe',
    rsvpMessage: 'I\'ll try my best to make it!',
    openedAt: '2026-09-09T16:00:00.000Z',
    respondedAt: '2026-09-09T16:20:00.000Z',
  },
  {
    id: 'guest-006',
    invitationId: 'inv-001',
    name: 'Thilanka Dissanayake',
    phone: '+94766789012',
    email: 'thilanka.d@example.com',
    personalToken: 'tok_td006',
    rsvpStatus: 'maybe',
    rsvpMessage: 'Have a work trip that week — fingers crossed!',
    openedAt: '2026-09-10T11:00:00.000Z',
    respondedAt: '2026-09-10T11:30:00.000Z',
  },
  {
    id: 'guest-007',
    invitationId: 'inv-001',
    name: 'Sandeepa Gunawardena',
    phone: '+94777890123',
    personalToken: 'tok_sg007',
    rsvpStatus: 'not_attending',
    rsvpMessage: 'So sorry, I\'ll be overseas. Wishing you all the best!',
    openedAt: '2026-09-11T08:00:00.000Z',
    respondedAt: '2026-09-11T08:10:00.000Z',
  },
  {
    id: 'guest-008',
    invitationId: 'inv-001',
    name: 'Rajiv Balasuriya',
    phone: '+94788901234',
    email: 'rajiv.b@example.com',
    personalToken: 'tok_rb008',
    rsvpStatus: 'not_attending',
    rsvpMessage: 'Sadly can\'t make it — health issues. Congratulations!',
    openedAt: '2026-09-12T13:00:00.000Z',
    respondedAt: '2026-09-12T13:30:00.000Z',
  },
  {
    id: 'guest-009',
    invitationId: 'inv-001',
    name: 'Chamindra Silva',
    phone: '+94799012345',
    personalToken: 'tok_cs009',
    rsvpStatus: 'pending',
    openedAt: '2026-09-13T10:00:00.000Z',
  },
  {
    id: 'guest-010',
    invitationId: 'inv-001',
    name: 'Anusha Munasinghe',
    phone: '+94711223344',
    email: 'anusha.m@example.com',
    personalToken: 'tok_am010',
    rsvpStatus: 'pending',
    openedAt: '2026-09-14T15:00:00.000Z',
  },
  {
    id: 'guest-011',
    invitationId: 'inv-001',
    name: 'Lasantha Senanayake',
    phone: '+94722334455',
    personalToken: 'tok_ls011',
    rsvpStatus: 'pending',
    // Not yet opened
  },
  {
    id: 'guest-012',
    invitationId: 'inv-001',
    name: 'Malika Karunaratne',
    phone: '+94733445566',
    email: 'malika.k@example.com',
    personalToken: 'tok_mk012',
    rsvpStatus: 'pending',
    // Not yet opened
  },
];

// ─── localStorage Keys ───────────────────────────────────────────────────────

const LS_KEYS = {
  templates: 'mock:templates:v1',
  users: 'mock:users:v1',
  invitations: 'mock:invitations:v1',
  guests: 'mock:guests:v1',
} as const;

// ─── State Shape ─────────────────────────────────────────────────────────────

interface AppState {
  templates: Template[];
  users: User[];
  invitations: Invitation[];
  guests: Guest[];
}

// ─── Load / Save ─────────────────────────────────────────────────────────────

/**
 * Loads persisted state from localStorage, falling back to hardcoded defaults.
 * Safe to call on server (returns hardcoded data if `window` is unavailable).
 */
export function loadState(): AppState {
  if (typeof window === 'undefined') {
    return {
      templates: HARDCODED_TEMPLATES,
      users: HARDCODED_USERS,
      invitations: HARDCODED_INVITATIONS,
      guests: HARDCODED_GUESTS,
    };
  }

  const parse = <T>(key: string, fallback: T[]): T[] => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T[]) : fallback;
    } catch {
      return fallback;
    }
  };

  return {
    templates: parse<Template>(LS_KEYS.templates, HARDCODED_TEMPLATES),
    users: parse<User>(LS_KEYS.users, HARDCODED_USERS),
    invitations: parse<Invitation>(LS_KEYS.invitations, HARDCODED_INVITATIONS),
    guests: parse<Guest>(LS_KEYS.guests, HARDCODED_GUESTS),
  };
}

/**
 * Saves the given state (or partial state) to localStorage.
 * Call after any mutation.
 */
export function saveState(partial: Partial<AppState>): void {
  if (typeof window === 'undefined') return;

  if (partial.templates !== undefined) {
    localStorage.setItem(LS_KEYS.templates, JSON.stringify(partial.templates));
  }
  if (partial.users !== undefined) {
    localStorage.setItem(LS_KEYS.users, JSON.stringify(partial.users));
  }
  if (partial.invitations !== undefined) {
    localStorage.setItem(LS_KEYS.invitations, JSON.stringify(partial.invitations));
  }
  if (partial.guests !== undefined) {
    localStorage.setItem(LS_KEYS.guests, JSON.stringify(partial.guests));
  }
}

// ─── Convenience Exports (live reads from localStorage) ──────────────────────

export function MOCK_TEMPLATES(): Template[] {
  return loadState().templates;
}

export function MOCK_USERS(): User[] {
  return loadState().users;
}

export function MOCK_INVITATIONS(): Invitation[] {
  return loadState().invitations;
}

export function MOCK_GUESTS(): Guest[] {
  return loadState().guests;
}

export const MOCK_TEMPLATE_CARDS: MockTemplate[] = HARDCODED_TEMPLATES.map((template, index) => ({
  ...template,
  bgColor: template.colors.secondary,
  primaryColor: template.colors.primary,
  secondaryColor: template.colors.accent,
  symbol: ['✦', '❋', '❀', '♡'][index % 4],
  isPremium: index % 6 === 5,
}));

export const MOCK_INVITATION_CARDS: MockInvitation[] = HARDCODED_INVITATIONS.map((invitation) => {
  const guests = HARDCODED_GUESTS.filter((guest) => guest.invitationId === invitation.id);
  const template = HARDCODED_TEMPLATES.find((item) => item.id === invitation.templateId);
  return {
    id: invitation.id,
    title: invitation.title,
    templateId: invitation.templateId,
    category: template?.category ?? 'wedding',
    date: invitation.customData.date,
    guestCount: guests.length,
    status: invitation.status === 'published' ? 'sent' : invitation.status,
    rsvpCount: guests.filter((guest) => guest.rsvpStatus !== 'pending').length,
    primaryColor: invitation.customData.colors.primary,
    symbol: '✦',
  };
});

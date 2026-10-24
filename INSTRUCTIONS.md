# Invitely — Developer & Customization Instructions

This document provides a complete guide to understanding the project architecture, creating new invitation templates, customizing existing templates, and extending editor options.

---

## 📑 Table of Contents

1. [Architecture & Folder Structure](#1-architecture--folder-structure)
2. [End-to-End Invitation Lifecycle](#2-end-to-end-invitation-lifecycle)
3. [How to Add a New Invitation Template](#3-how-to-add-a-new-invitation-template)
   - [Step 1: Define Template Metadata in `lib/mock-data.ts`](#step-1-define-template-metadata-in-libmock-datats)
   - [Step 2: Build the React Template Component](#step-2-build-the-react-template-component)
   - [Step 3: Register in `components/templates/registry.tsx`](#step-3-register-in-componentstemplatesregistrytsx)
   - [Step 4: Verify in Dashboard and Editor](#step-4-verify-in-dashboard-and-editor)
4. [How to Edit an Existing Template](#4-how-to-edit-an-existing-template)
5. [How to Add & Edit Options in the Editor](#5-how-to-add--edit-options-in-the-editor)
   - [Adding New Fields to `InvitationCustomData`](#adding-new-fields-to-invitationcustomdata)
   - [Adding Form Controls in `template-editor.tsx`](#adding-form-controls-in-template-editortsx)
   - [Consuming New Fields in Templates](#consuming-new-fields-in-templates)
6. [Public Invitation Views & RSVP Logic](#6-public-invitation-views--rsvp-logic)
7. [Database Persistence (SQLite)](#7-database-persistence-sqlite)
8. [Best Practices & Tips](#8-best-practices--tips)

---

## 1. Architecture & Folder Structure

Here is how the project is organized and what each directory is responsible for:

```
invitation/
├── app/                                  # Next.js 16 App Router Directory
│   ├── (auth)/                           # Auth routes (Login, Signup, Forgot Password)
│   ├── api/                              # Backend Route Handlers (REST endpoints)
│   │   ├── guests/[id]/                  # PATCH (update guest), DELETE (remove guest)
│   │   │   └── rsvp/route.ts             # POST (submit RSVP for specific guest)
│   │   ├── invitations/                  # GET (list user invites), POST (create invite)
│   │   │   ├── [id]/route.ts             # GET, PATCH, DELETE single invitation
│   │   │   ├── [id]/guests/route.ts      # GET guests, POST single/batch guests
│   │   │   └── [id]/rsvps/route.ts       # POST RSVP from common link
│   │   └── links/                        # Public link resolver endpoints
│   │       ├── common/[slug]/route.ts    # Resolves public slug to invitation
│   │       └── guest/[code]/route.ts     # Resolves short code to guest & invitation
│   ├── dashboard/page.tsx                # Netflix-style template browser & user drafts
│   ├── invitations/                      # Host invitation management views
│   │   ├── page.tsx                      # All user invitations list
│   │   └── [id]/page.tsx                 # Management cockpit (stats, guests, sharing)
│   ├── templates/[id]/page.tsx           # Template preview & live customizer page
│   ├── i/[slug]/page.tsx                 # Public common invitation route (anyone can RSVP)
│   ├── s/[code]/page.tsx                 # Public personalized guest route (prefilled guest)
│   ├── layout.tsx                        # Global root layout (fonts, navbar wrapper)
│   └── page.tsx                          # Luxury marketing landing page
│
├── components/                           # React UI Components
│   ├── dashboard/                        # TemplateCard, CategoryRow, MyInvitationsRow
│   ├── invitations/                      # Management components (Guest table, RSVP cards)
│   ├── layout/                           # AppShell, AppHeader, AuthProvider
│   ├── templates/                        # 🎨 INVITATION TEMPLATE SYSTEM
│   │   ├── types.ts                      # TemplateData, TemplateComponent interfaces
│   │   ├── registry.tsx                  # Central registry connecting IDs to Components
│   │   ├── template-editor.tsx           # Form controls + live preview split-view
│   │   ├── wedding-*.tsx                 # Wedding template components
│   │   ├── birthday-*.tsx                # Birthday template components
│   │   ├── baby-*.tsx                    # Baby shower template components
│   │   ├── house-*.tsx                   # Housewarming template components
│   │   ├── religious-*.tsx               # Religious & cultural templates
│   │   └── corporate-*.tsx               # Corporate event templates
│   └── ui/                               # Reusable primitives: button, modal, input, etc.
│
├── lib/                                  # Utilities & Data Layer
│   ├── auth.ts                           # Mock authentication, cookies, user sessions
│   ├── db/index.ts                       # SQLite database adapter (invitations & guests)
│   ├── invitations.ts                    # Client-side API functions (create, list, RSVP)
│   ├── links.ts                          # Server-side slug & short code generators
│   ├── mock-data.ts                      # Template definitions, categories & mock records
│   ├── storage.ts                        # Client-side image upload & base64 conversions
│   └── wedding-golden.ts                 # Rich multi-event wedding data structures
│
├── data/                                 # Runtime persistent storage
│   └── dev.db                            # SQLite database file
└── proxy.ts                              # Next.js 16 route proxy (replaces middleware.ts)
```

---

## 2. End-to-End Invitation Lifecycle

Understanding how data flows through the application:

```
[1. Dashboard /dashboard]
       │
       ▼  User clicks "Use this template"
[2. Template Editor /templates/[id]]
       │  Host fills form: hostNames, date, venue, colors, photo
       │  Live preview re-renders instantly with TemplateData
       │
       ▼  Host clicks "Save invitation"
[3. API POST /api/invitations]
       │  Persists customData as JSON in SQLite `invitations` table
       │  Generates a unique common slug (e.g., `wedding-amaya-dilan-4k2j`)
       │
       ▼  Redirects to
[4. Invitation Management /invitations/[id]]
       │  Host sees metrics, copies common link, or adds individual guests
       │  Adding a guest generates a personalized code (e.g., `s/x9k2p8qm`)
       │
       ▼  Guests receive link via WhatsApp / SMS
[5. Public View & RSVP]
       ├── Common Link: /i/[slug]  -> Guest inputs name & party size -> RSVPs
       └── Personal Link: /s/[code] -> Greeting personalized -> Guest confirms
```

---

## 3. How to Add a New Invitation Template

Adding a new invitation template requires **3 simple steps**:
1. Define the template metadata in `lib/mock-data.ts`.
2. Build the visual React component in `components/templates/`.
3. Register the component in `components/templates/registry.tsx`.

---

### Step 1: Define Template Metadata in `lib/mock-data.ts`

Open [`lib/mock-data.ts`](file:///home/umayanga/Documents/Project/invitation/invitation/lib/mock-data.ts) and locate `HARDCODED_TEMPLATES`.

Add a new template configuration object:

```ts
// In lib/mock-data.ts -> HARDCODED_TEMPLATES:
{
  id: 'wedding-boho-chic', // Unique lowercase slug
  name: 'Bohemian Garden',
  category: 'wedding',     // One of: wedding | birthday | baby_shower | housewarming | religious_cultural | corporate
  description: 'Earthy terracotta tones with botanical pampas grass flourishes.',
  colors: {
    primary: '#8c4a32',    // Primary text & dark accents
    secondary: '#f7ede2',  // Card background
    accent: '#d4a373',     // Highlights, dividers, gold foil
  },
  sampleData: {
    hostNames: 'Nadeesha & Kasun',
    eventTitle: 'Wedding Celebration',
    date: '2027-04-18',
    time: '15:30',
    venue: 'River Haven Retreat, Kalutara',
    message: 'We invite you to share in our joy as we exchange our vows surrounded by nature and our favorite people.',
  },
  // Optional custom thumbnail (defaults to dynamic rendering):
  // thumbnail: '/templates/boho-thumb.webp',
},
```

---

### Step 2: Build the React Template Component

Create a new file in `components/templates/`. For example:  
[`components/templates/wedding-boho-chic.tsx`](file:///home/umayanga/Documents/Project/invitation/invitation/components/templates/wedding-boho-chic.tsx)

Every template component receives `TemplateData` as its props.

#### The `TemplateData` Props Interface

```ts
export interface TemplateData {
  hostNames: string;      // e.g. "Nadeesha & Kasun"
  eventTitle: string;     // e.g. "Wedding Celebration"
  date: string;          // Human-formatted or ISO date string
  time: string;          // e.g. "15:30" or "3:30 PM"
  venue: string;         // e.g. "River Haven Retreat"
  mapLink?: string;      // Optional Google Maps URL
  message?: string;      // Host message to guests
  photo?: string;        // Optional uploaded photo URL / base64 string
  colors: {
    primary: string;     // Dominant color
    secondary: string;   // Background color
    accent: string;      // Decorative color
  };
  guestName?: string;    // Set for personal invitations: "Dear <Name>,"
  displayMode?: 'thumbnail' | 'preview' | 'public';
  rsvpContent?: React.ReactNode; // Optional embedded RSVP form
}
```

#### Template Component Boilerplate

Here is a complete template component example using CSS/SVG decorations:

```tsx
'use client';

import type { TemplateData } from './types';

export default function WeddingBohoChic(data: TemplateData) {
  const { primary, secondary, accent } = data.colors;

  return (
    <article
      className="relative flex h-full w-full min-h-[580px] flex-col items-center justify-between p-6 text-center select-none overflow-hidden"
      style={{
        backgroundColor: secondary,
        color: primary,
        fontFamily: 'Georgia, serif',
      }}
    >
      {/* Top Decorative Arch or SVG Pattern */}
      <div className="w-full max-w-[260px] opacity-80" aria-hidden="true">
        <svg viewBox="0 0 200 40" className="w-full fill-none" stroke={accent} strokeWidth="1">
          <path d="M 10,35 Q 100,5 190,35" />
          <circle cx="100" cy="18" r="4" fill={accent} />
        </svg>
      </div>

      {/* Guest Name Greeting (Personal Link Only) */}
      {data.guestName && (
        <div className="mt-2 rounded-full px-4 py-1 text-xs uppercase tracking-widest" style={{ color: accent, border: `1px solid ${accent}40` }}>
          Dear {data.guestName}
        </div>
      )}

      {/* Host Names / Couple Header */}
      <div className="my-auto py-4">
        <p className="text-[10px] uppercase tracking-[0.25em] opacity-80" style={{ color: accent }}>
          Together with their families
        </p>
        <h1
          className="my-3 text-3xl font-normal tracking-wide sm:text-4xl"
          style={{ color: primary }}
        >
          {data.hostNames}
        </h1>
        <p className="text-xs uppercase tracking-[0.2em] opacity-75">
          {data.eventTitle}
        </p>
      </div>

      {/* Optional Photo */}
      {data.photo && (
        <div className="my-3 h-32 w-32 overflow-hidden rounded-full border-2 shadow-md" style={{ borderColor: accent }}>
          <img src={data.photo} alt={data.hostNames} className="h-full w-full object-cover" />
        </div>
      )}

      {/* Invitation Message */}
      {data.message && (
        <p className="max-w-xs text-xs italic leading-relaxed opacity-90 px-2 my-2">
          &ldquo;{data.message}&rdquo;
        </p>
      )}

      {/* Date, Time & Venue Details */}
      <div className="w-full border-t pt-4 my-2" style={{ borderColor: `${accent}40` }}>
        <p className="text-sm font-semibold tracking-wider">
          {data.date} &bull; {data.time}
        </p>
        <p className="mt-1 text-xs opacity-80">{data.venue}</p>

        {data.mapLink && (
          <a
            href={data.mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-[11px] underline opacity-85 hover:opacity-100"
            style={{ color: primary }}
          >
            View Map & Directions &rarr;
          </a>
        )}
      </div>

      {/* Bottom Accent */}
      <div className="text-xs tracking-widest opacity-60" style={{ color: accent }}>
        ✦ &nbsp; ✦ &nbsp; ✦
      </div>

      {/* Public RSVP slot if rendered inline */}
      {data.rsvpContent && (
        <div className="w-full mt-6 text-left">
          {data.rsvpContent}
        </div>
      )}
    </article>
  );
}
```

---

### Step 3: Register in `components/templates/registry.tsx`

Open [`components/templates/registry.tsx`](file:///home/umayanga/Documents/Project/invitation/invitation/components/templates/registry.tsx).

1. Import your newly created component:
   ```tsx
   import WeddingBohoChic from './wedding-boho-chic';
   ```

2. Add it to the `components` map with its matching `id`:
   ```tsx
   const components: Record<string, TemplateComponent['Component']> = {
     // ... existing templates ...
     'wedding-boho-chic': WeddingBohoChic,
   };
   ```

3. If your template requires full-page scrolling layout (instead of a poster card layout):
   ```tsx
   layout: ['wedding-ivory', 'wedding-golden', 'wedding-boho-chic'].includes(template.id) ? 'page' : undefined,
   ```

---

### Step 4: Verify in Dashboard and Editor

Once registered:
1. Navigate to `/dashboard` — your new template will automatically appear in its category row.
2. Click **"Use this template"** or **"Preview"** — it opens at `/templates/wedding-boho-chic`.
3. Try typing custom host names, changing date/time, and adjusting colors — observe the live preview updating instantaneously!

---

## 4. How to Edit an Existing Template

All existing templates are located in [`components/templates/`](file:///home/umayanga/Documents/Project/invitation/invitation/components/templates/):

| Template ID | File | Category | Style Highlights |
|---|---|---|---|
| `wedding-classic` | `wedding-floral.tsx` | Wedding | Ornate gold floral dividers, classic serif |
| `wedding-modern` | `wedding-modern.tsx` | Wedding | Minimalist grid, high-contrast typography |
| `wedding-tropical` | `wedding-tropical.tsx` | Wedding | Palm fronds, emerald greens, beach vibe |
| `wedding-ivory` | `wedding-ivory.tsx` | Wedding | Luxury interactive envelope opening animation |
| `wedding-golden` | `wedding-golden.tsx` | Wedding | Multi-event schedule, parents tribute, photo gallery |
| `birthday-festive` | `birthday-confetti.tsx` | Birthday | Festive celebration with confetti graphics |
| `birthday-kids` | `birthday-fun.tsx` | Birthday | Playful colors, bouncy geometry |
| `birthday-elegant` | `birthday-elegant.tsx` | Birthday | Dark luxury night-out aesthetic |
| `baby-pastel` | `baby-pastel.tsx` | Baby Shower | Soft pastel clouds and ribbons |
| `baby-gender-reveal` | `baby-reveal.tsx` | Baby Shower | Half pink / half blue reveal split |
| `house-modern` | `house-modern.tsx` | Housewarming | Architectural blueprint lines, modern doors |
| `religious-almsgiving` | `religious-almsgiving.tsx` | Cultural | Traditional Buddhist lotus and lantern motifs |
| `corporate-conference` | `corporate-conference.tsx` | Corporate | Clean agenda banner, speaker badges |

### Common Customizations:

1. **Changing Default Colors**:
   Open [`lib/mock-data.ts`](file:///home/umayanga/Documents/Project/invitation/invitation/lib/mock-data.ts) and edit `colors: { primary, secondary, accent }` for that template.

2. **Changing Fonts or SVG Art**:
   Open the template file (e.g. `wedding-modern.tsx`) and edit the Tailwind classes, Google font variables, or embedded SVG shapes.

3. **Responsive Scaling**:
   Use `clamp()` font sizes so the template scales gracefully between 360px mobile frames and desktop viewports:
   ```css
   font-size: clamp(20px, 4vw, 36px);
   ```

---

## 5. How to Add & Edit Options in the Editor

Want to add new options (e.g., **Dress Code**, **Event Itinerary**, or **Gift Registry URL**) to the invitation builder? Here is how to wire them up:

### Adding New Fields to `InvitationCustomData`

1. Open [`lib/mock-data.ts`](file:///home/umayanga/Documents/Project/invitation/invitation/lib/mock-data.ts) and add the field to `InvitationCustomData`:

```ts
export interface InvitationCustomData {
  hostNames: string;
  eventTitle: string;
  date: string;
  time: string;
  venue: string;
  mapLink?: string;
  message: string;
  photo?: string;
  colors: TemplateColors;
  guestName?: string;
  rsvpDeadline?: string;
  maxPartySize?: number;

  // ✨ New Fields:
  dressCode?: string;     // e.g. "Formal / Traditional Sri Lankan"
  registryLink?: string;  // e.g. "https://myregistry.com/..."
}
```

2. Also add the fields to `TemplateData` in [`components/templates/types.ts`](file:///home/umayanga/Documents/Project/invitation/invitation/components/templates/types.ts):

```ts
export interface TemplateData {
  // ... existing fields ...
  dressCode?: string;
  registryLink?: string;
}
```

---

### Adding Form Controls in `template-editor.tsx`

Open [`components/templates/template-editor.tsx`](file:///home/umayanga/Documents/Project/invitation/invitation/components/templates/template-editor.tsx):

1. **Add state variables**:
   ```tsx
   const [dressCode, setDressCode] = useState(saved?.dressCode ?? '');
   const [registryLink, setRegistryLink] = useState(saved?.registryLink ?? '');
   ```

2. **Include in `customData` payload inside `saveInvitation`**:
   ```tsx
   const customData = {
     hostNames: hostNames.trim(),
     eventTitle: eventTitle.trim(),
     date,
     time,
     venue: venue.trim(),
     // ...
     dressCode: dressCode.trim() || undefined,
     registryLink: registryLink.trim() || undefined,
   };
   ```

3. **Pass into the live preview**:
   Find `<Invitation ... />` in the preview panel and pass the new props:
   ```tsx
   <Invitation
     hostNames={hostNames}
     eventTitle={eventTitle}
     date={date}
     time={time}
     venue={venue}
     dressCode={dressCode}
     registryLink={registryLink}
     // ...
   />
   ```

4. **Render inputs in the form JSX**:
   ```tsx
   <Field
     label="Dress code (optional)"
     value={dressCode}
     onChange={(val) => { setDressCode(val); setDirty(true); }}
     placeholder="e.g. Cocktail / Formal"
   />

   <Field
     label="Gift registry link (optional)"
     type="url"
     value={registryLink}
     onChange={(val) => { setRegistryLink(val); setDirty(true); }}
     placeholder="https://..."
   />
   ```

> **Note on Database Storage**: Because the SQLite database in `lib/db/index.ts` stores `customData` as a JSON string, **no SQL migration is needed**! The new fields will automatically persist upon save.

---

### Consuming New Fields in Templates

In your template component (e.g. `wedding-boho-chic.tsx`), you can now read and display `data.dressCode` and `data.registryLink`:

```tsx
{data.dressCode && (
  <p className="mt-2 text-xs uppercase tracking-widest text-[var(--iv-muted)]">
    Dress Code: <span className="font-semibold">{data.dressCode}</span>
  </p>
)}

{data.registryLink && (
  <a
    href={data.registryLink}
    target="_blank"
    rel="noopener noreferrer"
    className="mt-3 inline-block rounded-full px-4 py-1.5 text-xs font-medium border"
  >
    Gift Registry
  </a>
)}
```

---

## 6. Public Invitation Views & RSVP Logic

When guests view an invitation, they arrive at one of two routes:

### 1. Common Invitation (`app/i/[slug]/page.tsx`)
- Shared via social media, groups, or family chats.
- Renders the template in `public` mode with an RSVP form below it.
- When an unknown guest submits their RSVP, it calls `POST /api/invitations/[id]/rsvps`.
- Creates a new guest record in SQLite attached to that invitation.

### 2. Personal Guest Invitation (`app/s/[code]/page.tsx`)
- Short code unique to each recipient (e.g. `http://site.com/s/7q8m2x1k`).
- The server checks `guests.code` and immediately personalizes the view with:
  ```tsx
  <TemplateComponent guestName={guest.name} ... />
  ```
- Submitting the RSVP calls `POST /api/guests/[id]/rsvp`.
- Automatically marks `opened_at` timestamp when viewed and records `rsvp_status` (`attending`, `not_attending`, `maybe`), `party_size`, and guest notes.

---

## 7. Database Persistence (SQLite)

The local database adapter lives in [`lib/db/index.ts`](file:///home/umayanga/Documents/Project/invitation/invitation/lib/db/index.ts).

### Tables:

#### `invitations`
- `id` (TEXT, Primary Key)
- `owner_id` (TEXT)
- `template_id` (TEXT)
- `data` (TEXT JSON payload of `InvitationCustomData`)
- `type` (`'common'` | `'personal'`)
- `slug` (TEXT UNIQUE)
- `created_at` (TEXT ISO)
- `status` (`'draft'` | `'published'` | `'archived'`)

#### `guests`
- `id` (TEXT, Primary Key)
- `invitation_id` (TEXT, Foreign Key)
- `name` (TEXT)
- `phone` (TEXT)
- `email` (TEXT)
- `code` (TEXT UNIQUE short token)
- `rsvp_status` (`'pending'` | `'attending'` | `'not_attending'` | `'maybe'`)
- `party_size` (INTEGER)
- `rsvp_message` (TEXT)
- `max_party_size` (INTEGER)
- `opened_at` (TEXT ISO)
- `responded_at` (TEXT ISO)
- `revoked` (INTEGER 0 or 1)

### Resetting Test Data:
To wipe the database back to clean demo seeds during QA, hit the development endpoint:
```bash
curl -X POST http://localhost:3000/api/test/reset
```

---

## 8. Best Practices & Tips

1. **Lightweight Assets**: Prefer CSS and inline SVG geometry over heavy image files. This ensures invitations load instantly on mobile 3G/4G connections.
2. **Accessible Contrast**: Always ensure `data.colors.primary` contrasts well against `data.colors.secondary`.
3. **No Hardcoded Names or URLs**: Always rely on `data.hostNames`, `data.venue`, and `process.env.NEXT_PUBLIC_SITE_URL` so invitations are dynamically personalized.
4. **Form Unsaved Warning**: The editor automatically warns hosts if they try to navigate away with unsaved changes.
5. **Typecheck Often**: Run `npm run typecheck` or `npx tsc --noEmit` whenever updating template properties to catch missing prop definitions early.

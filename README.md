# Invitely — Digital Invitation & RSVP Platform

A modern, luxury, mobile-first invitation management platform built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

Invitely allows hosts to browse designer invitation templates across multiple event categories, personalize them with a real-time live preview editor, generate shared or guest-specific invitation links, and track RSVPs with WhatsApp sharing.

---

## 🌟 Key Features

- **🎭 Multi-Category Designer Templates**: 18+ handcrafted templates across Weddings, Birthdays, Baby Showers, Housewarming, Religious & Cultural ceremonies, and Corporate events.
- **⚡ Real-Time Live Preview Editor**: Interactive form on the left (or top on mobile) and instantaneous live preview on the right.
- **🔗 Dual Invitation Types**:
  - **Common Invitation (`/i/[slug]`)**: A single link to broadcast to friends and family; any guest can RSVP by providing their name and details.
  - **Personal Invitation (`/s/[code]`)**: Personalized, unique short link per guest with pre-filled greeting and locked guest identity.
- **📊 Host Management Dashboard**: Real-time RSVP metrics (Invited, Opened, Attending, Not Attending, Maybe), party size counting, guest list table, and CSV bulk import.
- **💬 WhatsApp Sharing**: One-click sharing with auto-composed messages including the guest's name and personalized link.
- **📱 Mobile-First & Responsive**: Designed from 360px mobile viewports up to large desktop screens, supporting light and dark themes.
- **💾 Local SQLite Database**: Out-of-the-box local data persistence using Node's native SQLite support (`data/dev.db`), easily replaceable with Supabase/PostgreSQL.
- **🛡️ Secure Route Protection**: Next.js 16 `proxy.ts` architecture protecting dashboard and management routes.

---

## 🛠 Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Framework** | Next.js 16.3+ (App Router) | React Server Components, Server Actions, Route Handlers |
| **Language** | TypeScript 5.x | Full end-to-end type safety |
| **UI Library** | React 19.x | Component-driven architecture with client islands |
| **Styling** | Tailwind CSS v4 & CSS Modules | Modern `@theme` CSS variable tokens and layout |
| **Forms & Validation** | React Hook Form & Zod | Form state management and runtime validation |
| **Database** | Node SQLite (`node:sqlite`) | Zero-config local database storage (`data/dev.db`) |
| **Testing** | Playwright | Multi-device E2E testing (Mobile, Tablet, Desktop) |
| **Phone Validation** | `libphonenumber-js` | International and Sri Lankan phone number normalization |

---

## 📁 Project Directory Structure

```
invitation/
├── app/                              # Next.js 16 App Router routes
│   ├── (auth)/                       # Authentication group layout & pages
│   │   ├── login/page.tsx            # Login with Email, Phone OTP, or Google
│   │   ├── signup/page.tsx           # Registration with validation
│   │   └── forgot-password/page.tsx  # Password recovery placeholder
│   ├── api/                          # REST API route handlers
│   │   ├── guests/                   # Guest update, RSVP submission, deletion
│   │   ├── invitations/              # Create, read, update, list invitations & guest batches
│   │   ├── links/                    # Short link resolvers for common & personal links
│   │   └── test/reset/               # Development database reset helper
│   ├── dashboard/                    # Netflix-style template browser & user invitations
│   ├── invitations/                  # Host invitation list & detailed management views
│   │   ├── page.tsx                  # List of user's invitations
│   │   └── [id]/page.tsx             # Management dashboard (RSVP stats, guest list, sharing)
│   ├── templates/                    # Template preview & creation editor
│   │   └── [id]/page.tsx             # Live customization studio
│   ├── i/[slug]/                     # Public common invitation page
│   ├── s/[code]/                     # Public personal guest invitation page
│   ├── globals.css                   # Global styles, Tailwind v4 @theme, luxury tokens
│   ├── layout.tsx                    # Root HTML layout with Google fonts & navbar wrapper
│   └── page.tsx                      # Public landing page
├── components/                       # React components
│   ├── dashboard/                    # Dashboard cards, category carousels, navbar
│   ├── invitations/                  # Management table, guest modal, share dialogs
│   ├── landing/                      # Landing page sections, hero, motion helpers
│   ├── layout/                       # App shell, navigation headers, auth gates
│   ├── templates/                    # 18+ invitation template components & registry
│   │   ├── registry.tsx              # Central template registry
│   │   ├── template-editor.tsx       # Live customization form & preview container
│   │   ├── types.ts                  # Shared TemplateData & TemplateComponent types
│   │   └── wedding-*.tsx, baby-*.tsx # Individual template designs
│   └── ui/                           # Reusable UI primitives (Button, Modal, Input, Badge)
├── data/                             # Local database storage
│   └── dev.db                        # SQLite database file (auto-created on first run)
├── lib/                              # Core business logic & server adapters
│   ├── auth.ts                       # Mock authentication state & cookie handlers
│   ├── brand.ts                      # Brand name, tagline, short link helpers
│   ├── db/index.ts                   # SQLite database adapter (invitations & guests)
│   ├── invitations.ts                # Client API methods for invitations & RSVPs
│   ├── mock-data.ts                  # Seed data, default templates, TypeScript interfaces
│   ├── storage.ts                    # Image upload utilities (base64/cloud storage)
│   └── wedding-golden.ts             # Rich multi-event wedding data definitions
├── proxy.ts                          # Next.js 16 route protection proxy (middleware)
├── tests/                            # Playwright end-to-end test suite
├── INSTRUCTIONS.md                   # 📖 In-depth developer & template creation guide
└── package.json                      # Project dependencies and npm scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20.9.0 or higher
- **npm**: v10+

### Installation & Run

1. Clone or navigate to the project directory:
   ```bash
   cd invitation
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Test Credentials (Mock Auth)

For testing and local development, mock authentication is active:

| Method | Field | Value |
|---|---|---|
| **Email Login** | Email | `demo@invite.test` |
| | Password | `Demo@1234` |
| **Phone Login** | Mobile | `+94 77 000 0000` |
| | OTP | `123456` |
| **Google** | Button | Instant login as *Demo User* |

*A small developer banner displaying these credentials appears on the `/login` page.*

---

## 🌐 Public Guest Links & Production URL

Public invitation links use the `NEXT_PUBLIC_SITE_URL` environment variable:

- **Local**: `http://localhost:3000`
- **Production**: Configure `NEXT_PUBLIC_SITE_URL=https://your-domain.com` in `.env.local`

When generating WhatsApp messages or copying links:
- Common invitations format as: `https://your-domain.com/i/<slug>`
- Personal invitations format as: `https://your-domain.com/s/<code>`

---

## 📖 Complete Developer & Customization Guide

For detailed instructions on:
1. **Adding a new invitation template**
2. **Editing existing templates**
3. **Adding new form fields or options to the editor**
4. **Customizing RSVP and guest list logic**

👉 **Read the comprehensive [`INSTRUCTIONS.md`](./INSTRUCTIONS.md) guide.**

---

## 🧪 Testing

Run the full end-to-end Playwright test suite:

```bash
# Run all tests
npx playwright test

# Run tests in UI mode
npx playwright test --ui

# Test specific device project
npx playwright test --project=mobile
```

---

## 🔌 Road to Production (Real Services)

The code is structured with dedicated adapter boundaries for effortless integration with real cloud providers:

- **Supabase Auth**: Replace mock cookie methods in [`lib/auth.ts`](./lib/auth.ts) with `@supabase/ssr`.
- **PostgreSQL / Supabase Database**: Replace SQLite statements in [`lib/db/index.ts`](./lib/db/index.ts) with Supabase database queries.
- **Supabase Storage**: Hook up [`lib/storage.ts`](./lib/storage.ts) to upload directly to an S3/Supabase storage bucket.
- **WhatsApp Cloud API / Twilio**: Connect [`lib/invitations.ts`](./lib/invitations.ts) to dispatch real WhatsApp/SMS messages.

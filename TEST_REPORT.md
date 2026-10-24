# QA Test Report

Scope in this run: phases 0–4 only. Final Playwright run: **22 passed, 14 skipped, 0 failed** across mobile (360×800), tablet (768×1024), and desktop (1280×800). Skips are project-scoped checks intentionally run once at desktop (or omitted at tablet where the test is not applicable). Browser console/page errors were checked by the test fixture.

| ID | Feature | Phase | Result | Notes | Fix |
|---|---|---:|---|---|---|
| P0-1 | Playwright install, config, reset and login helpers, seed reset | 0 | PASS | `npm i -D @playwright/test`, Chromium install; 3 viewport projects. Reset endpoint restores seed data. | Added config, helpers, and development-only reset API. |
| P1-1 | TypeScript, lint, production build | 1 | PASS | `npx tsc --noEmit` and `npm run build` pass. Lint: 0 errors, 4 warnings (three `<img>` warnings and unused `TemplateData`). | None required. |
| P1-2 | Routes, dynamic params, internal targets, client/server imports | 1 | PASS | Route list and links audited; dynamic route params are awaited. No client import of server-only, fs, or SQLite code found. `/rsvp/[token]` is a live compatibility route. | None required. |
| P2-1 | Email login/signup, validation, duplicate account, session persistence | 2 | PASS | Invalid/unknown credentials, empty fields, signup validations, duplicate email, refresh persistence tested. | Associated labels and account registration/duplicate handling fixed. |
| P2-2 | Phone OTP and Google login | 2 | PASS | Supported phone formats, wrong/empty/expired OTP, digit-only six-character input, successful OTP and Google login tested. | OTP input filtering and expiry handling added. |
| P2-3 | Protected routing, logout/back, forgot password, dev credentials | 2 | PASS | Protected redirect-return, logged-in `/login`, logout/back, forgot-password feedback and development credentials tested. | Logout now replaces history and protected client routes recheck session. |
| P2-4 | Production-only behavior of credentials banner | 2 | BLOCKED | Development UI was verified; production mode was not launched in this run. | — |
| P3-1 | Dashboard navigation, search, invitation cards, responsive layout | 3 | PASS | Tested at all configured viewports; all seeded invitation links and keyboard Enter covered; search clear and no horizontal page overflow verified. | Fixed clear-search event, responsive navbar overflow, and nested anchor markup. |
| P3-2 | Category preview and horizontal controls | 3 | MISSING | Cards expose “Use this template”; separate “Preview” action is absent. Current categories do not overflow at desktop/tablet, so desktop arrow scrolling and mobile touch swipe were not exercisable. | — |
| P4-1 | All 18 template pages and screenshot matrix | 4 | PASS | Each template opened; 36 screenshots saved under `tests/screenshots/` at 360 and 1280 px. Long multilingual host/message, optional map, invalid image file, and mobile overflow exercised. | Fixed test preview selector and disabled screenshot caret injection that caused a hydration warning. |
| P4-2 | Editor live preview, fields, colors, limits, type, save | 4 | PASS | Realtime host/title/date/time/venue, all three color controls, 500-character cap, Common/Personal, save/redirect/list appearance tested. | Corrected test locator to target the actual invitation heading. |
| P4-3 | Required editor fields and personal guest validation | 4 | PASS | Empty required fields block save with a visible message. | Added visible custom guest-name validation. |
| P4-4 | Photo URL stress case | 4 | MISSING | Editor accepts uploaded image files and has no photo-URL field; invalid file upload was tested instead. | — |

## Bugs fixed

- `components/ui/input.tsx`: inputs had no reliably associated label; generated input IDs and connected labels.
- `auth.ts`, `app/login/page.tsx`: signup accepted duplicate addresses and OTP input lacked digit/length constraints and expiry behavior; added duplicate checks, numeric six-digit filtering, and five-minute OTP expiry.
- `components/dashboard/navbar.tsx`, `proxy.ts`: search clearing did not clear results, mobile navbar overflowed, and logout/back could restore protected UI; fixed event handling/responsive nav, used history replacement, added session recheck and no-store protected responses.
- `components/dashboard/my-invitations-row.tsx`: nested links caused hydration errors; removed the invalid nested anchor and stopped silently creating a demo session.
- `components/profile/profile-page.tsx`, `components/templates/public-invitation-page.tsx`, `app/page.tsx`: localStorage-dependent initial render mismatched server HTML; synchronized browser-only state after mount.
- `components/templates/template-editor.tsx`, `components/invitations/invitation-list-page.tsx`: removed implicit demo-user creation for protected actions and added clear validation for personal guest name.
- `lib/db/index.ts`: reset helper now performs an atomic reset transaction and sets SQLite busy timeout.

## Still open

- **Medium:** Separate template “Preview” action is missing; category arrow and swipe behavior were not exercisable with current category sizes.
- **Low:** Photo URL input is absent; only file upload is supported.
- **Low:** Lint retains three raw-image performance warnings and one unused type warning.
- **Low:** Production behavior of the development-credentials banner remains unverified.

## Missing features

- Template card “Preview” action.
- Photo URL input (the current editor supports image file upload).

## How to rerun

Run `npx playwright test`. The suite starts `npm run dev` through `playwright.config.ts` and resets mock data before each spec.

## Phases 5–8 run (2026-10-19)

The complete Phase 5–8 Playwright run finished with **15 passed, 18 skipped, 0 failed** across the three configured viewports. Skips are intentional: guest journeys run on mobile, sending/import/code-stress checks run on desktop, and shared list coverage runs on mobile/desktop/tablet. Browser `console.error` and uncaught page errors were checked by the fixture on every page in the run.

| ID | Feature | Phase | Result | Notes | Fix |
|---|---|---:|---|---|---|
| P5-1 | Invitation KPIs, guest search/status filters, desktop table and mobile cards | 5 | PASS | All seven counts matched seed data; attending headcount was 10. Search, all five status options, combined filtering, and visible responsive fields/actions passed. | — |
| P5-2 | Edit/delete guests and invitation edit/duplicate/delete/publish/unpublish | 5 | PASS | Guest validation and phone normalization passed; confirmed deletion updated counts. Invitation edit, copy, publish state and delete confirmation passed. | — |
| P5-3 | Unknown invitation ID | 5 | PASS | Friendly not-found page rendered without a stuck loader or console error. | Server route checks existence before rendering management UI. |
| P6-1 | Single guest entry, paste parsing and CSV validation/import | 6 | PASS | Validations, normalized phone, optional email, duplicates, invalid rows, mixed tabs/commas, whitespace, blank lines, Sinhala/Tamil, 200-row paste/CSV, quoted comma, missing columns, empty file and wrong extension tested. | Paste parser now normalizes tab-delimited rows; CSV validates file type; keyed tab panels prevent React controlled/uncontrolled console warnings. |
| P6-2 | Personal code uniqueness and link length | 6 | PASS | 500 generated guests had unique eight-character random-alphabet codes; personal URLs stayed under 40 characters. | — |
| P7-1 | WhatsApp URL, copy link, revoke, queue/reminder and email placeholder | 7 | PASS | Asserted URL without opening WhatsApp; clipboard/toast exact; revoked URL not-found and badge; queue skips revoked guest and ends; reminders select pending only; email is disabled. | Queue spec explicitly resets seed data after the bulk-code stress test. |
| P7-2 | Draft sharing controls | 7 | PASS | Draft sharing was disabled; publishing enabled it. | — |
| P7-3 | Restore revoked guest link | 7 | MISSING | No host restore control/API was found; revocation can be applied but not reversed in the UI. | — |
| P8-1 | Common guest link and RSVP | 8 | PASS | Fresh mobile browser context had no cookies; validation, submit, host tracker, OG title and no console errors verified. | — |
| P8-2 | Personal guest link, first open and answer changes | 8 | PASS | Name is locked, first open recorded once, answer/message/date saved, reopen and change answer passed. | — |
| P8-3 | Invalid links, RSVP deadline and max party size | 8 | PASS | Revoked, unknown, malformed and 400-character codes showed friendly not-found; deadline and party-size limits enforced. | — |
| P8-4 | RSVP throttling | 8 | PASS | 30 rapid submissions produced a clear 429 response. | — |
| P8-5 | Public link in a second unauthenticated profile | 8 | PASS | Common and personal guest flows used fresh contexts with no host cookies/session. | — |
| PV-1 | TypeScript, lint and production build spot check | — | FAIL | `npx tsc --noEmit` passed; `npm run lint` had 0 errors and 4 existing warnings. `npm run build` twice exited during webpack compile with only “Build failed because of webpack errors”; no diagnostic was emitted. This check is outside the requested phases 5–8. | Needs follow-up diagnosis. |

### Additional bugs fixed

- `app/invitations/[id]/page.tsx`: unknown IDs rendered an indefinitely loading client page after the guests API returned 404; the server now renders a friendly not-found state first.
- `components/invitations/invitation-management.tsx`: mixed comma/tab paste rows could be misparsed, non-CSV files were accepted despite the chooser hint, and switching add-guest tabs reused controlled input state; normalize rows, validate CSV types, and key each tab panel.
- `tests/e2e/phase-5-invitation-management.spec.ts`: responsive tests selected hidden duplicate desktop content on mobile and assumed the empty state was inside the desktop table; scope assertions to visible responsive markup.

### Open items after phases 5–8

- **High:** Production build currently fails at webpack compile without diagnostics; investigate before release.
- **Medium:** Host cannot restore a revoked personal link (missing UI/API support).
- **Low:** Existing lint warnings remain: three raw `<img>` elements and one unused `TemplateData` type.

### Missing features found in phases 5–8

- Restore a revoked guest link from invitation management.

Rerun these tests with `npx playwright test tests/e2e/phase-5-invitation-management.spec.ts tests/e2e/phase-6-adding-guests.spec.ts tests/e2e/phase-7-sending.spec.ts tests/e2e/phase-8-guest-experience.spec.ts --workers=1`.

## Phases 9–11 run (2026-10-19)

Phases 9–10 were run sequentially with Playwright on the configured viewports. Final combined run: **11 passed, 10 intentionally skipped, 0 failed**. Phase 9: 3 passed (desktop-only security checks). Phase 10: 7 passed, 2 skipped; layout/screenshot and axe checks ran on mobile, tablet, and desktop, while the keyboard flow ran once on desktop. Phase 11 report-integrity ran once on desktop and passed. An initial report-integrity run happened before this section was appended and failed on its missing phase rows; after appending the report and restricting the check to desktop, it passed.

| ID | Feature | Phase | Result | Notes |
|---|---|---:|---|---|
| P9-1 | Owner access control for invitation page and APIs | 9 | PASS | User B received 404 for user A's page and GET/PATCH/DELETE APIs; anonymous requests received 401; owner data remained unchanged. |
| P9-2 | Public data exposure and random code guessing | 9 | PASS | Public personal-link payload contains only guest/invitation fields needed for the guest; 200 random codes all returned 404. |
| P9-3 | Injection, input validation, and session cookie | 9 | PASS | XSS rendered as text; 10,000-character guest/editor/RSVP inputs and malformed batch returned JSON 400. The mock `auth_user` cookie is JS-readable, SameSite=Lax, and not HttpOnly; production Secure behavior is not configured. |
| P9-4 | Secrets, environment ignore rules, built client bundle | 9 | BLOCKED | `.gitignore` ignores `.env*` except `.env.example`. Production build fails before producing `.next/static`, so built-client secret scan could not run; source includes documented demo credentials. |
| P10-1 | Eight primary pages at 360/768/1280px and overflow | 10 | PASS | Eight main pages plus login screenshots saved for all three viewports. No horizontal page overflow detected. |
| P10-2 | Axe checks and input/button/tap-target scan | 10 | PASS | Axe found zero critical/serious violations on login, home, dashboard, and public invitation at all three viewports. Control metrics are attached to the Playwright results; small targets are still present and need manual review. |
| P10-3 | Keyboard login and add-guest modal | 10 | PASS | Desktop keyboard-only login, visible focus, password visibility control, modal focus containment, and Escape close passed. |
| P11-1 | Final report contents and rerun instructions | 11 | PASS | Report contains phase result rows, bugs fixed, still-open and missing-feature lists, and the `npx playwright test` command. |
| P11-2 | Static checks | 11 | FAIL | `npx tsc --noEmit` passed. `npm run lint` exited 0 with 4 warnings (three raw `<img>` performance warnings and one unused type). `npm run build` still fails during webpack compile without a diagnostic. |

### Bugs fixed in phases 9–10

- `app/invitations/[id]/page.tsx`: management page checked invitation existence but not ownership before rendering its client shell; added a server-side owner check.
- `app/i/[slug]/page.tsx`, `app/s/[code]/page.tsx`, public link API routes, and `components/invitations/public-invitation-page.tsx`: public responses included unnecessary private guest fields; project only guest-facing invitation and guest data.
- `lib/api-validation.ts` and invitation/guest/RSVP API routes: mutation routes accepted malformed and oversized values; added type, allowed-field, and length validation with JSON errors.
- `components/invitations/invitation-management.tsx`: guest modal did not contain keyboard focus or close on Escape; use native dialog behavior and restore focus.
- Landing, dashboard, login, input, modal and template badge styles: axe detected low-contrast text; adjusted affected foreground colors. Password visibility control is now keyboard reachable.

## Still open

- **High:** Production build fails during webpack compilation without a diagnostic; client bundle secret scan and production-mode checks remain blocked.
- **High:** Mock session cookie is readable from JavaScript and lacks HttpOnly/Secure flags; replace mock auth with server-managed production authentication before deployment.
- **Medium:** Host cannot restore a revoked guest link (missing UI/API support).
- **Medium:** Small tap targets remain in the responsive control metrics; review the attached `control-metrics.json` before release.
- **Low:** Four lint warnings remain: three raw `<img>` warnings and one unused `TemplateData` type.
- **Low:** Production behavior of the development-credentials banner remains unverified.

## Missing features

- Restore a revoked guest link from invitation management.
- Template card “Preview” action and photo URL input (reported in earlier phases).

## How to rerun

Run `npx playwright test`. The suite starts the Next.js dev server through `playwright.config.ts` and resets mock data before each spec. Phases 9–11 can be rerun with `npx playwright test tests/e2e/phase-9-security.spec.ts tests/e2e/phase-10-responsive-accessibility.spec.ts tests/e2e/phase-11-report.spec.ts --workers=1`.

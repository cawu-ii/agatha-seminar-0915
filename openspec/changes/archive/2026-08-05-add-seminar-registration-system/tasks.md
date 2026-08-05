## 1. Project scaffold

- [x] 1.1 Create Next.js (App Router, TypeScript) project in `seminar_apply/`
- [x] 1.2 Add Prisma with `postgresql` provider; define `Registration` model (UTM fields, event_id, idempotency_key, status/timestamp columns, reviewed flag)
- [x] 1.3 Start local Postgres via Docker for dev; run initial `prisma migrate dev` — **deviation**: Docker Desktop's engine would not come up in this environment, so local/staging uses sqlite instead (schema provider + `sessions`/`consult` fields adjusted accordingly). See README "Known deviations". `docker-compose.yml` still ships for whoever has a working Docker. Postgres/Supabase swap is a documented pre-8/10 step.
- [x] 1.4 Write `.env.example` covering `DATABASE_URL`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA4_ID`, `META_CAPI_TOKEN`, `EMAIL_PROVIDER`, `RESEND_API_KEY`, `RAGIC_API_TOKEN`, `ADMIN_PASSWORD`, `SESSION_SECRET` (plus `EXPORT_TOKEN`, `META_PIXEL_ID`, `RAGIC_BASE_URL` added during implementation)

## 2. Landing page (landing-page capability)

- [x] 2.1 Port `agatha-seminar-landing-0803.html` sections (hero, facts, agenda, speakers, partners, register form) into `app/seminar/0915/page.tsx`, preserving copy/design/images
- [x] 2.2 Capture `utm_source/medium/campaign/content` from query string on load; attach to form submission
- [x] 2.3 Build `ConsentBanner` component gating GTM script injection
- [x] 2.4 Wire `lib/gtm.ts` dataLayer helper; fire `lp_view` on load (post-consent) and `cta_click` on CTA click
- [x] 2.5 Replace existing client-only success toggle with `fetch('/api/register')` + redirect to `/seminar/0915/thanks?eid=...` on success

## 3. Registration API (registration-api capability)

- [x] 3.1 Define zod schema for all required form fields + UTM
- [x] 3.2 Implement `POST /api/register`: validate → generate `event_id` → insert via Prisma (unique constraint on `idempotency_key`) → respond 200 `{event_id}`
- [x] 3.3 Fire-and-forget `sendConfirmationEmail()` and `sendMetaCAPI()` after insert commits, via Next.js `after()` so they still complete on serverless platforms; wrap in try/catch that only logs and updates status columns
- [x] 3.4 Verify response body contains no PII beyond `event_id`

## 4. Thank-you page (thank-you-page capability)

- [x] 4.1 Build `app/seminar/0915/thanks/page.tsx` with approved §8.2 copy
- [x] 4.2 Read `event_id` + UTM from query params only (no PII in URL)
- [x] 4.3 Push `registration_submit` dataLayer event on mount
- [x] 4.4 Add "加入行事曆" (Google Calendar link + .ics download, no third-party account) and "返回活動頁" link

## 5. Tracking integration (tracking-integration capability)

- [x] 5.1 GTM script injection driven by `NEXT_PUBLIC_GTM_ID`; no-render when unset
- [x] 5.2 `lib/integrations/meta-capi.ts`: no-op + log when `META_CAPI_TOKEN` unset; real call (same `event_id`) when set
- [x] 5.3 Confirm all three dataLayer events carry no name/email/phone params

## 6. Transactional email (transactional-email capability)

- [x] 6.1 `lib/integrations/email.ts`: provider switch via `EMAIL_PROVIDER` (`resend` default, `none` = log-only)
- [x] 6.2 Record `email_status`/`email_sent_at` on the registration row
- [x] 6.3 Per-row resend capability (used by both API-level retry and admin console button)

## 7. Admin console (admin-console capability)

- [x] 7.1 `middleware.ts` + `/admin/login`: shared-password cookie session (`ADMIN_PASSWORD`, `SESSION_SECRET`)
- [x] 7.2 `/admin` list view: search + filter by utm_source, utm_content, dept, industry, reviewed status
- [x] 7.3 Mark-reviewed action (with optional note) per row
- [x] 7.4 Resend-confirmation-email action per row
- [x] 7.5 Confirm no delete control and no bulk-export control exist anywhere in `/admin`

## 8. Data export (data-export capability)

- [x] 8.1 `lib/integrations/ragic.ts`: no-op + log stub, gated on `RAGIC_API_TOKEN`, not called from registration/admin request paths
- [x] 8.2 CTO-only export script/route (separate auth from `/admin`) producing full CSV for Lindy/Ragic handoff

## 9. README (living document, update per phase)

- [x] 9.1 Initial README: what this is, doc version referenced, how to run locally
- [x] 9.2 Update after phase 3-4: `.env.example` var-by-var explanation, who provides each (map to handoff doc §0/§11)
- [x] 9.3 Update after phase 7: `/admin` login instructions, V1 permission scope
- [x] 9.4 Final update: open items list, §12 test-table mapping (tested today vs blocked-on-credentials), §10 timeline reference

## 10. Verification

- [x] 10.1 `npm run build` passes
- [x] 10.2 Browser walkthrough: submit with UTM params → DB row → thanks page → dataLayer events
- [x] 10.3 Admin walkthrough: login, filter, mark reviewed, resend email; confirm no delete/bulk-export controls
- [x] 10.4 Consent banner blocks GTM until accepted; confirmed via DOM/dataLayer inspection
- [x] 10.5 Map results against handoff doc §12 test table; blocked items marked explicitly in README

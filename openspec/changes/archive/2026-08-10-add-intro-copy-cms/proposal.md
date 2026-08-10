## Why

Two paragraphs on the landing page — the "當 Agentic AI 進入應用爆發期..." intro lead and the "Who should attend" callout box — are hardcoded in `app/seminar/0915/page.tsx`. PR (Lindy) asked for a way to edit this copy from `/admin` without engineering involvement, the same reason every other piece of landing-page copy (agenda, speakers, partners, highlights, banner, event facts, form options) has already been moved into a CMS.

## What Changes

- New `/admin/intro-copy` screen where a CTO or PR session can edit two fixed text blocks:
  - the intro lead paragraph
  - the "Who should attend" callout (eyebrow label + body paragraph)
- Landing page reads both blocks from the database instead of rendering hardcoded JSX text, following the same fail-safe-to-fallback pattern as `event-info-cms` (DB query error or missing row never crashes the page).
- No add/delete - exactly these two fixed blocks, same "fixed set of keyed records" pattern as `event-info-cms`, not a general free-form content builder.

## Capabilities

### New Capabilities
- `intro-copy-cms`: CTO/PR-editable admin screen and landing-page rendering for the intro lead paragraph and "Who should attend" callout, backed by a fixed set of keyed DB records (no add/delete).

### Modified Capabilities
(none — `landing-page`'s "preserving the approved copy, layout, and visual design" requirement is unaffected in spirit, same as every prior CMS capability that moved static copy into the database without a delta against that spec)

## Impact

- `prisma/schema.prisma`: new model for the two copy blocks (mirrors `EventInfo`'s keyed-record shape).
- New migration.
- New `app/api/admin/intro-copy/route.ts` (GET list, PATCH by key) - session-gated (CTO or PR), same as every other content-CMS endpoint.
- New `app/admin/intro-copy/page.tsx` + form component.
- `app/seminar/0915/page.tsx`: replace the two hardcoded blocks with DB-driven ones.
- `app/admin/page.tsx`: add a nav link to the new screen.
- Seed script (`prisma/seed-intro-copy.ts`) seeding today's existing copy as the initial DB rows, so the landing page renders unchanged immediately after this change deploys.

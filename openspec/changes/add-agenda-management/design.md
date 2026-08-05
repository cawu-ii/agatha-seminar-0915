## Context

See proposal.md - Why, and the v3 comparison table. Current state: `app/seminar/0915/page.tsx` (server component) renders 8 hardcoded `.ag__row` blocks for the agenda; `/admin` already exists (Phase 7 of the original build) with a single-shared-password session (`middleware.ts` protects `/admin/*` and `/api/admin/*`); Prisma + SQLite is the approved, in-place data layer (see `openspec/specs/registration-api` and the main README's "資料庫架構" section).

## Goals / Non-Goals

**Goals:**
- PR can add/edit/delete/reorder agenda items from `/admin` without an engineer touching code or redeploying.
- The public landing page reflects agenda changes on next page load (no separate "publish" step, no caching layer to invalidate).
- Existing agenda visual design (time/title/speaker columns, break-row styling) is preserved exactly - only the data source changes.
- Launching this doesn't blank out the agenda section: the current 8 rows ship as seed data.

**Non-Goals (deferred, see proposal.md's comparison table items 2/5/6/7/8):**
- Other CMS-editable blocks from v3 §6.2 (Banner, speakers, partners, highlights, event info, form fields) - agenda is the first slice; if PR needs those too, they're separate change proposals, not bolted onto this one.
- Individual PR accounts / per-person permissions (v3 §6.9) - still V1 single shared password, matching the existing `admin-console` capability's explicit V1 scope. Agenda CRUD is exposed to the same session as registration viewing.
- Excel (.xlsx) export format change - out of scope, `data-export` capability unchanged.
- Rich text/formatting in agenda titles - plain text fields only, matching the current design's plain text agenda rows.

## Decisions

- **New `AgendaItem` Prisma model, not a JSON blob on an existing table**: agenda items are a distinct, orderable, CRUD-able entity (add row, delete row, reorder), which maps cleanly to a table with a sort column. A JSON blob would need the same validation/ordering logic hand-rolled in application code for no benefit.
  ```
  model AgendaItem {
    id          String   @id @default(uuid())
    timeLabel   String   // display string, e.g. "13:30–13:35" - matches existing design (not start/end DateTime; the source doc's rows aren't all fixed-duration, and "13:30–13:35" as free text is simplest to match existing visual output exactly)
    title       String
    speaker     String?  // null/empty for break rows (matches "—" shown today for breaks)
    isBreak     Boolean  @default(false)  // drives .ag__row--break styling
    sortOrder   Int      // explicit ordering column, not createdAt - lets PR reorder without touching timeLabel
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
  }
  ```
  `timeLabel` as free text (not structured start/end time) is a deliberate simplification: the source design already treats time as a display string ("13:30–13:35"), there's no requirement to compute durations or sort by time programmatically (sortOrder handles ordering), and free text avoids forcing PR through a time-picker UI for what's fundamentally a label.
- **Reordering via explicit `sortOrder` integer, adjusted with up/down actions, not drag-and-drop**: drag-and-drop reordering is a meaningfully bigger frontend build (pointer events, optimistic reorder, library or hand-rolled DnD) for a list that's realistically 8-12 rows and changes infrequently. Up/down buttons that swap `sortOrder` with the adjacent row are a few lines of code and fully sufficient for this list size.
- **Landing page queries Prisma directly, no public API**: `app/seminar/0915/page.tsx` is already a server component; it can `await prisma.agendaItem.findMany({ orderBy: { sortOrder: "asc" } })` directly at request time, same pattern the admin pages already use for registrations. No new public-facing API surface, no caching/revalidation to design around - each request just reads current state.
- **Admin agenda CRUD reuses the existing `/admin` session, not a separate permission tier**: v3's "individual accounts" ask (item 7 in the comparison) is explicitly deferred; until that lands, agenda management sits behind the same shared password as registration viewing. This matches the handoff doc's framing of agenda editing as routine PR/CTO operational work, unlike registration data which has the stricter no-delete/no-bulk-export constraints.
- **Seed script for the existing 8 rows, run once**: a `prisma/seed-agenda.ts` (or inline in a migration) that inserts the current agenda content with sequential `sortOrder`, run manually once when the schema lands - not an automatic migration hook, so it can't accidentally re-seed/duplicate rows on a second deploy.

## Risks / Trade-offs

- [Free-text `timeLabel` means no validation that times are chronological or non-overlapping] → acceptable: PR already controls ordering via `sortOrder` independent of the label text; a mismatched label is a content mistake, not a system failure, and is trivially fixable by editing the row.
- [Single shared admin session means any `/admin` login can also edit agenda, not just "PR who should manage content"] → same exposure the admin console already has for registration viewing; no new risk introduced. Revisit together with the deferred individual-accounts work (comparison item 7), not as part of this change.
- [No audit trail on agenda edits (who changed what, when)] → acceptable for V1 given the small edit surface and low stakes (public marketing copy, not registrant PII); `updatedAt` alone is enough to see "something changed recently." Add an edit log later only if this becomes an actual point of confusion.

## Migration Plan

1. Add `AgendaItem` model to `prisma/schema.prisma`, run `npx prisma migrate dev` to generate the migration.
2. Run the seed script once to populate the current 8 agenda rows so the landing page never renders empty.
3. Ship the admin CRUD routes and `app/seminar/0915/page.tsx`'s switch from hardcoded JSX to a DB query in the same deploy (no partial-rollout concern - it's an additive, self-contained feature).
4. No rollback complexity: if something's wrong, the admin UI lets PR/CTO fix the data directly; reverting the code change alone would blank the agenda section back to the pre-change hardcoded content since that JSX isn't deleted until this ships, only superseded.

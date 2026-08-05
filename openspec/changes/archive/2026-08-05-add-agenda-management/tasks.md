## 1. Data model

- [x] 1.1 Add `AgendaItem` model to `prisma/schema.prisma` (`timeLabel`, `title`, `speaker?`, `isBreak`, `sortOrder`, `createdAt`, `updatedAt`)
- [x] 1.2 Run `npx prisma migrate dev` to generate the migration
- [x] 1.3 Write `prisma/seed-agenda.ts` seeding the current 8 agenda rows (from `app/seminar/0915/page.tsx`) with sequential `sortOrder`; run once manually, not on every deploy

## 2. Admin API

- [x] 2.1 `app/api/admin/agenda/route.ts`: GET (list, ordered by `sortOrder`), POST (create)
- [x] 2.2 `app/api/admin/agenda/[id]/route.ts`: PATCH (edit fields), DELETE
- [x] 2.3 `app/api/admin/agenda/[id]/move/route.ts` (or equivalent): swap `sortOrder` with the adjacent item for up/down reordering
- [x] 2.4 Confirm `middleware.ts`'s existing `/api/admin/:path*` matcher covers these new routes (should require no middleware change) — confirmed, no change needed

## 3. Admin UI

- [x] 3.1 New admin screen (e.g. `app/admin/agenda/page.tsx`) listing agenda items in order, with add/edit/delete/move-up/move-down controls
- [x] 3.2 Link to it from the main `/admin` page
- [x] 3.3 Form validation matching the spec: `timeLabel` and `title` required; `speaker` optional (expected empty for break rows)

## 4. Landing page

- [x] 4.1 Replace the hardcoded agenda `.ag__row` blocks in `app/seminar/0915/page.tsx` with a Prisma query (`agendaItem.findMany({ orderBy: { sortOrder: "asc" } })`), rendered into the existing markup/CSS classes unchanged
- [x] 4.2 Handle the zero-items case without erroring (`.catch(() => [])`, empty array renders no rows, no crash)
- [x] 4.3 (found during implementation, not in original plan) Force dynamic rendering: `npm run build` initially marked `/seminar/0915` as **static** (`○`), meaning Next.js would have baked the agenda into the build output and never re-queried the DB in production — silently violating the "reflects on next load" requirement despite working fine in `next dev` (which always re-renders regardless of static/dynamic classification). Added `export const dynamic = "force-dynamic"`; rebuild confirmed the route flipped to `ƒ` (Dynamic).

## 5. Verification

- [x] 5.1 `npm run build` passes (clean rebuild from scratch, confirmed `/seminar/0915` is `ƒ` Dynamic after the fix above)
- [x] 5.2 Seed data renders identically to the current hardcoded agenda (visual parity check) — verified via browser: 8 rows, 2 correctly marked `.ag__row--break`, first row content byte-for-byte matches the original hardcoded copy
- [x] 5.3 Create/edit/delete/reorder each verified end-to-end (admin UI change → landing page reflects it on reload) — created a test item, confirmed it appeared on `/seminar/0915` immediately (proves the dynamic-rendering fix works, not just that the API works); moved it up one position and confirmed the swap; PATCHed only the `speaker` field and confirmed `title` was untouched; deleted it and confirmed the count returned to 8. Also drove the actual admin UI via a real click (not just fetch) to confirm the inline edit form opens/closes correctly.
- [x] 5.4 Confirm agenda admin routes reject requests without a valid admin session (same as existing `/admin` protection) — `curl` without a session cookie against GET/POST both returned 307 to `/admin/login`, matching existing admin route behavior
- [x] 5.5 Update `README.md` (`/admin` 操作說明, 專案結構) and `devlog.md` once implemented

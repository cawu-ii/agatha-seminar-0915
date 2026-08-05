## 1. Data model

- [ ] 1.1 Add `AgendaItem` model to `prisma/schema.prisma` (`timeLabel`, `title`, `speaker?`, `isBreak`, `sortOrder`, `createdAt`, `updatedAt`)
- [ ] 1.2 Run `npx prisma migrate dev` to generate the migration
- [ ] 1.3 Write `prisma/seed-agenda.ts` seeding the current 8 agenda rows (from `app/seminar/0915/page.tsx`) with sequential `sortOrder`; run once manually, not on every deploy

## 2. Admin API

- [ ] 2.1 `app/api/admin/agenda/route.ts`: GET (list, ordered by `sortOrder`), POST (create)
- [ ] 2.2 `app/api/admin/agenda/[id]/route.ts`: PATCH (edit fields), DELETE
- [ ] 2.3 `app/api/admin/agenda/[id]/move/route.ts` (or equivalent): swap `sortOrder` with the adjacent item for up/down reordering
- [ ] 2.4 Confirm `middleware.ts`'s existing `/api/admin/:path*` matcher covers these new routes (should require no middleware change)

## 3. Admin UI

- [ ] 3.1 New admin screen (e.g. `app/admin/agenda/page.tsx`) listing agenda items in order, with add/edit/delete/move-up/move-down controls
- [ ] 3.2 Link to it from the main `/admin` page
- [ ] 3.3 Form validation matching the spec: `timeLabel` and `title` required; `speaker` optional (expected empty for break rows)

## 4. Landing page

- [ ] 4.1 Replace the hardcoded agenda `.ag__row` blocks in `app/seminar/0915/page.tsx` with a Prisma query (`agendaItem.findMany({ orderBy: { sortOrder: "asc" } })`), rendered into the existing markup/CSS classes unchanged
- [ ] 4.2 Handle the zero-items case without erroring

## 5. Verification

- [ ] 5.1 `npm run build` passes
- [ ] 5.2 Seed data renders identically to the current hardcoded agenda (visual parity check)
- [ ] 5.3 Create/edit/delete/reorder each verified end-to-end (admin UI change → landing page reflects it on reload)
- [ ] 5.4 Confirm agenda admin routes reject requests without a valid admin session (same as existing `/admin` protection)
- [ ] 5.5 Update `README.md` (`/admin` 操作說明, 專案結構) and `devlog.md` once implemented

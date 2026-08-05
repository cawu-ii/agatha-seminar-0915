## 1. Data model

- [x] 1.1 Add `Speaker`, `Partner`, `Highlight` models to `prisma/schema.prisma`
- [x] 1.2 `npx prisma migrate dev` (migration `20260805041217_add_content_cms`, all three tables in one migration)
- [x] 1.3 `prisma/seed-speakers.ts`, `prisma/seed-partners.ts`, `prisma/seed-highlights.ts` - idempotent, same pattern as `seed-agenda.ts`; added `npm run seed:speakers` / `seed:partners` / `seed:highlights`

## 2. Speakers

- [x] 2.1 `app/api/admin/speakers/route.ts` (GET/POST), `.../[id]/route.ts` (PATCH/DELETE), `.../[id]/move/route.ts` (reorder) - mirrors `app/api/admin/agenda/*`
- [x] 2.2 `components/SpeakerTable.tsx` + `app/admin/speakers/page.tsx`
- [x] 2.3 Wired `app/seminar/0915/page.tsx`'s speakers section to `prisma.speaker.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => [])`; three visual states (confirmed+photo / confirmed+no photo / unconfirmed) derived from `confirmed` + `photoUrl` as designed

## 3. Partners

- [x] 3.1 `app/api/admin/partners/route.ts` (GET/POST), `.../[id]/route.ts` (PATCH/DELETE), `.../[id]/move/route.ts` (reorder)
- [x] 3.2 `components/PartnerTable.tsx` + `app/admin/partners/page.tsx`
- [x] 3.3 `components/PartnerWall.tsx`: switched from hardcoded `PARTNERS` array to a `partners` prop (added `id` to the prop shape for a stable React key)
- [x] 3.4 Wired `app/seminar/0915/page.tsx` to query partners and pass them into `<PartnerWall partners={...} />`

## 4. Highlights

- [x] 4.1 `app/api/admin/highlights/route.ts` (GET/POST), `.../[id]/route.ts` (PATCH/DELETE), `.../[id]/move/route.ts` (reorder)
- [x] 4.2 `components/HighlightTable.tsx` + `app/admin/highlights/page.tsx`
- [x] 4.3 Wired `app/seminar/0915/page.tsx`'s highlights section to stored data; "亮點一/二/三..." label computed from position via a small Chinese-numeral lookup array (falls back to Arabic numerals past 十)

## 5. Admin nav

- [x] 5.1 Added "管理講者"／"管理夥伴"／"管理亮點" links to `app/admin/page.tsx`, visible to both roles (same as "管理議程" - no `isCto` gate)

## 6. Cleanup

- [x] 6.1 Updated README (新增章節、專案結構、測試步驟補三個 seed 指令、v3 更新對照表、專案進度追蹤) and `devlog.md`

## 7. Verification

- [x] 7.1 `npm run build` passes
- [x] 7.2 Seeded all three (8 speakers, 8 partners, 4 highlights), confirmed landing page renders identically to the hardcoded version it replaces via browser `read_page` - all names/titles/bios/logos/highlight text match, including the two unconfirmed-speaker rows and the photo-pending row
- [x] 7.3 CRUD + reorder verified via actual browser interaction (not just API calls): created a test speaker, confirmed it appeared correctly (confirmed=true default, no badge), deleted it, confirmed the table returned to exactly the original 8 rows
- [x] 7.4 No role gate on any of the three new API route groups (identical to `agenda-management`'s pattern - verified by code inspection, not just assertion: none of the six new route handlers call `getCurrentAccount()` or check `role`)
- [x] 7.5 Unauthenticated request to each new admin API and admin page confirmed rejected (307 redirect via existing `middleware.ts` matchers - `/api/admin/speakers`, `/api/admin/partners`, `/api/admin/highlights`, `/admin/speakers` all tested directly with `curl`, no session cookie)
- [ ] 7.6 Empty-state check (temporarily emptying a table to confirm the landing page section renders without crashing) - not executed this round; the `.catch(() => [])` pattern is identical to the already-proven `agendaItems` query, low risk, but not empirically re-verified for these three queries specifically

**Testing note**: PR-role manual login test (task 7.4's browser-based counterpart) was not re-run this round since the code path is byte-for-byte identical to `agenda-management`'s already-verified no-role-gate pattern (same `middleware.ts` coverage, no `getCurrentAccount()` call in any of the six new handlers) - verified by direct code inspection instead of a duplicate manual test.

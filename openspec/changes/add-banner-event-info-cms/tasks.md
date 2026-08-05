**None of the tasks below have been started. This change is spec-only for now (proposal.md/design.md/specs/ are complete) — implementation was explicitly deferred. Resolve design.md's Open Questions (especially #1 and #3) before starting section 3.**

## 1. Data model

- [ ] 1.1 Add `EventInfoField` enum and `EventInfo` model to `prisma/schema.prisma`
- [ ] 1.2 Add `Banner` model (singleton pattern, `id` defaults to a fixed literal)
- [ ] 1.3 `npx prisma migrate dev`
- [ ] 1.4 `prisma/seed-event-info.ts` - idempotent, inserts the current 4 hardcoded facts; add `npm run seed:event-info`. No seed needed for `Banner` (no existing hardcoded banner image to migrate - starts empty, landing page must handle that gracefully)

## 2. Upload infrastructure (new for this project - see design.md)

- [ ] 2.1 Add an image-dimension-checking dependency (e.g. `image-size`)
- [ ] 2.2 Decide and implement the dimension-mismatch policy (design.md Open Question #1)
- [ ] 2.3 Decide and implement old-file cleanup on replace (design.md Open Question #3)
- [ ] 2.4 `public/uploads/` added to `.gitignore`
- [ ] 2.5 Flag to whoever owns `DEPLOYMENT.md`'s backup section that `public/uploads/` needs to be included once a backup strategy exists (currently: none - see `DEPLOYMENT.md`)

## 3. Banner admin API + UI

- [ ] 3.1 `app/api/admin/banner/route.ts` (GET - current banner; POST - upload, `multipart/form-data` via `request.formData()`, separate desktop/mobile fields)
- [ ] 3.2 `components/BannerUploader.tsx` + `app/admin/banner/page.tsx`
- [ ] 3.3 Add "管理 Banner" link to `app/admin/page.tsx`, visible to both roles (no `isCto` gate, consistent with every other content-management screen)

## 4. Event-info admin API + UI

- [ ] 4.1 `app/api/admin/event-info/route.ts` (GET - all 4 facts) and `app/api/admin/event-info/[field]/route.ts` (PATCH only - no POST/DELETE, per the "fixed 4 slots" design)
- [ ] 4.2 `components/EventInfoTable.tsx` + `app/admin/event-info/page.tsx` - 4 fixed edit rows, no add/delete control
- [ ] 4.3 Add "管理活動資訊" link to `app/admin/page.tsx`, visible to both roles

## 5. Landing page wiring

- [ ] 5.1 `app/seminar/0915/page.tsx`: query `Banner` and `EventInfo`, `.catch()` fail-safe per the established pattern
- [ ] 5.2 Hero section: render stored banner image per viewport, with a sane fallback when unset
- [ ] 5.3 Event Info section: render the 4 facts from stored data, same visual structure (`.facts`/`.fact` classes) preserved

## 6. Cleanup

- [ ] 6.1 Update README (新增章節、專案結構、測試步驟補 seed 指令、v3 更新對照表、專案進度追蹤) and `devlog.md`
- [ ] 6.2 Update `DEPLOYMENT.md`'s backup section per task 2.5

## 7. Verification

- [ ] 7.1 `npm run build` passes
- [ ] 7.2 Seed event-info, confirm the landing page's Event Info section renders identically to the hardcoded version it replaces
- [ ] 7.3 Confirm the landing page renders sanely with no banner uploaded yet (fallback behavior)
- [ ] 7.4 Upload a correctly-sized desktop and mobile banner via the actual admin UI in a browser, confirm both appear correctly on the landing page at the corresponding viewport widths
- [ ] 7.5 Upload an incorrectly-sized image and confirm the implemented dimension-mismatch policy (reject or warn, per design.md Open Question #1) behaves as decided
- [ ] 7.6 Edit an event-info fact via the actual admin UI, confirm it reflects on the landing page and the other 3 facts are unchanged
- [ ] 7.7 Confirm there is no add/delete control anywhere in the event-info admin UI
- [ ] 7.8 Unauthenticated request to each new admin API and admin page rejected (existing middleware coverage)
- [ ] 7.9 Code-inspection check that neither new admin route handler group gates on `role === "CTO"` (PR-role parity with every other content-management screen)

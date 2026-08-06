**Implemented and verified 2026-08-06. design.md's four open questions were resolved with the user on 2026/08/05 (hard-reject on dimension mismatch, no server-side resize, delete old file on replace, no admin preview).**

## 1. Data model

- [x] 1.1 Add `EventInfoField` enum and `EventInfo` model to `prisma/schema.prisma`
- [x] 1.2 Add `Banner` model (singleton pattern, `id` defaults to a fixed literal)
- [x] 1.3 `npx prisma migrate dev` — migration `20260806030223_add_banner_event_info`
- [x] 1.4 `prisma/seed-event-info.ts` - idempotent, inserts the current 4 hardcoded facts; `npm run seed:event-info` added. No seed needed for `Banner` (starts empty, landing page handles that gracefully)

## 2. Upload infrastructure (new for this project - see design.md)

- [x] 2.1 Added `image-size` (^2.0.2) as an image-dimension-checking dependency
- [x] 2.2 Hard-reject on dimension mismatch implemented - error states required vs. received dimensions (e.g. "圖片尺寸不符：桌機版 Banner 需為 2560×1440，收到的是 800×600")
- [x] 2.3 Immediate old-file deletion on replace implemented - no rollback copy, no accumulation (verified: re-uploading desktop banner deleted the previous file from disk)
- [x] 2.4 `public/uploads/` added to `.gitignore`
- [x] 2.5 Flagged in `DEPLOYMENT.md`'s backup section that `public/uploads/` needs to be included once a backup strategy exists

## 3. Banner admin API + UI

- [x] 3.1 `app/api/admin/banner/route.ts` (GET - current banner; POST - upload, `multipart/form-data` via `request.formData()`, separate desktop/mobile fields)
- [x] 3.2 `components/BannerUploader.tsx` + `app/admin/banner/page.tsx`
- [x] 3.3 "管理 Banner" link added to `app/admin/page.tsx`, visible to both roles (no `isCto` gate, consistent with every other content-management screen)

## 4. Event-info admin API + UI

- [x] 4.1 `app/api/admin/event-info/route.ts` (GET - all 4 facts) and `app/api/admin/event-info/[field]/route.ts` (PATCH only - no POST/DELETE, per the "fixed 4 slots" design)
- [x] 4.2 `components/EventInfoTable.tsx` + `app/admin/event-info/page.tsx` - 4 fixed edit rows, no add/delete control
- [x] 4.3 "管理活動資訊" link added to `app/admin/page.tsx`, visible to both roles

## 5. Landing page wiring

- [x] 5.1 `app/seminar/0915/page.tsx`: queries `Banner` and `EventInfo`, `.catch()` fail-safe per the established pattern
- [x] 5.2 Hero section: renders stored banner image per viewport (`.hero-banner--desktop`/`.hero-banner--mobile`), with a sane fallback (section simply doesn't render) when unset
- [x] 5.3 Event Info section: renders the 4 facts from stored data, same visual structure (`.glass.fact` classes, same `<br/>`/`<small>` nesting) preserved

## 6. Cleanup

- [x] 6.1 Updated README (新增章節、專案結構、測試步驟補 seed 指令、v3 更新對照表、專案進度追蹤) and `devlog.md` (Phase 31, dated 2026-08-06)
- [x] 6.2 Updated `DEPLOYMENT.md`'s backup section per task 2.5

## 7. Verification

- [x] 7.1 `npm run build` passes - all new routes compiled, `/admin/banner`/`/admin/event-info` static, `/api/admin/banner`/`/api/admin/event-info*` dynamic as expected
- [x] 7.2 Seeded event-info via `npm run seed:event-info`, confirmed the landing page's Event Info section renders identically to the hardcoded version it replaces
- [x] 7.3 Confirmed the landing page renders sanely with no banner uploaded yet (hero-banner block simply absent, no broken image, no layout shift)
- [x] 7.4 Uploaded a correctly-sized desktop (2560×1440) and mobile (1080×1350) banner via direct API testing (session-cookie `fetch`, since the Browser pane has no file-upload capability - browser UI itself is a thin wrapper with no extra logic to test), confirmed both appear correctly on the landing page at the corresponding viewport widths. **Found and fixed a real bug during this check**: a CSS specificity issue (`.hero-banner img{display:block}` at specificity (0,1,1) was beating the single-class `.hero-banner--mobile{display:none}`/`.hero-banner--desktop{display:none}` toggle rules at (0,1,0)), which meant once both slots were uploaded, both images rendered at every viewport regardless of the media query. Fixed by qualifying the toggle selectors with `img` (`.hero-banner img.hero-banner--mobile` etc.) to raise their specificity above the base rule. Re-verified at both 375px and 1200px viewports via computed-style checks - only the correct variant is visible at each width.
- [x] 7.5 Uploaded an incorrectly-sized image (800×600 to the desktop slot) - rejected with `400` and the clear dimension error described in 2.2
- [x] 7.6 Edited the DATE fact via the actual admin UI in a browser (temporarily changed line1 to a test value), confirmed it reflected on the landing page immediately, then reverted it back to the original value; confirmed the other 3 facts were unaffected
- [x] 7.7 Confirmed there is no add/delete control anywhere in the event-info admin UI (by construction - `EventInfoTable.tsx` maps over a fixed 4-entry `FIELDS` array, only renders a per-card "編輯" button)
- [x] 7.8 Confirmed unauthenticated `GET`/`POST /api/admin/banner`, `GET /api/admin/event-info`, `PATCH /api/admin/event-info/[field]`, and `GET /admin/banner` all redirect to `/admin/login` (existing global `middleware.ts` coverage for `/admin/:path*` and `/api/admin/:path*` - no route-specific auth code was needed)
- [x] 7.9 Code-inspection confirmed neither new route handler group nor either new admin page checks `role === "CTO"` anywhere - full PR-role parity with every other content-management screen

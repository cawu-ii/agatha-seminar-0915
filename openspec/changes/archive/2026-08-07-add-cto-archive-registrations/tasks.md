## 1. Data model

- [x] 1.1 Add `archived Boolean @default(false)` to `Registration` in `prisma/schema.prisma`
- [x] 1.2 `npx prisma migrate dev` — migration `20260807100054_add_registration_archived`, applied locally

## 2. Backend

- [x] 2.1 `app/api/admin/registrations/route.ts`: default `where` excludes `archived: true`; accept `?archived=true` to show only archived rows (CTO-only - reject or ignore the param for PR sessions); include `archived` in the `select`
- [x] 2.2 New `app/api/admin/registrations/[id]/archive/route.ts` (PATCH, CTO-only via `getCurrentAccount()`/`role !== "CTO"` check): toggles `archived`
- [x] 2.3 `app/api/admin/export/route.ts`: add `where: { archived: false }` to the export query
- [x] 2.4 `app/api/export/route.ts` (CLI/token path): same `where: { archived: false }`
- [x] 2.5 `scripts/export-registrations.ts`: same `where: { archived: false }`

## 3. Admin UI

- [x] 3.1 `app/admin/page.tsx`: pass `isCto` down to `<AdminTable isCto={isCto} />`
- [x] 3.2 `components/AdminTable.tsx`: accept `isCto` prop; when true, render a "封存"/"取消封存" button per row and an "顯示已封存" filter checkbox/toggle; when false (PR), render neither - no archive state visible or reachable at all

## 4. Verification

- [x] 4.1 `npm run build` passes — clean build, `/api/admin/registrations/[id]/archive` and `/uploads/[...path]` both compiled as dynamic routes as expected
- [x] 4.2 As CTO: archived a test registration and confirmed it disappears from the default list. Verified by driving the exact same endpoints the admin UI calls (`GET /api/admin/registrations`, `PATCH .../archive`) against a real `next start` production build with cookie-authenticated CTO/PR test sessions — not a literal browser click-through (Browser pane screenshot tool was unreliable earlier this session; API-level verification exercises identical code paths to the UI, which only wraps `fetch` calls to these same routes)
- [x] 4.3 Confirmed the archived registration does NOT appear in an in-admin `.xlsx` export — downloaded the real export from `/api/admin/export` while archived and parsed it with `exceljs`: only the header row remained (`rowCount: 1`)
- [x] 4.4 Confirmed the CLI (`/api/export`) and `scripts/export-registrations.ts` paths both carry `where: { archived: false }` in source (code inspection; both already used a shared token/role gate untouched by this change)
- [x] 4.5 Toggled the archived-only filter (`?archived=true`) as CTO, confirmed the archived registration appears there
- [x] 4.6 Unarchived it, confirmed it reappears in the default list and in export (re-ran the export check with `rowCount` back to including the row)
- [x] 4.7 As PR: confirmed `?archived=true` is silently ignored (returns the normal non-archived list, not an error) — matches the "PR shouldn't even know this filter exists" design decision; the UI additionally never renders the checkbox/button for a non-CTO session (`isCto` prop gate)
- [x] 4.8 Confirmed `PATCH /api/admin/registrations/:id/archive` returns 403 for a PR-role session (`{"error":"僅 CTO 可封存報名資料"}`) and redirects to `/admin/login` for an unauthenticated request (existing global `middleware.ts` session gate on all `/api/admin/:path*`, unchanged by this feature)
- [x] 4.9 Confirmed via `grep -rn "registration.delete" app/ lib/ scripts/` that the only match is the explanatory comment in the new archive route itself — no code path ever calls `prisma.registration.delete`

## 5. Cleanup

- [x] 5.1 Provided a standalone script (`scripts/archive-test-registrations.ts`) for the CTO to run directly against the production database over SSH, since production isn't yet running this deployed feature — lists matching test registrations and requires `--confirm` to archive them (never deletes)
- [x] 5.2 Updated README (與原型 HTML 差異表、admin-console 相關章節、名單匯出章節、v3 更新對照表、專案進度追蹤表) and devlog.md with a new dated phase entry

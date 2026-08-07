## 1. Backend

- [x] 1.1 `app/api/admin/export/route.ts`: dropped the `me.role !== "CTO"` check, kept the "must have a valid session" check (401 instead of the old 403 for that case)
- [x] 1.2 `AdminAuditLog` entry still records regardless of role - no code change was needed, confirmed via direct query

## 2. Admin UI

- [x] 2.1 `app/admin/page.tsx`: "匯出 Excel" link moved out of the `isCto &&` block, both roles now see it; "帳號管理" stays CTO-only
- [x] 2.2 Page description text updated to drop the now-false "無整批匯出" claim (now just "無刪除功能")

## 3. Verification

- [x] 3.1 `npm run build` passes. Hit a stale-build-cache issue during verification (a rebuild after the code edit still served the old error string in production mode) - resolved by deleting `.next` and rebuilding clean; the fix itself was correct all along, this was a build tooling artifact, not a code problem
- [x] 3.2 Logged in as a fresh PR-role test account against a real production build (`next start`, not dev mode), confirmed the export endpoint returns 200 with the `.xlsx` content-type (previously 403 with `{"error":"僅 CTO 可匯出"}`)
- [x] 3.3 Confirmed the PR-triggered response has the identical `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` content-type as a CTO-triggered one
- [x] 3.4 Queried `AdminAuditLog` directly: the PR export created a row attributing `pr-export-verify@example.com` (role PR), same shape as CTO's rows
- [x] 3.5 Confirmed `GET /api/admin/accounts` still returns 403 for the PR-role session - unaffected by this change
- [x] 3.6 Confirmed unauthenticated `GET /api/admin/export` still 307-redirects to `/admin/login` (existing middleware coverage, unrelated to role)

## 4. Cleanup

- [x] 4.1 Updated README (與原型 HTML 差異表、角色與分工、待確認事項、專案進度追蹤表) and devlog documenting this as a confirmed, deliberate policy reversal of the CTO handoff doc §6.9 restriction, not an oversight

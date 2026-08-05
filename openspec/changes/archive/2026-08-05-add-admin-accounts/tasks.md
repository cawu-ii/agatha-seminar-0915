## 1. Data model

- [x] 1.1 Add `AdminRole` enum (`CTO`, `PR`), `AdminAccount` model (email, passwordHash, name, role, active, createdAt, lastLoginAt), `AdminAuditLog` model (accountId, action, detail, createdAt) to `prisma/schema.prisma`
- [x] 1.2 `npx prisma migrate dev`
- [x] 1.3 `prisma/seed-admin.ts`: create one CTO account from `INITIAL_CTO_EMAIL`/`INITIAL_CTO_PASSWORD` env vars if no accounts exist yet (idempotent, same pattern as `seed-agenda.ts`); add `npm run seed:admin`
- [x] 1.4 Add `bcryptjs` dependency

## 2. Session/auth rewrite

- [x] 2.1 `lib/session.ts`: session payload becomes `<accountId>.<role>.<expires>`; `createSessionToken(accountId, role)`; `verifySessionToken` returns `{accountId, role} | null`; remove `checkAdminPassword`/`ADMIN_PASSWORD` usage
- [x] 2.2 Add `getCurrentAccount()` helper (reads cookie via `next/headers`, verifies, returns `{accountId, role} | null`) for use in route handlers/pages — implemented in new `lib/auth.ts`, kept separate from `lib/session.ts` since `next/headers` isn't valid in the Edge middleware runtime that also imports `session.ts`
- [x] 2.3 `app/api/admin/login/route.ts`: accept `{ email, password }`, look up `AdminAccount` by email, `bcryptjs.compare`, reject if inactive, create session, update `lastLoginAt`, write audit log entry
- [x] 2.4 `app/admin/login/page.tsx`: add email field to the login form
- [x] 2.5 Confirm `middleware.ts` still works unchanged (gate is "valid session exists", independent of payload shape) — confirmed, only needed to change the returned type it checks against (object vs boolean)

## 3. Account management (CTO-only)

- [x] 3.1 `app/api/admin/accounts/route.ts`: GET (list, CTO-only), POST (create account, CTO-only)
- [x] 3.2 `app/api/admin/accounts/[id]/route.ts`: PATCH (toggle `active`, reset password; CTO-only)
- [x] 3.3 `app/admin/accounts/page.tsx` + `components/AccountsTable.tsx`: list accounts, create form, deactivate/reactivate, reset-password action
- [x] 3.4 Link to it from `/admin`, but only render the link when the current session is CTO-role
- [x] 3.5 Every account-management route checks `role === "CTO"` itself and rejects otherwise (403), not just hides the UI link — also added a page-level redirect on `/admin/accounts` itself (defense in depth beyond just hiding the nav link), verified in the browser: a PR session navigating directly to the URL gets redirected server-side back to `/admin`

## 4. Excel export

- [x] 4.1 Add `exceljs` dependency
- [x] 4.2 Extract shared "build the registrations workbook" logic (used by both the script and the two API routes) into `lib/export-workbook.ts`
- [x] 4.3 `scripts/export-registrations.ts`: switch from hand-built CSV to the shared `.xlsx` builder
- [x] 4.4 `app/api/export/route.ts` (existing token-gated route): switch to `.xlsx` output — now returns the file directly (`Content-Disposition: attachment`) instead of the previous raw-JSON response, since v3 asks for a downloadable file
- [x] 4.5 New `app/api/admin/export/route.ts`: session-gated (CTO-role only, via `getCurrentAccount()`), `.xlsx` output, writes an audit log entry
- [x] 4.6 `/admin` page: render an "匯出 Excel" button linking to `app/api/admin/export` only when the session is CTO-role

## 5. Cleanup

- [x] 5.1 Remove `ADMIN_PASSWORD` from `.env`/`.env.example`; document the seed-first requirement in README
- [x] 5.2 Update README (`.env` table, `/admin` 操作說明, 專案結構, 待確認事項/後續規劃 as relevant) and `devlog.md`

## 6. Verification

- [x] 6.1 `npm run build` passes (hit and fixed a `Buffer` vs `BodyInit` TypeScript error in both export routes - needed `new Uint8Array(buffer)`)
- [x] 6.2 Seed a CTO account, log in, confirm session works for existing registrations/agenda screens unchanged
- [x] 6.3 Create a PR account from `/admin/accounts`, log in as it, confirm: registrations/agenda access works, no accounts-management link/access, no export button/access (403 on direct API call too, not just hidden UI) — all verified via direct API calls with real session cookies (Node `fetch`, not curl - see note below) and in-browser for the UI-hiding behavior
- [x] 6.4 Deactivate the PR account, confirm it can no longer log in — verified, 401 after deactivation
- [x] 6.5 CTO-role export produces a valid `.xlsx` file with expected columns; confirm an audit log row was written — verified by round-tripping the exported file back through `exceljs` itself (read it back and checked row/column counts and cell values), not just checking the HTTP content-type
- [x] 6.6 Confirm login and export actions appear in the audit log with the correct account attributed
- [x] 6.7 Confirm the old `ADMIN_PASSWORD`-based login no longer works (env var removed / unused) — confirmed 401 on a login attempt shaped like the old scheme

**Testing note**: as in earlier phases, Chinese-text request bodies sent via `curl` on this Windows/git-bash setup get corrupted before they reach the server (confirmed: the corruption is real in the stored data, not just a display artifact - re-checked via a direct DB query). Switched to Node's built-in `fetch` for anything involving Chinese text (account names, etc.), which handles UTF-8 correctly. One test PR account got created with genuinely corrupted data as a result before this was caught; deleting it hit a foreign-key error from its own audit log entry (login had already been recorded) - which is the "deactivate, not delete" design decision doing exactly its job. Cleaned it up correctly (delete the audit log rows first, then the account) rather than treating the FK error as a bug to work around.

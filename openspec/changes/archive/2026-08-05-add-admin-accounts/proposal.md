## Why

CTO handoff doc v3 §6.9 explicitly requires **給公關個別帳號（勿共用一組）** and **權限只綁「9/15 這場」名單；活動結束即回收**, with an audit log. The current V1 admin (`admin-console` capability) uses a single shared password for everyone, which was an explicit, documented, temporary V1 choice (see the archived `add-seminar-registration-system` design.md) — v3 now makes replacing it a stated requirement, not just a "nice to have." This also unblocks two other v3 asks that need a real permission distinction to make sense: an in-backend Excel export button visible only to CTO (not PR), and future CMS screens where "who can edit what" matters.

## What Changes

- New `admin-accounts` capability: individual email+password accounts with a role (`CTO` or `PR`), replacing the single `ADMIN_PASSWORD` shared secret entirely.
- CTO can create/deactivate PR accounts from a new `/admin/accounts` screen — this is how "個別帳號、活動結束即回收" gets satisfied operationally (deactivate, don't delete, so the audit trail survives).
- An audit log records login events and other sensitive actions (bulk export) with the acting account, satisfying "保留操作紀錄 log".
- **BREAKING**: `ADMIN_PASSWORD` env var is removed. Existing shared-password login stops working the moment this ships; an initial CTO account must be seeded (see tasks.md) before anyone can log in.

## Capabilities

### New Capabilities
- `admin-accounts`: individual account login, role assignment, activate/deactivate, audit log of sensitive actions.

### Modified Capabilities
- `admin-console`: "Admin console requires a shared password" → requires a valid individual account instead. "The console provides no bulk export action" gets a role qualifier: still true for PR-role sessions, no longer true for CTO-role sessions (see `data-export`).
- `data-export`: full-list export becomes reachable through `/admin` for CTO-role sessions specifically (not PR), in addition to the existing token-authenticated CLI/script path. Export format becomes `.xlsx` (was CSV), per v3 §6.3.

## Impact

- New Prisma models: `AdminAccount`, `AdminAuditLog`.
- `lib/session.ts` rewritten: session token carries `accountId` + `role`, not a literal `"admin"` role string; `checkAdminPassword` removed.
- `middleware.ts`: unchanged at the gate level (still "does a valid session exist"); role-specific checks (CTO-only routes) happen in those routes/pages, not centrally, since most of `/admin` is shared between both roles.
- `app/api/admin/login/route.ts`: now takes `{ email, password }`, looks up `AdminAccount`.
- All existing admin routes/pages (registrations, agenda) keep working unchanged for behavior - they just now run under an account-based session instead of a shared-password one. No spec changes needed there beyond `admin-console`'s login requirement.
- `scripts/export-registrations.ts` and `app/api/export/route.ts` switch output format to `.xlsx`; new `app/api/admin/export/route.ts` (session/role-gated) added for the in-UI CTO button.
- `.env.example`/README: `ADMIN_PASSWORD` removed, replaced by one-time seed instructions for the first CTO account.

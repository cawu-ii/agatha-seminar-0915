## Context

See proposal.md - Why. Current state: `lib/session.ts` signs a token whose payload is literally the string `"admin"` plus an expiry - it authenticates "someone with the shared password," not a person. `ADMIN_PASSWORD` is one env var everyone uses. This change replaces that with real accounts while keeping every other admin capability (registrations, agenda) behaviorally unchanged.

## Goals / Non-Goals

**Goals:**
- Every `/admin` session is tied to one person's account, not a shared secret.
- CTO can create and deactivate PR accounts without touching code/env vars.
- CTO-only actions (bulk export, account management) are enforced by role, not by convention.
- Sensitive actions are logged with who did them.

**Non-Goals:**
- Fine-grained per-screen permissions beyond CTO/PR (e.g., "this PR account can see agenda but not registrations") - v3 asks for two tiers, not a general permission matrix. Add more roles later only if actually needed.
- Self-service password reset / email verification flows - CTO sets the initial password when creating an account; a PR person who forgets it asks CTO to reset it (a simple "set new password" action on the accounts screen), not a full forgot-password email flow.
- Automatic time-based access expiry tied to the event date - "活動結束即回收" is implemented as a manual deactivate action CTO takes, not a cron job. Automating that is easy to add later and not worth the complexity now.

## Decisions

- **`bcryptjs` for password hashing, not `bcrypt`**: `bcrypt` has native bindings; this project already hit one native-module/webpack bundling problem with `@libsql/client` (see devlog Phase 20) and the fix (`serverExternalPackages`) is exactly the kind of friction worth avoiding twice. `bcryptjs` is pure JS, same API shape, no bundler special-casing needed.
- **Session token carries `accountId` + `role`, signed the same HMAC/Web Crypto way as before**: keeps the existing Edge-runtime-safe signing approach (see devlog Phase 7) rather than introducing a JWT library. Payload becomes `<accountId>.<role>.<expires>`, signature appended, same as the current `admin.<expires>.<sig>` shape just with two fields instead of one literal string.
- **Middleware stays role-agnostic; role checks live in the specific routes/pages that need them**: `middleware.ts`'s job is "is there a valid session at all" - both roles pass that gate since most of `/admin` (registrations, agenda) is shared. `/admin/accounts` and the export endpoint each check `role === "CTO"` themselves after the middleware gate, returning 403/redirecting otherwise. Centralizing role logic in middleware would require middleware to know every route's required role up front, which doesn't scale as more CTO-only screens get added later (accounts today, possibly CMS-block permissions tomorrow).
- **Deactivate, not delete, for account revocation**: matches "活動結束即回收" (revoke access) while keeping the audit log's `accountId` references valid - deleting an account would orphan its audit trail or require soft-delete semantics anyway, so `active: false` is simpler and already does what's needed.
- **Audit log covers login + bulk export only for V1, not every CRUD action**: v3's ask is "操作紀錄 log" in the context of §6.9's permission table, which is about the sensitive stuff (who logged in, who exported). Logging every mark-reviewed/agenda-edit click is possible later but isn't what was asked for and would add a write on every admin interaction for a benefit nobody requested yet.
- **Initial CTO account via a seed script, same pattern as `seed-agenda.ts`**: `prisma/seed-admin.ts` reads `INITIAL_CTO_EMAIL`/`INITIAL_CTO_PASSWORD` from `.env`, creates one CTO account if none exists yet, skips if accounts already exist (idempotent, same pattern as the agenda seed's duplicate-guard).

## Risks / Trade-offs

- [Removing `ADMIN_PASSWORD` is a breaking change - anyone with the old shared password loses access the moment this ships] → unavoidable given the requirement itself is "stop sharing one password"; mitigated by requiring the seed step before this is usable at all, and calling it out explicitly in the proposal and README migration notes.
- [No self-service password reset means a locked-out PR person is blocked until CTO acts] → acceptable for a small, short-lived (single event) user base; matches the Non-Goals call above. CTO resetting a password from `/admin/accounts` is a 10-second action.
- [Two roles (CTO/PR) is a coarser model than some orgs might want] → matches what v3 actually asked for; adding roles later means adding an enum value and a few `role === "X"` checks, not a rearchitecture.

## Migration Plan

1. Add `AdminAccount`/`AdminAuditLog` models, migrate.
2. Run `npm run seed:admin` once (reads `INITIAL_CTO_EMAIL`/`INITIAL_CTO_PASSWORD` from `.env`) to create the first CTO account - **must happen before deploying this change**, or nobody can log in.
3. Ship the new login/session code, `/admin/accounts` screen, and role-gated export together (they're one cohesive unit - shipping account login without a way to create more accounts, or without the export button that's the whole point of having roles, would leave the feature half-usable).
4. CTO logs in with the seeded account, creates individual PR accounts from `/admin/accounts`, hands out credentials directly (not through this system - no email-invite flow in V1).
5. Remove `ADMIN_PASSWORD` from `.env`/`.env.example` once confirmed working; it's no longer read by any code path after this ships.

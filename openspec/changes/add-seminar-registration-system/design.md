## Context

See proposal.md - Why. Greenfield build: `seminar_apply/` currently has only a static, already-approved HTML design and the CTO handoff doc — no backend, no existing tech choices to respect. User-confirmed constraints going into this design:

- Stack: Next.js (App Router, TypeScript), single deployable app.
- DB: Postgres, intended production target Supabase — but no Supabase account exists yet.
- Admin scope for V1: single shared password, view/filter/mark/resend only — no delete, no bulk export.
- Zero third-party credentials available right now (GA4, Meta Pixel, transactional email, Ragic) — user explicitly chose "placeholder env vars now, wire real values later" over waiting.
- Deadline: staging-testable by 8/5, matching handoff doc §12's test window.

## Goals / Non-Goals

**Goals:**
- Every integration point (email, Meta CAPI, Ragic, GTM/GA4) is a config-only swap from placeholder to live — no code changes needed when credentials arrive.
- The registration write path never fails or blocks because a downstream integration (email/CAPI) is down or unconfigured.
- Existing approved landing page copy/visuals carry over unchanged.
- Local dev/staging is fully runnable without any external account (Docker Postgres, log-only integrations).

**Non-Goals:**
- Multi-user admin auth with per-person roles (deferred; V1 is single shared password per user's explicit choice).
- Live Ragic push (deferred to Phase B; V1 ships the stub + a CTO-only export path).
- Durable job queue infra (Redis/BullMQ/Upstash) — out of scope for the 8/5 deadline; async work is fire-and-forget in-process with logged failures, upgraded before the 8/11 real launch if needed.
- Actually provisioning Vercel/DNS/GA4/Meta/email accounts — those are the user's/other stakeholders' actions per handoff doc §0, not this change.

## Decisions

- **Next.js App Router over separate frontend+API**: one deployable, one env var set, fastest path to a staging URL by tomorrow. Alternative considered: Express API + static HTML — rejected because it doubles deploy/config surface for no benefit at this deadline.
- **Prisma + Postgres (local Docker now, Supabase-compatible connection string later)**: Docker is available in this environment, so we get a real Postgres (not SQLite) without needing an external account, and the eventual swap to Supabase is a one-line `DATABASE_URL` change plus `prisma migrate deploy` — no schema rewrite. Alternative considered: SQLite for speed — rejected because jsonb-ish array fields (sessions/consult multi-select) and the later Postgres migration are cleaner if we target Postgres from day one.
- **event_id + idempotency_key, not a queue, for dedup**: `event_id` (server-generated UUID) is the dedup key handed to GA4/Meta so both count the same conversion once. `idempotency_key` (client-generated per form-load, unique DB constraint) absorbs accidental double-submits (double click, network retry) without needing a queue.
- **Fire-and-forget async, not `await`, for email/CAPI**: per handoff doc §6.3, the DB insert is the only thing that must succeed for a registration to count. Email/CAPI run after `res.json()` is sent conceptually (in Next.js Route Handlers we still return the response before these settle, and wrap each in try/catch that only logs) so a dead email provider never turns into a failed registration.
- **Consent banner gates GTM script injection entirely**: script tag is not rendered until consent cookie is set, satisfying handoff doc §6.6 ("行銷追蹤碼取得同意後才觸發") without a heavier CMP.
- **Single shared password for admin V1**: matches user's explicit choice; implemented as a signed cookie session (HMAC over a fixed secret + expiry), not a user table — avoids building an auth system the day before launch. Multi-account RBAC is flagged as Phase B in README/tasks.
- **CTO-only export is a script, not an admin UI button**: satisfies handoff doc §12 test #9 ("不能整批匯出") literally — the capability that violates the constraint for 公關 simply isn't reachable from `/admin` at all; it's a separate authenticated route/script only the CTO runs.

## Risks / Trade-offs

- [Fire-and-forget async work can silently fail if the Node process exits before it settles] → status columns (`email_status`, `meta_capi_status`) + timestamps are written on the record so failures are visible in `/admin` and via a manual per-row "resend" action; acceptable for V1 given no queue infra, revisit before 8/11 if volume warrants.
- [Local Postgres via Docker isn't Supabase — connection pooling/latency characteristics differ] → schema and queries are provider-agnostic Prisma; swap is `DATABASE_URL` only, but should be smoke-tested once real Supabase credentials exist, before 8/10.
- [Single shared admin password is weaker than per-person accounts] → explicitly scoped as V1/temporary; tasks.md carries a Phase B item for per-person RBAC before the doc's own "公關帳號＋權限層級設定完成" checklist item is truly satisfied for production.
- [No live GA4/Meta/email/Ragic credentials means §12 test items #4/#7/#8 can only be verified as "code path executes, log-only"] → called out explicitly in README and tasks.md as blocked-on-credentials, not silently marked done.

## Migration Plan

1. Ship with local Docker Postgres for staging verification (8/5).
2. When Supabase project exists, set `DATABASE_URL` to the Supabase connection string and run `npx prisma migrate deploy` — no schema changes needed.
3. When GA4/Meta/email/Ragic credentials arrive, set the corresponding env vars; each integration module already checks for presence and switches from no-op to live without a deploy of new code (env var change + redeploy only).
4. Vercel/agatha-ai.com DNS cutover happens when the user is ready — this change only needs to produce a deployable app, not perform the cutover.

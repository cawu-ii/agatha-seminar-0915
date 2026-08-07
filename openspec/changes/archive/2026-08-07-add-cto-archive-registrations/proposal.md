## Why

The admin console has never had any way to remove a registration from the working list - "no delete action" was a deliberate blanket restriction (not PR-specific) protecting the single source of truth for who registered. With real testing now happening against the production database (Gmail SMTP confirmation-email verification, mobile RWD checks), test/junk registrations accumulate with no way to clear them out short of raw database access. The user asked directly for a way to clear these out, confirmed (via two follow-up questions) that they want: (1) a soft "mark as invalid/hidden" action, not a true destructive delete, and (2) a permanent CTO-only control in `/admin`, not a one-off cleanup script.

## What Changes

- `Registration` gains an `archived` flag. Archiving hides a registration from the default admin list and Excel export; the underlying row and all its data stays in the database, fully recoverable via "取消封存" (unarchive).
- New CTO-only control in `/admin`'s registration table: "封存" (archive) / "取消封存" (unarchive) per row, plus a filter to view archived-only registrations (so a CTO can find and undo an accidental archive).
- Archived registrations are excluded from the default list view and from `.xlsx` export (both the in-admin button and the CLI/token path) unless the archived-only filter is explicitly used.
- PR-role sessions do not see or reach this control at all - this is CTO-only, same restriction level as account management and bulk export was until yesterday (deliberately not extended to PR, unlike yesterday's export change - deleting/hiding source-of-truth registration data is a different risk category than getting a copy of it).

## Capabilities

### New Capabilities
(None.)

### Modified Capabilities
- `admin-console`: "The console provides no delete action" - replaced with a CTO-only, non-destructive archive/unarchive action; PR-role sessions still have no delete or archive control at all.
- `data-export`: exports (both paths) exclude archived registrations by default.

## Impact

- `prisma/schema.prisma`: `Registration.archived Boolean @default(false)`, migration.
- `app/api/admin/registrations/route.ts`: excludes `archived: true` by default; accepts an `archived=true` query param (CTO-only) to view the archived-only list.
- New `app/api/admin/registrations/[id]/archive/route.ts` (CTO-only, PATCH): toggles `archived`.
- `app/api/admin/export/route.ts`, `lib/export-workbook.ts` / `scripts/export-registrations.ts`: exclude archived rows.
- `components/AdminTable.tsx`: archive/unarchive button + archived-only filter, only rendered for CTO sessions (needs `isCto` passed down from `app/admin/page.tsx`).

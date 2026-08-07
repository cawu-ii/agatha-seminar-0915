## Context

`admin-console`'s original design deliberately gave the console no delete capability at all - not scoped to PR, a blanket restriction protecting registration data (the single source of truth for who registered, tied to capacity planning and the event's actual attendee list). Yesterday's `open-export-to-pr-role` change opened bulk *export* to PR because copying data out is non-destructive; this request is different in kind - it's about removing rows from view/export, which touches the same protected data the original "no delete" rule was written to guard.

The user confirmed (via two clarifying questions) they want a reversible archive, not a true delete, and want it as a standing CTO-only control rather than a one-time script.

## Goals / Non-Goals

**Goals:**
- CTO can hide test/junk registrations from the working list and from Excel export, without permanently destroying the row.
- Every archive/unarchive action is reversible - a CTO who archives the wrong row by mistake can undo it themselves, no engineering involvement needed.

**Non-Goals:**
- Not a true delete. No code path in this change ever calls `prisma.registration.delete(...)`.
- Not extended to PR - this stays CTO-only, unlike yesterday's export change. Registration data itself (not a copy of it) is a higher-risk category.
- Not adding a bulk/multi-select archive action - one row at a time, matching every other per-row admin action in this console (標記已處理, 重寄確認信).

## Decisions

- **Boolean flag (`archived`), not a soft-delete timestamp**: matches the exact pattern `AdminAccount.active` already uses in this codebase (a plain boolean, not `deactivatedAt`). Consistent with the project's established "deactivate not delete" convention rather than introducing a new pattern.
- **CTO-only, not PR**: the original "no delete" requirement wasn't PR-specific to begin with, and hiding/removing registration rows is materially different from yesterday's export change (a copy leaving the system vs. the source record itself becoming invisible to the working list). Default to the more restrictive scope unless told otherwise.
- **Excluded from both export paths**: an archived row disappearing from the on-screen list but still showing up in the CTO's Excel export would be a confusing, easy-to-miss inconsistency - both `/api/admin/export` and the CLI/`EXPORT_TOKEN` path filter it out the same way the list query does.
- **Archived-only filter, not a "show archived inline" toggle**: keeps the default list clean (the actual goal - hide junk data) while still making archived rows findable/reversible without needing direct database access.

## Risks / Trade-offs

- **[Risk]** A CTO could still lose track of what's archived and why (no reason/note field on archive). → **Mitigation**: out of scope for this pass since the immediate need is just "hide test data"; `reviewerNote` already exists on the model if a reason needs recording informally, nothing prevents adding a dedicated field later if this becomes a real workflow need.
- **[Risk]** Archiving a real registration by mistake makes it invisible to whoever's tracking headcount unless they know to check the archived filter. → **Mitigation**: reversible (unarchive), CTO-only (smaller blast radius than if PR could do it too), and the archived-only filter exists specifically so nothing is ever truly lost from view for someone who knows to look.

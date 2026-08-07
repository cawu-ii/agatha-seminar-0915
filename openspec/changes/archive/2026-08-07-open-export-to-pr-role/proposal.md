## Why

Explicit user instruction (2026/08/07): PR needs to be able to export the full registration list directly from `/admin` to hand to registering companies, without routing every export through the CTO first. This reverses a deliberate restriction from the CTO handoff doc (§6.9: "全量含個資之名單匯出由我方控管後再提供") that was enforced structurally since `add-admin-accounts`/`add-excel-export` - confirmed directly with the user before implementing given the PII exposure and the explicit contradiction with the handoff doc's own wording.

## What Changes

- **BREAKING** (behavior, not API shape): PR-role sessions can now use the in-admin "匯出 Excel" control and reach `GET /api/admin/export` successfully. Previously this control was hidden from PR and the endpoint returned 403 for any non-CTO session.
- The token-authenticated CLI/script export path (`/api/export?token=...`, `EXPORT_TOKEN`) is unchanged - still a separate credential, not tied to session role at all.
- Audit logging is unchanged: every export (CTO or PR) still records an `AdminAuditLog` entry with the acting account, so who exported what remains traceable even though both roles can now do it.

## Capabilities

### New Capabilities
(None.)

### Modified Capabilities
- `data-export`: "Full-list export is reachable by CTO-role sessions, including from within /admin" - PR-role sessions are no longer excluded.
- `admin-console`: "The console provides no bulk export action" - PR-role sessions now see and can use the bulk-export control, same as CTO.

## Impact

- `app/admin/page.tsx`: "匯出 Excel" link moves out of the `isCto &&` block (stays alongside it, "帳號管理" stays CTO-only).
- `app/api/admin/export/route.ts`: drop the `me.role !== "CTO"` check, keep the "must have a valid session at all" check.
- Admin page's description text ("無刪除、無整批匯出（公關角色）") needs updating - only "無刪除" remains true.
- README/devlog updated to record this as a deliberate, confirmed policy change, not an oversight.

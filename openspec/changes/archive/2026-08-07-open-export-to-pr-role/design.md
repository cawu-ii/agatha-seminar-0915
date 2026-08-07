## Context

`add-admin-accounts`/`add-excel-export` deliberately gated bulk export to CTO-role sessions only, structurally (not just a hidden UI control - the API route itself checked `role !== "CTO"`), directly implementing CTO handoff doc §6.9's "全量含個資之名單匯出由我方控管後再提供". The exported `.xlsx` contains full PII for every registrant (name, email, phone, company, title, industry, etc.).

On 2026/08/07 the user relayed that PR needs to export directly to hand lists to registering companies, without routing every export through the CTO. This was flagged back to the user as a direct contradiction of the handoff doc's own wording before proceeding; the user confirmed it's an intentional, wanted change.

## Goals / Non-Goals

**Goals:**
- PR-role sessions can use the same in-admin export control CTO already has, producing the identical `.xlsx`.
- Every export attempt, by either role, remains attributable via `AdminAuditLog` - this was the original design's second line of defense (control who can export) plus a first line that stays (know who did).

**Non-Goals:**
- Not touching the token-authenticated CLI path (`/api/export?token=`) - that's a separate credential model, already reachable by anyone holding `EXPORT_TOKEN`, unrelated to session role.
- Not adding new PII-handling safeguards (e.g., watermarking, expiring links) - out of scope for this request, the ask is specifically "give PR the existing button."

## Decisions

- **Remove the role check rather than add a new "PR export" permission tier**: the account model only has two roles (`CTO`/`PR`); introducing a third tier for one narrow permission would be over-engineering for a two-person-role system that's never needed more granularity anywhere else.
- **Keep audit logging exactly as-is**: it already records `accountId` per export regardless of role, so no code change needed there - opening the gate doesn't lose the traceability that was the other half of the original design.

## Risks / Trade-offs

- **[Risk]** PII now leaves CTO's sole control - any PR account (including one later handed to someone outside the core team) can pull the full list. → **Mitigation**: this is an accepted trade-off per explicit user confirmation, not something this change can technically mitigate further; if tighter control is needed later, revisit via account lifecycle (deactivate PR accounts promptly when no longer needed - already the established pattern for this project) rather than re-restricting the export button.
- **[Risk]** This directly contradicts CTO handoff doc §6.9's written text. → **Mitigation**: documented here and in devlog as a deliberate, confirmed deviation, not a silent drift, so a future reader (or audit) can see why the code no longer matches that section.

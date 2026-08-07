## REMOVED Requirements

### Requirement: The console provides no bulk export action
**Reason**: Confirmed 2026/08/07 (direct user instruction, reversing the CTO handoff doc §6.9 restriction this requirement implemented) - PR-role sessions need to export the full registration list directly to hand to registering companies, without routing through CTO first.
**Migration**: See `data-export`'s "Full-list export is reachable by CTO-role sessions, including from within /admin" requirement, which now covers both roles identically. The console's delete restriction for PR is unaffected and unchanged.

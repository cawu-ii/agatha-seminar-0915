## REMOVED Requirements

### Requirement: Admin console requires a shared password
**Reason**: Replaced by individual accounts (v3 handoff doc §6.9: "給公關個別帳號（勿共用一組）"). A single shared password can't attribute actions to a person or be revoked for one person without affecting everyone.
**Migration**: See `admin-accounts` capability's "Login requires a valid individual account" requirement. `ADMIN_PASSWORD` env var is removed; an initial CTO account must be seeded (see design.md Migration Plan) before anyone can log in.

## MODIFIED Requirements

### Requirement: The console provides no bulk export action
The system SHALL NOT expose any control to a PR-role session in `/admin` that exports multiple registrations at once (CSV, Excel, or otherwise). CTO-role sessions may access bulk export (see `data-export`).

#### Scenario: Inspecting available admin actions
- **WHEN** a PR-role account views the registration list
- **THEN** no bulk-export/download-all control is present or reachable

#### Scenario: CTO-role session inspects available actions
- **WHEN** a CTO-role account views the registration list
- **THEN** a bulk-export control is present and reachable

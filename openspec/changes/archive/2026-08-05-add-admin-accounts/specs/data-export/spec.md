## REMOVED Requirements

### Requirement: Full-list export is only reachable by the CTO, not via the admin console
**Reason**: With individual accounts and roles now in place (`admin-accounts`), "not via the admin console" is no longer the right boundary - the console is shared by both roles. The real constraint (PR can never reach bulk export) still holds; it's now enforced by role instead of by keeping the whole console PR-only.
**Migration**: See the replacement requirement below.

## ADDED Requirements

### Requirement: Full-list export is reachable by CTO-role sessions, including from within /admin
The system SHALL provide a way to export the full registration list as `.xlsx` that is available to CTO-role sessions, either through an authenticated CLI/script path (token-based, unchanged mechanism) or through a control inside `/admin` visible only to CTO-role sessions. PR-role sessions SHALL NOT be able to reach either path.

#### Scenario: PR-role session attempts export
- **WHEN** a PR-role session is used, whether via the in-admin control or by calling the export endpoint directly
- **THEN** the export is not accessible

#### Scenario: CTO-role session exports from the admin console
- **WHEN** a CTO-role session uses the in-admin export control
- **THEN** an `.xlsx` file containing all registration records and their fields is produced, and an audit log entry is recorded (see `admin-accounts`)

#### Scenario: CTO runs the export via script
- **WHEN** the export is invoked with the token-authenticated CLI path
- **THEN** an `.xlsx` file containing all registration records and their fields is produced

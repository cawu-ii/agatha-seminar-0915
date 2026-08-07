## MODIFIED Requirements

### Requirement: Full-list export is reachable by CTO-role sessions, including from within /admin
The system SHALL provide a way to export the full registration list as `.xlsx` that is available to any authenticated `/admin` session (CTO or PR role), either through an authenticated CLI/script path (token-based, unchanged mechanism) or through a control inside `/admin`. PR-role sessions are no longer excluded (confirmed 2026/08/07: PR needs to export directly to registering companies, deliberately reversing the original CTO-only restriction).

#### Scenario: PR-role session uses the in-admin export control
- **WHEN** a PR-role session uses the in-admin export control
- **THEN** an `.xlsx` file containing all registration records and their fields is produced, and an audit log entry recording that PR account is created (see `admin-accounts`)

#### Scenario: CTO-role session exports from the admin console
- **WHEN** a CTO-role session uses the in-admin export control
- **THEN** an `.xlsx` file containing all registration records and their fields is produced, and an audit log entry is recorded (see `admin-accounts`)

#### Scenario: CTO runs the export via script
- **WHEN** the export is invoked with the token-authenticated CLI path
- **THEN** an `.xlsx` file containing all registration records and their fields is produced

#### Scenario: Unauthenticated request
- **WHEN** a request to the in-admin export control is made without a valid admin session
- **THEN** the export is not accessible (existing session-auth middleware coverage, unrelated to role)

## Purpose

Gets the full registration list out to Lindy/Ragic through a CTO-controlled path, kept deliberately separate from the PR-facing admin console so the "no bulk export for PR" constraint holds structurally, not just by omission.

## ADDED Requirements

### Requirement: Full-list export is only reachable by the CTO, not via the admin console
The system SHALL provide a way to export the full registration list (CSV/XLSX) that is authenticated separately from and not linked within the `/admin` console used by PR.

#### Scenario: PR admin session attempts export
- **WHEN** a session authenticated only with the shared PR admin password is used
- **THEN** the full-list export path is not accessible

#### Scenario: CTO runs the export
- **WHEN** the export is invoked with CTO-level credentials/access
- **THEN** a file containing all registration records and their fields is produced

### Requirement: Ragic sync is a configuration-gated no-op until credentials exist
The system SHALL provide a Ragic sync integration point that does nothing (no-op, logged) when no Ragic API token is configured, and SHALL NOT be invoked from the registration or admin request paths in a way that could fail them.

#### Scenario: No Ragic token configured
- **WHEN** a registration succeeds and no Ragic API token is configured
- **THEN** no outbound request to Ragic is made, and neither the registration nor the admin console is affected

#### Scenario: Ragic token configured (future)
- **WHEN** a Ragic API token is configured
- **THEN** the sync integration point sends the registration's fields to Ragic without requiring changes to the registration or admin code paths

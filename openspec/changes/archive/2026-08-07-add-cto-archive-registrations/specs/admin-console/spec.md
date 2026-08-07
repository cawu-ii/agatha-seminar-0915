## MODIFIED Requirements

### Requirement: The console provides no delete action
The system SHALL NOT expose any control in `/admin` that permanently deletes a registration's core submitted data or is reachable by a PR-role session. The system SHALL let a CTO-role session reversibly archive a registration (hiding it from the default list and from export) and unarchive it, without ever removing the underlying row.

#### Scenario: Inspecting available admin actions as PR
- **WHEN** a PR-role session views a registration in the list
- **THEN** no delete, edit-core-fields, or archive control is present or reachable

#### Scenario: CTO archives a registration
- **WHEN** a CTO-role session archives a registration
- **THEN** it no longer appears in the default registration list or in `.xlsx` export, but the row and all its data remain in the database

#### Scenario: CTO views archived registrations
- **WHEN** a CTO-role session applies the archived-only filter
- **THEN** archived registrations are shown, each with an option to unarchive

#### Scenario: CTO unarchives a registration
- **WHEN** a CTO-role session unarchives a previously archived registration
- **THEN** it reappears in the default registration list and in export, unchanged from before it was archived

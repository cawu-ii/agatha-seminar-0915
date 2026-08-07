# admin-console Specification

## Purpose
Gives the PR partner a way to see and work registrations (view, filter, mark, resend confirmation) through a shared-password-protected console, while structurally preventing the delete and bulk-export actions the handoff doc explicitly withholds from that role.
## Requirements
### Requirement: Registrations can be viewed, searched, and filtered
The system SHALL let an authenticated admin session list registrations and filter/search by at least UTM source, UTM content, department, industry, and review status.

#### Scenario: Filter by UTM source and content
- **WHEN** an admin filters the list by `utm_source=meta` and `utm_content=wave1`
- **THEN** only registrations matching both values are shown

### Requirement: A registration can be marked reviewed
The system SHALL let an authenticated admin session mark a registration as reviewed (with an optional note), and persist that state.

#### Scenario: Mark as reviewed
- **WHEN** an admin marks a registration reviewed
- **THEN** the registration's reviewed state is persisted and reflected on next list load

### Requirement: A single registration's confirmation email can be resent
The system SHALL let an authenticated admin session trigger a resend of the confirmation email for one specific registration.

#### Scenario: Resend one email
- **WHEN** an admin triggers resend for a registration
- **THEN** exactly that registration's confirmation email is re-attempted, and no other registration is affected

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


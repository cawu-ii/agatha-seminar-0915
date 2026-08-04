## Purpose

Gives the PR partner a way to see and work registrations (view, filter, mark, resend confirmation) through a shared-password-protected console, while structurally preventing the delete and bulk-export actions the handoff doc explicitly withholds from that role.

## ADDED Requirements

### Requirement: Admin console requires a shared password
The system SHALL require a correct shared admin password before granting access to any `/admin` route, and SHALL reject access without it.

#### Scenario: No session
- **WHEN** a browser requests an `/admin` route without a valid session
- **THEN** it is redirected to a login page and no registration data is returned

#### Scenario: Correct password
- **WHEN** the visitor submits the correct admin password
- **THEN** a session is established and subsequent `/admin` requests succeed until the session expires

#### Scenario: Incorrect password
- **WHEN** the visitor submits an incorrect password
- **THEN** access is denied and no session is established

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
The system SHALL NOT expose any control in `/admin` that deletes or modifies a registration's core submitted data.

#### Scenario: Inspecting available admin actions
- **WHEN** an admin views a registration in the list
- **THEN** no delete or edit-core-fields control is present or reachable

### Requirement: The console provides no bulk export action
The system SHALL NOT expose any control in `/admin` that exports multiple registrations at once (CSV, Excel, or otherwise). Bulk export exists only outside this console, per the data-export capability.

#### Scenario: Inspecting available admin actions
- **WHEN** an admin views the registration list
- **THEN** no bulk-export/download-all control is present or reachable

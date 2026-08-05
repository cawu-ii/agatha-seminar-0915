## ADDED Requirements

### Requirement: Landing page renders partners from stored data
The system SHALL render the partners section of `/seminar/0915` (the `PartnerWall` logo grid and its detail modal) from stored partner records, ordered by their configured sort order, instead of a hardcoded list.

#### Scenario: Partner records exist
- **WHEN** the landing page is requested and one or more partners exist
- **THEN** the partner wall renders each partner's logo in sort order, and clicking a logo opens a modal with that partner's name and description

#### Scenario: No partner records exist
- **WHEN** the landing page is requested and zero partners exist
- **THEN** the partners section renders without error (an empty or minimal state), not a crash

### Requirement: Admin can create a partner
The system SHALL let an authenticated `/admin` session create a new partner with a name, description, and logo URL.

#### Scenario: Add a new partner
- **WHEN** an admin submits a new partner with name, description, and logo URL
- **THEN** the partner is persisted and its logo appears on the landing page on next load

### Requirement: Admin can edit a partner
The system SHALL let an authenticated `/admin` session edit an existing partner's name, description, or logo URL.

#### Scenario: Update a partner's description
- **WHEN** an admin updates a partner's description
- **THEN** the landing page's modal for that partner reflects the new description on next load, with no other partners changed

### Requirement: Admin can delete a partner
The system SHALL let an authenticated `/admin` session delete a partner.

#### Scenario: Remove an ended partnership
- **WHEN** an admin deletes a partner
- **THEN** it no longer appears in the admin list or on the landing page

### Requirement: Admin can reorder partners
The system SHALL let an authenticated `/admin` session change the display order of partners.

#### Scenario: Move a partner earlier
- **WHEN** an admin moves a partner up in the list
- **THEN** it renders before the partner it was moved past, both in the admin list and on the landing page

### Requirement: Partner management requires the same admin authentication as the rest of /admin
The system SHALL require a valid admin session (CTO or PR) for all partner create/edit/delete/reorder actions, with no additional role restriction beyond a valid session.

#### Scenario: No session
- **WHEN** a request to create, edit, delete, or reorder a partner is made without a valid admin session
- **THEN** the request is rejected and no change is made

#### Scenario: PR-role session
- **WHEN** a PR-role session manages partners
- **THEN** the action succeeds the same as it would for a CTO-role session

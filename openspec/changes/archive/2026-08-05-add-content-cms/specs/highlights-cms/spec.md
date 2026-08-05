## ADDED Requirements

### Requirement: Landing page renders highlights from stored data
The system SHALL render the "活動亮點" (highlights) section of `/seminar/0915` from stored highlight records, ordered by their configured sort order, instead of hardcoded content.

#### Scenario: Highlight records exist
- **WHEN** the landing page is requested and one or more highlights exist
- **THEN** the highlights section renders each highlight's title and body in sort order

#### Scenario: No highlight records exist
- **WHEN** the landing page is requested and zero highlights exist
- **THEN** the highlights section renders without error (an empty or minimal state), not a crash

### Requirement: Admin can create a highlight
The system SHALL let an authenticated `/admin` session create a new highlight with a title and body.

#### Scenario: Add a new highlight
- **WHEN** an admin submits a new highlight with title and body
- **THEN** the highlight is persisted and appears on the landing page on next load

### Requirement: Admin can edit a highlight
The system SHALL let an authenticated `/admin` session edit an existing highlight's title or body.

#### Scenario: Update a highlight's body text
- **WHEN** an admin updates a highlight's body
- **THEN** the landing page reflects the new body text on next load, with no other highlights changed

### Requirement: Admin can delete a highlight
The system SHALL let an authenticated `/admin` session delete a highlight.

#### Scenario: Remove a retired highlight
- **WHEN** an admin deletes a highlight
- **THEN** it no longer appears in the admin list or on the landing page

### Requirement: Admin can reorder highlights
The system SHALL let an authenticated `/admin` session change the display order of highlights.

#### Scenario: Move a highlight earlier
- **WHEN** an admin moves a highlight up in the list
- **THEN** it renders before the highlight it was moved past, both in the admin list and on the landing page

### Requirement: Highlight management requires the same admin authentication as the rest of /admin
The system SHALL require a valid admin session (CTO or PR) for all highlight create/edit/delete/reorder actions, with no additional role restriction beyond a valid session.

#### Scenario: No session
- **WHEN** a request to create, edit, delete, or reorder a highlight is made without a valid admin session
- **THEN** the request is rejected and no change is made

#### Scenario: PR-role session
- **WHEN** a PR-role session manages highlights
- **THEN** the action succeeds the same as it would for a CTO-role session

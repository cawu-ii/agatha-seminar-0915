# agenda-management Specification

## Purpose
Lets PR/CTO add, edit, delete, and reorder the public conference agenda from the admin console, and has the landing page render whatever the current agenda data is — replacing hardcoded agenda content that previously required an engineer to change and redeploy.
## Requirements
### Requirement: Landing page renders the agenda from stored data
The system SHALL render the agenda section of `/seminar/0915` from stored agenda items, ordered by their configured sort order, instead of hardcoded content.

#### Scenario: Agenda items exist
- **WHEN** the landing page is requested and one or more agenda items exist
- **THEN** the agenda section renders each item's time label, title, and speaker (or a break indicator for break rows) in sort order

#### Scenario: No agenda items exist
- **WHEN** the landing page is requested and zero agenda items exist
- **THEN** the agenda section renders without error (an empty or minimal state), not a crash

### Requirement: Admin can create an agenda item
The system SHALL let an authenticated `/admin` session create a new agenda item with a time label, title, optional speaker, and a break flag.

#### Scenario: Create a normal session
- **WHEN** an admin submits a new agenda item with time label, title, and speaker
- **THEN** the item is persisted and appears on the landing page on next load

#### Scenario: Create a break row
- **WHEN** an admin submits a new agenda item marked as a break, with no speaker
- **THEN** the item is persisted and rendered with the break styling/indicator, not a blank speaker field

### Requirement: Admin can edit an agenda item
The system SHALL let an authenticated `/admin` session edit an existing agenda item's time label, title, speaker, or break flag.

#### Scenario: Edit a speaker name
- **WHEN** an admin updates the speaker field on an existing agenda item
- **THEN** the landing page reflects the new speaker name on next load, with no other fields changed

### Requirement: Admin can delete an agenda item
The system SHALL let an authenticated `/admin` session delete an agenda item.

#### Scenario: Delete a cancelled session
- **WHEN** an admin deletes an agenda item
- **THEN** it no longer appears in the admin list or on the landing page

### Requirement: Admin can reorder agenda items
The system SHALL let an authenticated `/admin` session change the display order of agenda items.

#### Scenario: Move an item earlier
- **WHEN** an admin moves an agenda item up in the list
- **THEN** it renders before the item it was moved past, both in the admin list and on the landing page

### Requirement: Agenda management requires the same admin authentication as the rest of /admin
The system SHALL require a valid admin session for all agenda create/edit/delete/reorder actions, using the same authentication as the existing admin console.

#### Scenario: No session
- **WHEN** a request to create, edit, delete, or reorder an agenda item is made without a valid admin session
- **THEN** the request is rejected and no change is made


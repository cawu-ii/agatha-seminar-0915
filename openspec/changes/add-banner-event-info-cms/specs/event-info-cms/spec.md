## ADDED Requirements

### Requirement: Landing page renders the event-info facts from stored data
The system SHALL render the landing page's "活動資訊" section (the Date/Time/Venue/Access fact cards) from stored data instead of hardcoded content. The set of 4 facts and their order is fixed and is NOT affected by this requirement.

#### Scenario: Event-info data exists for all 4 facts
- **WHEN** the landing page is requested and all 4 event-info facts have stored content
- **THEN** each fact card renders its stored content in the fixed Date/Time/Venue/Access order

#### Scenario: A fact is missing stored content
- **WHEN** the landing page is requested and one of the 4 facts has no stored content (should not normally occur post-seed)
- **THEN** that fact card renders with no content rather than crashing the page

### Requirement: Admin can edit an event-info fact
The system SHALL let an authenticated `/admin` session edit the content of any of the 4 fixed event-info facts (Date, Time, Venue, Access). Each fact has a primary line, an optional second line, and an optional secondary/small line.

#### Scenario: Edit the venue
- **WHEN** an admin updates the Venue fact's content
- **THEN** the landing page reflects the new content on next load, with the other 3 facts unchanged

### Requirement: Event-info facts cannot be added or removed
The system SHALL NOT provide a way to add a 5th fact or remove one of the existing 4 facts - only their content is editable.

#### Scenario: Admin views the event-info management screen
- **WHEN** an admin views the event-info admin screen
- **THEN** exactly 4 editable facts (Date, Time, Venue, Access) are shown, with no add or delete control

### Requirement: Event-info management requires the same admin authentication as the rest of /admin
The system SHALL require a valid admin session (CTO or PR) for editing event-info facts, with no additional role restriction beyond a valid session.

#### Scenario: No session
- **WHEN** a request to edit an event-info fact is made without a valid admin session
- **THEN** the request is rejected and no change is made

#### Scenario: PR-role session
- **WHEN** a PR-role session edits an event-info fact
- **THEN** the action succeeds the same as it would for a CTO-role session

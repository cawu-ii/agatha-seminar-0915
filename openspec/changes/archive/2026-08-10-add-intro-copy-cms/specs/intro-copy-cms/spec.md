## ADDED Requirements

### Requirement: Landing page renders the intro copy from stored data

The system SHALL render the landing page's intro lead paragraph and "Who should attend" callout body from stored data instead of hardcoded copy, falling back to a sane default (today's approved wording, seeded on deploy) if a row is missing or the query fails, never crashing the page.

#### Scenario: Both blocks are stored
- **WHEN** the landing page is requested and both the `LEAD` and `ATTENDEE` rows exist
- **THEN** the page renders each block's current stored text in its existing position and styling

#### Scenario: A row is missing or the query fails
- **WHEN** the landing page is requested and a row is missing, or the database query errors
- **THEN** the rest of the page still renders (the affected block is skipped or shows its seeded default, but nothing crashes)

### Requirement: Admin can edit the intro copy blocks

The system SHALL let an authenticated `/admin` session (CTO or PR) edit the text of the intro lead paragraph and the "Who should attend" callout body, with no additional role restriction beyond a valid session - same authorization level as the rest of the content-management screens (agenda, speakers, partners, highlights).

#### Scenario: Edit the intro lead paragraph
- **WHEN** a CTO or PR session submits new text for the intro lead paragraph
- **THEN** the stored text is updated and the landing page reflects it on next load

#### Scenario: Edit the "Who should attend" callout
- **WHEN** a CTO or PR session submits new text for the "Who should attend" callout body
- **THEN** the stored text is updated and the landing page reflects it on next load

#### Scenario: No session
- **WHEN** a request to edit either block is made without a valid admin session
- **THEN** the request is rejected and no change is made

### Requirement: Exactly two fixed blocks, no add or delete

The system SHALL NOT expose any control to add, delete, or reorder intro-copy blocks - exactly the lead paragraph and the "Who should attend" callout exist, always in that fixed arrangement, same fixed-slot pattern as the four `event-info-cms` facts.

#### Scenario: Inspecting available admin actions
- **WHEN** a CTO or PR session views the intro-copy admin screen
- **THEN** exactly two editable blocks are shown, with no add or delete control for either

# speakers-cms Specification

## Purpose
TBD - created by archiving change add-content-cms. Update Purpose after archive.
## Requirements
### Requirement: Landing page renders speakers from stored data
The system SHALL render the speakers section of `/seminar/0915` from stored speaker records, ordered by their configured sort order, instead of hardcoded content.

#### Scenario: Speaker records exist
- **WHEN** the landing page is requested and one or more speakers exist
- **THEN** the speakers section renders each speaker's name, title, and bio in sort order, with a photo if `photoUrl` is set and a placeholder state if not

#### Scenario: No speaker records exist
- **WHEN** the landing page is requested and zero speakers exist
- **THEN** the speakers section renders without error (an empty or minimal state), not a crash

#### Scenario: Unconfirmed speaker
- **WHEN** a speaker record has `confirmed` set to false
- **THEN** it renders with a visibly distinct "待確認" indicator, not presented the same as a confirmed speaker

### Requirement: Admin can create a speaker
The system SHALL let an authenticated `/admin` session create a new speaker with a name, title, bio, an optional uploaded photo, and confirmed flag. The photo, if provided, SHALL be uploaded as a file (not a pasted URL) and validated against the required photo specification (520×520; exact-match-vs-minimum-size is an implementation decision, see design.md Open Question #1 - not resolved by this spec).

#### Scenario: Add a confirmed speaker with a photo
- **WHEN** an admin submits a new speaker with name, title, bio, and uploads a photo meeting the required specification, confirmed true
- **THEN** the speaker is persisted and appears on the landing page with the photo on next load

#### Scenario: Add a not-yet-confirmed speaker
- **WHEN** an admin submits a new speaker with confirmed false and no photo uploaded
- **THEN** the speaker is persisted and rendered with the "待確認" indicator, not a broken image

#### Scenario: Upload a photo that fails the required specification
- **WHEN** an admin uploads a photo that does not meet the required photo specification
- **THEN** the system SHALL either reject the upload with a clear error, or accept it with a clear warning (exact behavior is an implementation decision, see design.md Open Question #1 - not resolved by this spec)

### Requirement: Admin can edit a speaker
The system SHALL let an authenticated `/admin` session edit an existing speaker's name, title, bio, photo, or confirmed flag. Replacing the photo SHALL upload a new file, not accept a pasted URL.

#### Scenario: Confirm a previously TBD speaker
- **WHEN** an admin updates a speaker's confirmed flag to true and fills in the remaining fields
- **THEN** the landing page reflects the speaker as confirmed on next load, with no other speakers changed

#### Scenario: Replace an existing photo
- **WHEN** an admin uploads a new photo for a speaker that already has one
- **THEN** the new photo replaces the old one on the landing page on next load, and the previously stored file is removed

### Requirement: Admin can delete a speaker
The system SHALL let an authenticated `/admin` session delete a speaker.

#### Scenario: Remove a withdrawn speaker
- **WHEN** an admin deletes a speaker
- **THEN** it no longer appears in the admin list or on the landing page

### Requirement: Admin can reorder speakers
The system SHALL let an authenticated `/admin` session change the display order of speakers.

#### Scenario: Move a speaker earlier
- **WHEN** an admin moves a speaker up in the list
- **THEN** it renders before the speaker it was moved past, both in the admin list and on the landing page

### Requirement: Speaker management requires the same admin authentication as the rest of /admin
The system SHALL require a valid admin session (CTO or PR) for all speaker create/edit/delete/reorder actions, with no additional role restriction beyond a valid session.

#### Scenario: No session
- **WHEN** a request to create, edit, delete, or reorder a speaker is made without a valid admin session
- **THEN** the request is rejected and no change is made

#### Scenario: PR-role session
- **WHEN** a PR-role session manages speakers
- **THEN** the action succeeds the same as it would for a CTO-role session


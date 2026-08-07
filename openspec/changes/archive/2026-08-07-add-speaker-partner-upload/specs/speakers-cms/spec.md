## MODIFIED Requirements

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

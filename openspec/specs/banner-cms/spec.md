# banner-cms Specification

## Purpose
TBD - created by archiving change add-banner-event-info-cms. Update Purpose after archive.
## Requirements
### Requirement: Landing page renders the hero banner from stored data
The system SHALL render the landing page's hero section banner image from stored data (a desktop image and a mobile image), selecting the appropriate one for the viewport, instead of the current CSS-only hero visual.

#### Scenario: Banner images are set
- **WHEN** the landing page is requested and both a desktop and mobile banner image are stored
- **THEN** the hero section renders the desktop image on desktop viewports and the mobile image on mobile viewports

#### Scenario: No banner has been uploaded yet
- **WHEN** the landing page is requested and no banner image is stored
- **THEN** the hero section renders a sane fallback (e.g. today's CSS-only visual), not a broken image or a crash

### Requirement: Admin can upload a banner image
The system SHALL let an authenticated `/admin` session upload a desktop banner image and a mobile banner image, replacing whichever was previously stored.

#### Scenario: Upload a correctly-sized desktop banner
- **WHEN** an admin uploads an image matching the required desktop specification (2560×1440, 16:9)
- **THEN** the image is stored and appears as the hero banner on desktop viewports on next load

#### Scenario: Upload a correctly-sized mobile banner
- **WHEN** an admin uploads an image matching the required mobile specification (1080×1350, 4:5)
- **THEN** the image is stored and appears as the hero banner on mobile viewports on next load

#### Scenario: Upload an incorrectly-sized image
- **WHEN** an admin uploads an image that does not match the required dimensions for the slot (desktop or mobile) they are uploading to
- **THEN** the system SHALL either reject the upload with a clear error, or accept it with a clear warning that it may not display correctly (exact behavior is an implementation decision, see design.md Open Question #1 - not resolved by this spec)

### Requirement: Banner management requires the same admin authentication as the rest of /admin
The system SHALL require a valid admin session (CTO or PR) for uploading a banner image, with no additional role restriction beyond a valid session.

#### Scenario: No session
- **WHEN** a request to upload a banner image is made without a valid admin session
- **THEN** the request is rejected and no change is made

#### Scenario: PR-role session
- **WHEN** a PR-role session uploads a banner image
- **THEN** the action succeeds the same as it would for a CTO-role session


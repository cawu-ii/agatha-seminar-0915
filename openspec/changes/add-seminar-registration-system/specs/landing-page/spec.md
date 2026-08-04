## Purpose

Presents the 9/15 forum's event information and registration form at a stable URL, captures acquisition source (UTM), and gates marketing-tracking scripts behind consent before handing submissions to the registration API.

## ADDED Requirements

### Requirement: Landing page is served at the canonical URL
The system SHALL serve the registration landing page at `/seminar/0915`, preserving the approved copy, layout, and visual design from `agatha-seminar-landing-0803.html`.

#### Scenario: Direct visit
- **WHEN** a browser requests `/seminar/0915`
- **THEN** the page renders the hero, event facts, agenda, speakers, partners, and registration form sections with unchanged copy and styling

### Requirement: UTM parameters are captured on load
The system SHALL read `utm_source`, `utm_medium`, `utm_campaign`, and `utm_content` from the page's query string on load and make them available to the registration form submission, without requiring the user to re-enter them.

#### Scenario: Visit via a tagged link
- **WHEN** the page loads with `?utm_source=benchmark&utm_medium=edm&utm_campaign=seminar0915`
- **THEN** those three values are attached to the form submission sent to the registration API

#### Scenario: Visit with no UTM parameters
- **WHEN** the page loads with no query string
- **THEN** the form submission proceeds with empty/absent UTM fields, without blocking submission

### Requirement: Marketing tracking requires consent before loading
The system SHALL display a consent banner before any marketing-tracking script (GTM container) is injected into the page, and SHALL NOT inject that script until the visitor accepts.

#### Scenario: First visit, no prior consent
- **WHEN** a visitor loads the page for the first time
- **THEN** the consent banner is shown and no GTM script tag is present in the page

#### Scenario: Visitor accepts tracking
- **WHEN** the visitor clicks accept on the consent banner
- **THEN** the GTM script is injected and the banner is dismissed for the remainder of the session

### Requirement: Page-level and CTA events are emitted
The system SHALL push a `lp_view` event to the dataLayer when the page finishes loading (after consent) and a `cta_click` event when the primary "立即報名" call-to-action is clicked.

#### Scenario: Page view after consent
- **WHEN** the visitor has accepted tracking and the page finishes loading
- **THEN** a `lp_view` dataLayer event is pushed exactly once

#### Scenario: CTA click
- **WHEN** the visitor clicks the "立即報名" button
- **THEN** a `cta_click` dataLayer event is pushed

### Requirement: Registration form submits to the registration API
The system SHALL submit the registration form via a POST request to the registration API instead of only performing client-side validation and a local success-state toggle.

#### Scenario: Valid submission
- **WHEN** all required fields pass client-side validation and the visitor submits the form
- **THEN** the browser sends a POST request carrying the form fields, UTM values, and an idempotency key to the registration API, and does not reveal a success state until the API responds

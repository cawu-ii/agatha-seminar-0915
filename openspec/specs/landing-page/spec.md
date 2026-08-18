# landing-page Specification

## Purpose
Presents the 9/15 forum's event information and registration form at a stable URL, captures acquisition source (UTM), and gates marketing-tracking scripts behind consent before handing submissions to the registration API.
## Requirements
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

### Requirement: Marketing tracking is preceded by a dismissible notice

The system SHALL display a one-time dismissible notice about marketing-tracking scripts (GTM container) on first visit. The notice SHALL NOT gate whether the GTM script is injected - injection happens unconditionally on page load, independent of whether the visitor has seen or dismissed the notice.

#### Scenario: First visit, notice not yet dismissed
- **WHEN** a visitor loads the page for the first time
- **THEN** the notice is shown, and the GTM script tag is present in the page regardless

#### Scenario: Visitor dismisses the notice
- **WHEN** the visitor clicks the notice's single acknowledgment button
- **THEN** the notice is dismissed for the remainder of the session (and future visits, via a cookie) and does not reappear; this has no effect on whether GTM is loaded, which was already loaded before the click

#### Scenario: Returning visitor who already dismissed the notice
- **WHEN** a visitor who previously dismissed the notice loads the page again
- **THEN** the notice does not reappear, and GTM loads unconditionally as on any other page load


# thank-you-page Specification

## Purpose
Confirms a successful registration at a dedicated, shareable URL, gives the attendee a way to add the event to their calendar and return to the event page, and fires the primary conversion event for GA4/Meta without exposing personal data.
## Requirements
### Requirement: Thank-you page is served at the canonical URL
The system SHALL serve the confirmation page at `/seminar/0915/thanks`, showing the approved confirmation copy (event name, date/time, venue, review-process notice, and where to write if the confirmation email doesn't arrive).

#### Scenario: Direct visit after successful registration
- **WHEN** the browser is redirected to `/seminar/0915/thanks` following a successful `POST /api/register`
- **THEN** the page renders the confirmation copy and event details

### Requirement: No PII travels via the thank-you page URL
The system SHALL only pass non-personal identifiers (the `event_id` and UTM values) to the thank-you page via query parameters, never name/email/phone.

#### Scenario: Redirect after submission
- **WHEN** the client redirects to the thank-you page after a successful submission
- **THEN** the resulting URL contains only `event_id` and UTM parameters, no form field values

### Requirement: Attendee can add the event to their calendar
The system SHALL provide a way to add the event to the attendee's calendar (date, time, venue, title) directly from the thank-you page without requiring a third-party account.

#### Scenario: Attendee clicks add to calendar
- **WHEN** the attendee clicks the "加入行事曆" control
- **THEN** a calendar event/file is produced with the correct 9/15 13:30–16:30 date, time, and venue

### Requirement: Attendee can return to the event page
The system SHALL provide a link back to `/seminar/0915` from the thank-you page.

#### Scenario: Attendee clicks return
- **WHEN** the attendee clicks "返回活動頁"
- **THEN** the browser navigates to `/seminar/0915`

### Requirement: Thank-you page URL is the external conversion measurement point
The system SHALL keep the thank-you page's URL stable at `/seminar/0915/thanks` so that externally-configured GTM Triggers (GA4 `generate_lead` Key Event, Meta Lead event) can match against it, without the system itself pushing a conversion-specific dataLayer event.

#### Scenario: Attendee reaches the thank-you page
- **WHEN** a registration succeeds and the browser is redirected to `/seminar/0915/thanks`
- **THEN** the URL path is exactly `/seminar/0915/thanks`, matching what the externally-configured GTM Trigger expects, and the system does not push any additional conversion-specific event


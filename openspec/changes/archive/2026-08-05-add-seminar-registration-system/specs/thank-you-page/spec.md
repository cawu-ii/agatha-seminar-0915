## Purpose

Confirms a successful registration at a dedicated, shareable URL, gives the attendee a way to add the event to their calendar and return to the event page, and fires the primary conversion event for GA4/Meta without exposing personal data.

## ADDED Requirements

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

### Requirement: Primary conversion event fires on page load
The system SHALL push a `registration_submit` dataLayer event when the thank-you page loads, including the `event_id` and UTM values, and SHALL NOT include PII in that event's parameters.

#### Scenario: Page load with event_id present
- **WHEN** the thank-you page loads with a valid `event_id` query parameter
- **THEN** a `registration_submit` dataLayer event is pushed exactly once, carrying `event_id` and UTM values only

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

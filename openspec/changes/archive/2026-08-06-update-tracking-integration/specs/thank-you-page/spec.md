## REMOVED Requirements

### Requirement: Primary conversion event fires on page load
**Reason**: The 0805 handoff doc revision explicitly retires this ("本次不另外建立 `registration_submit` 事件"). GA4's Key Event (`generate_lead`) and Meta's Lead event are now configured as GTM Triggers matching this page's URL, owned by the PR agency's technical team - not pushed by this codebase.
**Migration**: See the replacement requirement below. No data or user-facing behavior changes; this only removes an application-level dataLayer push that no GTM Trigger was ever listening for (the real GTM container was never wired up before this doc revision provided one).

## ADDED Requirements

### Requirement: Thank-you page URL is the external conversion measurement point
The system SHALL keep the thank-you page's URL stable at `/seminar/0915/thanks` so that externally-configured GTM Triggers (GA4 `generate_lead` Key Event, Meta Lead event) can match against it, without the system itself pushing a conversion-specific dataLayer event.

#### Scenario: Attendee reaches the thank-you page
- **WHEN** a registration succeeds and the browser is redirected to `/seminar/0915/thanks`
- **THEN** the URL path is exactly `/seminar/0915/thanks`, matching what the externally-configured GTM Trigger expects, and the system does not push any additional conversion-specific event

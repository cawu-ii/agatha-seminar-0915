## MODIFIED Requirements

### Requirement: Event dictionary is fixed and non-PII
The system SHALL emit exactly two dataLayer event types — `lp_view` and `cta_click` — at the trigger points defined in the landing-page capability, and neither SHALL carry name, email, or phone as parameters. The GA4 Key Event (`generate_lead`) and the Meta Lead conversion event are NOT pushed by this system; they are configured externally in GTM/GA4 as a Trigger matching the thank-you page's URL (see the thank-you-page capability), owned and maintained by the PR agency's technical team, not by this codebase.

#### Scenario: Inspecting any tracking event payload
- **WHEN** either of the two events is pushed to the dataLayer
- **THEN** its parameters contain only non-personal identifiers and no name/email/phone field

#### Scenario: No custom event fires for GA4/Meta conversion tracking
- **WHEN** a visitor completes registration and reaches the thank-you page
- **THEN** the system does not push any dataLayer event specifically for conversion tracking beyond the standard page view - conversion attribution happens via GTM's own Trigger configuration, external to this codebase

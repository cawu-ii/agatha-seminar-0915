# tracking-integration Specification

## Purpose
Wires GTM/GA4/Meta Pixel behind a single consent-gated container and a fixed event dictionary, so real tracking IDs can be dropped in via configuration without further code changes, and so absent IDs never break the site.
## Requirements
### Requirement: Tracking container is configuration-driven
The system SHALL read the GTM container ID from configuration (environment variable) and SHALL NOT render the GTM script tag when that configuration is absent, instead of hardcoding or requiring a placeholder ID.

#### Scenario: No GTM ID configured
- **WHEN** the GTM container ID environment variable is unset
- **THEN** no GTM script is rendered anywhere on the site and the site otherwise functions normally

#### Scenario: GTM ID configured and consent given
- **WHEN** the GTM container ID is configured and the visitor has accepted the consent banner
- **THEN** the GTM script is injected and dataLayer events reach it

### Requirement: Event dictionary is fixed and non-PII
The system SHALL emit exactly two dataLayer event types — `lp_view` and `cta_click` — at the trigger points defined in the landing-page capability, and neither SHALL carry name, email, or phone as parameters. The GA4 Key Event (`generate_lead`) and the Meta Lead conversion event are NOT pushed by this system; they are configured externally in GTM/GA4 as a Trigger matching the thank-you page's URL (see the thank-you-page capability), owned and maintained by the PR agency's technical team, not by this codebase.

#### Scenario: Inspecting any tracking event payload
- **WHEN** either of the two events is pushed to the dataLayer
- **THEN** its parameters contain only non-personal identifiers and no name/email/phone field

#### Scenario: No custom event fires for GA4/Meta conversion tracking
- **WHEN** a visitor completes registration and reaches the thank-you page
- **THEN** the system does not push any dataLayer event specifically for conversion tracking beyond the standard page view - conversion attribution happens via GTM's own Trigger configuration, external to this codebase

### Requirement: Server-side ad-platform conversion is optional and safe by default
The system SHALL attempt to send a server-side conversion event (Meta CAPI) for each successful registration only when a CAPI access token is configured, using the same `event_id` as the client-side event for deduplication, and SHALL log-and-continue (not throw) when unconfigured or when the send fails.

#### Scenario: No CAPI token configured
- **WHEN** the CAPI access token environment variable is unset and a registration succeeds
- **THEN** no outbound CAPI request is attempted, the attempt is logged as skipped, and the registration is otherwise unaffected

#### Scenario: CAPI token configured
- **WHEN** the CAPI access token is configured and a registration succeeds
- **THEN** a CAPI request is sent carrying the same `event_id` used for the client-side `registration_submit` event


## MODIFIED Requirements

### Requirement: Tracking container is configuration-driven
The system SHALL read the GTM container ID from configuration (environment variable) and SHALL NOT render the GTM script tag when that configuration is absent, instead of hardcoding or requiring a placeholder ID. Injection no longer depends on visitor consent (see landing-page capability) - only on whether the GTM ID is configured.

#### Scenario: No GTM ID configured
- **WHEN** the GTM container ID environment variable is unset
- **THEN** no GTM script is rendered anywhere on the site and the site otherwise functions normally

#### Scenario: GTM ID configured
- **WHEN** the GTM container ID is configured and a visitor loads the page
- **THEN** the GTM script is injected unconditionally and dataLayer events reach it, regardless of whether the visitor has dismissed the landing page's notice banner

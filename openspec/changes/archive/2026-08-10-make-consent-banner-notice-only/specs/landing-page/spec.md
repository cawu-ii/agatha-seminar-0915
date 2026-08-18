## REMOVED Requirements

### Requirement: Marketing tracking requires consent before loading
**Reason**: PR agency reported GA4/Meta Ads Manager receiving almost no data - most visitors declined or ignored the opt-in gate, so GTM never loaded for them. User (CTO) confirmed switching to a non-gating notice after the compliance trade-off was explicitly presented (see proposal.md Why, design.md Risks).
**Migration**: No data migration. The consent-dismissal cookie (`agatha_tracking_consent`) is kept as-is for continuity - visitors who already dismissed the old banner won't see the new one reappear - but it no longer controls GTM injection. Replaced by "Marketing tracking is preceded by a dismissible notice" below.

## ADDED Requirements

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

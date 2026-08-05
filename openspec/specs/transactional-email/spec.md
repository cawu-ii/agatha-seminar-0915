# transactional-email Specification

## Purpose
Sends the approved confirmation email after a registration is durably recorded, through a swappable provider, without ever blocking or failing the registration itself.
## Requirements
### Requirement: Confirmation email is triggered after successful write, not before
The system SHALL only attempt to send the confirmation email after the corresponding registration row has been committed to the database, never before or independent of it.

#### Scenario: Registration succeeds
- **WHEN** a registration is successfully inserted
- **THEN** a confirmation email send is attempted using that registration's `email` and event details

### Requirement: Email provider is swappable via configuration
The system SHALL select the email provider via configuration (e.g. `EMAIL_PROVIDER`), and SHALL fall back to a log-only no-op provider when no provider is configured or no API key is present, rather than throwing an error.

#### Scenario: No email provider configured
- **WHEN** no email API key is present in configuration
- **THEN** the system logs the attempted send (recipient, event) instead of calling any external API, and does not raise an error to the caller

#### Scenario: Email provider configured
- **WHEN** a valid provider and API key are configured
- **THEN** the system calls that provider's API to send the approved confirmation copy to the registrant's email

### Requirement: Send outcome is recorded on the registration
The system SHALL record the outcome of each confirmation email attempt (pending/sent/failed) and a timestamp on the corresponding registration record, so failures are visible without inspecting logs.

#### Scenario: Send fails
- **WHEN** the email provider returns an error or times out
- **THEN** the registration's email status is set to failed and the failure does not propagate to the registrant-facing flow

### Requirement: A failed or skipped send can be retried per registration
The system SHALL provide a way to re-trigger the confirmation email for a single registration after an initial failure or when it was skipped due to missing configuration at the time.

#### Scenario: Operator retries after provider is configured
- **WHEN** an operator triggers a resend for a registration whose prior email attempt failed or was skipped
- **THEN** a new send attempt is made and the status/timestamp are updated


# registration-api Specification

## Purpose
Validates and durably records forum registrations as the single source of truth for headcount and attendee data, then fans out non-blocking side effects (confirmation email, ad-platform conversion event) without letting their failure affect the registration outcome.
## Requirements
### Requirement: Registration endpoint validates input
The system SHALL expose `POST /api/register` that validates all required form fields (per the approved form: name, company, taxid, dept, title, industry, size, email, phone, at least one session interest, stage, at least one consult topic, agree_terms) and rejects the request with a 4xx response and field-level error detail if validation fails.

#### Scenario: Missing required field
- **WHEN** a request omits a required field (e.g. `email`)
- **THEN** the API responds with a 4xx status and does not create a database record

#### Scenario: Malformed email
- **WHEN** a request's `email` field is not a valid email address
- **THEN** the API responds with a 4xx status and does not create a database record

### Requirement: Successful registration is written durably before responding
The system SHALL insert a validated registration into the database, including captured UTM values and a server-generated `event_id`, and treat that insert as the authoritative signal that the registration succeeded. The API SHALL respond 200 with the `event_id` only after the insert commits.

#### Scenario: Valid submission
- **WHEN** a request passes validation
- **THEN** a registration row is committed to the database with its UTM fields and a unique `event_id`, and the API responds 200 with `{ event_id }`

### Requirement: Duplicate submissions are deduplicated
The system SHALL accept a client-generated idempotency key with each submission and enforce uniqueness on it, so that resubmitting the same key (e.g. due to a double click or network retry) does not create a second registration row.

#### Scenario: Same idempotency key submitted twice
- **WHEN** two requests arrive with the same idempotency key
- **THEN** only one registration row exists in the database, and the second request does not error the user-visible flow

### Requirement: Downstream side effects never block or fail the registration
The system SHALL trigger confirmation-email sending and the ad-platform server-side conversion event asynchronously after the database insert succeeds, and SHALL NOT let a failure or absence of configuration in either cause the `POST /api/register` response to fail.

#### Scenario: Email provider unavailable or unconfigured
- **WHEN** the registration insert succeeds but the email integration is unconfigured or errors
- **THEN** the API still responds 200 with the `event_id`, and the failure is recorded on the registration record for later retry

#### Scenario: Ad-platform integration unavailable or unconfigured
- **WHEN** the registration insert succeeds but the ad-platform conversion integration is unconfigured or errors
- **THEN** the API still responds 200 with the `event_id`

### Requirement: No personal data leaves the process through non-durable channels
The system SHALL NOT include personally identifiable information (name, raw email, raw phone) in the `POST /api/register` response body beyond what is needed for the client to proceed, and SHALL NOT send raw PII to the ad-platform conversion integration.

#### Scenario: Response inspection
- **WHEN** the API responds to a successful registration
- **THEN** the response body contains only the `event_id` (and no name/email/phone)


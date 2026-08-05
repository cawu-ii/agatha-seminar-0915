# admin-accounts Specification

## Purpose
Gives each PR/CTO person their own login (email + password, one of two roles) instead of one password everyone shares, so access can be granted and revoked per person and sensitive actions can be attributed to whoever did them.
## Requirements
### Requirement: Login requires a valid individual account
The system SHALL authenticate `/admin` login with an email and password matched against a stored account, and SHALL reject login for accounts that are inactive.

#### Scenario: Correct credentials, active account
- **WHEN** a visitor submits the correct email and password for an active account
- **THEN** a session is established for that account and its role

#### Scenario: Correct credentials, inactive account
- **WHEN** a visitor submits correct credentials for an account marked inactive
- **THEN** login is rejected

#### Scenario: Incorrect password
- **WHEN** a visitor submits an email with an incorrect password
- **THEN** login is rejected and no session is established

### Requirement: Session carries the account's role
The system SHALL make the authenticated account's role (CTO or PR) available to route handlers and pages for that session, so role-gated features can check it.

#### Scenario: CTO-role session
- **WHEN** a CTO-role account is logged in
- **THEN** CTO-only routes/pages recognize the session as CTO-role

#### Scenario: PR-role session
- **WHEN** a PR-role account is logged in
- **THEN** CTO-only routes/pages do not treat the session as CTO-role

### Requirement: CTO can create accounts
The system SHALL let a CTO-role session create a new account with an email, name, initial password, and role.

#### Scenario: Create a PR account
- **WHEN** a CTO-role session creates an account with role PR
- **THEN** the new account can log in and is treated as PR-role

### Requirement: CTO can deactivate an account
The system SHALL let a CTO-role session deactivate an account, immediately preventing further logins with it.

#### Scenario: Deactivate after the event
- **WHEN** a CTO-role session deactivates an account
- **THEN** subsequent login attempts with that account's credentials are rejected, and any existing session for that account is no longer accepted for future requests once it re-authenticates

### Requirement: Account management is CTO-only
The system SHALL reject attempts to create or deactivate accounts from a PR-role session.

#### Scenario: PR session attempts account creation
- **WHEN** a PR-role session calls the account-creation action
- **THEN** the request is rejected and no account is created

### Requirement: Sensitive actions are logged with the acting account
The system SHALL record an audit log entry, including the acting account, for logins and for full-list export actions.

#### Scenario: Login is logged
- **WHEN** an account successfully logs in
- **THEN** an audit log entry is recorded identifying that account and the login action

#### Scenario: Export is logged
- **WHEN** a CTO-role session performs a full-list export
- **THEN** an audit log entry is recorded identifying that account, the export action, and when it happened


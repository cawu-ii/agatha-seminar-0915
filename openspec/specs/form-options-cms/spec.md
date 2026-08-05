# form-options-cms Specification

## Purpose
TBD - created by archiving change add-form-options-cms. Update Purpose after archive.
## Requirements
### Requirement: Registration form renders option-driven fields from stored data
The system SHALL render the choices for the registration form's 7 option-driven fields (`dept`, `title`, `industry`, `size`, `sessions`, `stage`, `consult`) from stored option records, ordered by their configured sort order, instead of hardcoded constants. The set of fields, their input type (radio/checkbox/dropdown), and their position on the form are NOT affected by this requirement and remain fixed.

#### Scenario: Options exist for a field
- **WHEN** the landing page is requested and one or more options exist for a given field
- **THEN** that field renders each option as a choice, in sort order

#### Scenario: A field has no options
- **WHEN** the landing page is requested and a field has zero options (should not normally occur - see "A field must always have at least one option")
- **THEN** that field renders with no selectable choices rather than crashing the page

### Requirement: Registration submission is validated against currently configured options
The system SHALL validate `POST /api/register` submissions for the 7 option-driven fields against the option values currently stored for each field at the time of the request, not a fixed list baked in at deploy time.

#### Scenario: Submission matches a currently configured option
- **WHEN** a registration is submitted with a value for an option-driven field that matches a currently stored option for that field
- **THEN** validation for that field passes

#### Scenario: Submission uses a value that is no longer configured
- **WHEN** a registration is submitted with a value for an option-driven field that does not match any currently stored option for that field (e.g. it was removed by an admin after the form was loaded)
- **THEN** the API responds with a 4xx status and does not create a database record

### Requirement: Admin can add an option to a field
The system SHALL let an authenticated `/admin` session add a new option value to any of the 7 option-driven fields.

#### Scenario: Add a new department choice
- **WHEN** an admin adds a new option value to the `dept` field
- **THEN** the option is persisted and appears as a choice on the landing page on next load, and is accepted by registration validation

### Requirement: Admin can edit an option's value
The system SHALL let an authenticated `/admin` session rename an existing option's value.

#### Scenario: Rename an industry option
- **WHEN** an admin edits an existing option's value
- **THEN** the landing page reflects the new value on next load, and previously submitted registrations that stored the old value are unaffected (their stored text does not change)

### Requirement: Admin can delete an option
The system SHALL let an authenticated `/admin` session delete an option from a field, unless it is the last remaining option for that field.

#### Scenario: Delete a retired option
- **WHEN** an admin deletes an option and at least one other option remains for that field
- **THEN** it no longer appears on the landing page or is accepted by registration validation

#### Scenario: Attempt to delete a field's last remaining option
- **WHEN** an admin attempts to delete the only remaining option for a field
- **THEN** the request is rejected with a 4xx status and the option is not deleted

### Requirement: Admin can reorder options within a field
The system SHALL let an authenticated `/admin` session change the display order of a field's options.

#### Scenario: Move an option earlier
- **WHEN** an admin moves an option up within its field's list
- **THEN** it renders before the option it was moved past, both in the admin list and on the landing page

### Requirement: Form option management requires the same admin authentication as the rest of /admin
The system SHALL require a valid admin session (CTO or PR) for all form-option create/edit/delete/reorder actions, with no additional role restriction beyond a valid session.

#### Scenario: No session
- **WHEN** a request to create, edit, delete, or reorder a form option is made without a valid admin session
- **THEN** the request is rejected and no change is made

#### Scenario: PR-role session
- **WHEN** a PR-role session manages form options
- **THEN** the action succeeds the same as it would for a CTO-role session


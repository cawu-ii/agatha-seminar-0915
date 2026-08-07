## MODIFIED Requirements

### Requirement: Landing page renders partners from stored data
The system SHALL render two separate sections on `/seminar/0915` from stored partner records, ordered within each section by their configured sort order: a **主辦單位** section showing only partners categorized `HOST`, and a **合作夥伴** section (the `PartnerWall` logo grid and its detail modal) showing only partners categorized `COORGANIZER`.

#### Scenario: Host and co-organizer partners exist
- **WHEN** the landing page is requested and at least one `HOST` and one `COORGANIZER` partner exist
- **THEN** the 主辦單位 section renders only the `HOST` partners and the 合作夥伴 section renders only the `COORGANIZER` partners, each in their own sort order

#### Scenario: No co-organizer partners exist
- **WHEN** the landing page is requested and zero `COORGANIZER` partners exist
- **THEN** the 合作夥伴 section renders without error (an empty or minimal state), not a crash; the 主辦單位 section is unaffected

#### Scenario: Co-organizer partner detail modal
- **WHEN** a visitor clicks a logo in the 合作夥伴 section
- **THEN** a modal opens with that partner's name and description, same as before this change

### Requirement: Admin can create a partner
The system SHALL let an authenticated `/admin` session create a new partner with a name, description, an uploaded logo, and a category (`HOST` or `COORGANIZER`). The logo SHALL be uploaded as a file (not a pasted URL) and validated against the required logo specification (PNG, ≥800px wide; the extent of validation - format only vs. format+width vs. also checking transparency - is an implementation decision, see design.md Open Question #2 - not resolved by this spec).

#### Scenario: Add a new co-organizing partner
- **WHEN** an admin submits a new partner with name, description, category `COORGANIZER`, and uploads a logo meeting the required specification
- **THEN** the partner is persisted and its logo appears in the 合作夥伴 section on the landing page on next load

#### Scenario: Upload a logo that fails the required specification
- **WHEN** an admin uploads a logo that does not meet the required logo specification
- **THEN** the system SHALL either reject the upload with a clear error, or accept it with a clear warning (exact behavior is an implementation decision, see design.md Open Question #2 - not resolved by this spec)

### Requirement: Admin can edit a partner
The system SHALL let an authenticated `/admin` session edit an existing partner's name, description, or logo. Replacing the logo SHALL upload a new file, not accept a pasted URL. Whether `category` can be changed after creation is an implementation decision (see design.md Open Question #3 - not resolved by this spec).

#### Scenario: Update a partner's description
- **WHEN** an admin updates a partner's description
- **THEN** the landing page's modal for that partner reflects the new description on next load, with no other partners changed

#### Scenario: Replace an existing logo
- **WHEN** an admin uploads a new logo for a partner that already has one
- **THEN** the new logo replaces the old one on the landing page on next load, and the previously stored file is removed

### Requirement: Admin can reorder partners
The system SHALL let an authenticated `/admin` session change the display order of partners within their own category (`HOST` or `COORGANIZER`); reordering does not move a partner across categories.

#### Scenario: Move a partner earlier within its category
- **WHEN** an admin moves a partner up within its category's list
- **THEN** it renders before the partner it was moved past, both in the admin list and in that category's section on the landing page, with no effect on the other category's order

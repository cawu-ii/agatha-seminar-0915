## Why

Continuing the v3 (0804) handoff doc comparison (see `add-agenda-management`'s proposal.md item 6, and `add-content-cms`'s sibling work on speakers/partners/highlights): **後台 CMS 範圍擴及...表單欄**. Today the registration form's dropdown/radio/checkbox option values (department, title, industry, company size, session interests, AI-adoption stage, consult topics) are hardcoded in `lib/form-options.ts` and shared by the client form and the server-side zod validation schema. Adding a new department option, renaming an industry, or removing a stale session topic currently needs an engineer to change code and redeploy.

**Scope, confirmed explicitly with the user before starting**: only the **option lists** (the value choices within each existing field) become admin-editable. This is deliberately **not** a full dynamic form builder — the set of fields, their order on the form, their input type (radio vs. checkbox vs. dropdown), labels, and required/optional status all stay fixed in code, same as today. PR can change "what the choices are," not "what the form looks like."

## What Changes

- New `form-options-cms` capability: `/admin/form-options` lets CTO/PR view, add, edit, delete, and reorder the option values for each of the 7 existing option-driven fields (`dept`, `title`, `industry`, `size`, `sessions`, `stage`, `consult`).
- The registration landing page's form renders these fields' choices from stored data instead of the hardcoded `lib/form-options.ts` constants.
- `POST /api/register`'s validation switches from a fixed, module-scope zod schema to one built per-request from the currently stored option lists, so a submission is only accepted if every choice it contains is currently a valid, admin-configured option.
- One-time seed migrates the current hardcoded option values (40 total across 7 fields) into the database so nothing is lost and the form doesn't go blank on first load.
- Deleting the last remaining option for a field is rejected (a field must always have at least one valid choice) - this is what keeps the dynamic validation schema well-formed, not an arbitrary restriction.

## Capabilities

### New Capabilities
- `form-options-cms`

### Modified Capabilities
(None. `registration-api`'s existing "validates input" requirement and `landing-page`'s existing "registration form submits to the registration API" requirement don't specify where the allowed option values come from - they remain true unchanged; this change adds a new requirement about that specific detail rather than rewriting an existing one, avoiding an unnecessary MODIFIED delta.)

## Impact

- New Prisma model (`FormOption`) + migration.
- New admin CRUD API (scoped per field) + one admin screen (`/admin/form-options`) covering all 7 fields - one page, not seven, matching the "option lists only" scope.
- `lib/registration-schema.ts`: `registrationSchema` (a fixed export) becomes `buildRegistrationSchema(options)`, called per-request in `app/api/register/route.ts` with freshly queried option lists.
- `components/RegistrationForm.tsx`: switches from importing static constants to receiving current option lists as a prop from `app/seminar/0915/page.tsx`.
- `lib/form-options.ts`'s constants become the seed data only (still imported by the new seed script), no longer imported by the form or the schema at runtime.
- Not affected: registration record schema/storage (still plain string columns - a later admin edit to an option list does not retroactively change already-submitted registrations' stored values), tracking, transactional email, admin-accounts, data-export, agenda-management, speakers/partners/highlights CMS.

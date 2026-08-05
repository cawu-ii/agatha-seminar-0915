## Context

See proposal.md. Current state: `lib/form-options.ts` exports 7 `as const` string-tuple constants; `lib/registration-schema.ts` builds a single module-scope `registrationSchema` zod object using `z.enum(...)` against those constants directly; `components/RegistrationForm.tsx` (a `"use client"` component) imports the same constants to render radios/checkboxes/a dropdown. All three files import the same 7 constants, so the option values and the validation are structurally guaranteed to match today - any redesign has to preserve that guarantee, just move where the values come from.

## Goals / Non-Goals

**Goals:**
- CTO/PR can add/edit/delete/reorder the choices within each of the 7 existing fields from `/admin`, without an engineer touching code or redeploying.
- The registration form and its server-side validation stay in lock-step: whatever is currently configured as valid is exactly what's offered and exactly what's accepted - never a mismatch where the form offers a choice the API then rejects, or the API accepts something no longer offered.
- Existing form field types, order, labels, and layout are preserved exactly - only where each field's *choices* come from changes.
- Launch ships the current 40 hardcoded option values as seed data so the form doesn't go blank or lose choices.

**Non-Goals (explicitly confirmed with the user before implementation):**
- Adding, removing, or reordering *fields* on the form, or changing a field's input type (radio ↔ checkbox ↔ dropdown) - this is "option lists editable," not a form builder. The 7 fields and their type stay hardcoded in `RegistrationForm.tsx`.
- Retroactively updating already-submitted `Registration` rows when an option is later renamed/removed - `Registration.dept` etc. remain plain string columns holding whatever text was submitted at the time, not a foreign key into `FormOption`. Historical accuracy of "what did this person actually pick" matters more than keeping old records in sync with a later rename.
- Any special-cased handling of the "其他" (Other) option - the paired free-text `*_other` inputs (`dept_other`, `title_other`, etc.) are already unconditionally visible in the current design (`.fother--sel { display: block }` in `globals.css`, no JS toggle), not conditionally shown when "其他" is selected. So "其他" is just an ordinary, admin-editable option value like any other; no extra plumbing needed to preserve its behavior.
- Bulk import/export of option lists (e.g. CSV upload) - the lists are short (4-9 items each), added one at a time same as agenda/speaker rows.

## Decisions

- **One `FormOption` model covering all 7 fields, distinguished by a `field` enum column, not 7 separate tables**:
  ```prisma
  enum FormOptionField {
    DEPT
    TITLE
    INDUSTRY
    SIZE
    SESSIONS
    STAGE
    CONSULT
  }

  model FormOption {
    id        String          @id @default(uuid())
    field     FormOptionField
    value     String
    sortOrder Int
    createdAt DateTime        @default(now())
    updatedAt DateTime        @updatedAt

    @@unique([field, value])
    @@index([field, sortOrder])
  }
  ```
  All 7 fields share the exact same shape (a value string + a sort position) - separate tables would be seven copies of identical CRUD logic for no benefit. `@@unique([field, value])` prevents accidentally adding the same choice twice within a field. This mirrors `AgendaItem`/`Speaker`/etc.'s pattern of one model per distinct *shape*, not one model per screen - here the 7 fields are the same shape, so they share one model, unlike speakers/partners/highlights which had genuinely different fields per entity.

- **Validation schema becomes a per-request function, not a module-scope constant**: `registrationSchema` today is built once when the module loads and reused for every request - correct only because the option values used to be compile-time constants. Once options live in the database, `app/api/register/route.ts` must query current `FormOption` rows and call a new `buildRegistrationSchema(options: Record<FieldKey, string[]>)` to construct the schema fresh per request. This is the one genuinely new piece of engineering this change requires (everything else is the same admin-CRUD-plus-DB-backed-render pattern already used three times). The alternative - keeping a static schema and validating option membership as a separate manual check - was rejected because it would duplicate validation logic and be easy to let drift out of sync with the "real" zod schema over time.

- **A field can never have zero options**: the admin DELETE endpoint rejects removing a field's last remaining option (400, not a silent no-op or a crash). This isn't an arbitrary UX restriction - `z.enum()` requires a non-empty tuple, so an empty option list would make that field's validation schema impossible to construct correctly. Guaranteeing "always ≥1" at the write path is simpler and more honest than trying to make the read path (schema-building, form-rendering) handle an empty list gracefully.

- **Registration form fetches options via a server-side query, not a client-side API call**: `app/seminar/0915/page.tsx` is already an async server component (`force-dynamic`) querying Prisma for agenda/speakers/partners/highlights; it queries `FormOption` the same way and passes the grouped values down as a prop to `RegistrationForm`, which stays `"use client"` for its own submit/validation interactivity but no longer needs to fetch or import static option constants itself.

- **One admin screen for all 7 fields, not seven**: matching the "option lists, not a form builder" scope, `/admin/form-options` shows all 7 fields' lists on one page (each with its own inline add/edit/delete/reorder, scoped by field), rather than adding 7 more nav links next to 管理議程/講者/夥伴/亮點. A single API route group parameterized by `[field]` in the URL backs all 7, rather than seven near-identical route files.

## Risks / Trade-offs

- [Building the validation schema per-request adds one extra DB query to every registration submission] → acceptable: registration submissions are low-frequency (this is a single-event landing page, not a high-throughput API), and the query is a simple indexed `findMany`. Not worth caching/memoizing for this volume.
- [An admin could rename an option to something confusing mid-campaign while ad traffic is already flowing with UTM links referencing old copy] → same class of content-editing risk as agenda/speaker text edits; visibly obvious and trivially fixable, not a system failure. Unlike UTM values (which are free text, not tied to `FormOption` at all), this only affects the finite dept/title/industry/etc. choices, not campaign tracking.
- [No audit trail on option edits] → same reasoning as agenda-management and content-cms: not registrant PII, `updatedAt` is enough for V1.

## Migration Plan

1. Add `FormOptionField` enum and `FormOption` model to `prisma/schema.prisma`, run `npx prisma migrate dev`.
2. Run a seed script that inserts all 40 current hardcoded option values (from `lib/form-options.ts`) with sequential `sortOrder` per field, so the form has full content on first load.
3. Ship `buildRegistrationSchema`, the admin CRUD routes/screen, and `RegistrationForm`'s switch to a props-driven option source in the same deploy - additive and self-contained, same as the prior three content-management changes, no partial-rollout concern.
4. No rollback complexity: admin UI lets CTO/PR fix bad data directly; reverting the code change alone restores the pre-change hardcoded option behavior since `lib/form-options.ts`'s constants aren't deleted, only no longer imported by the form/schema at runtime (kept as the seed script's data source).

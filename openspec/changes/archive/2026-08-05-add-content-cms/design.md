## Context

See proposal.md. Current state: `app/seminar/0915/page.tsx` renders hardcoded JSX for the "活動亮點" (highlights) and "講者陣容" (speakers) sections; `components/PartnerWall.tsx` is a client component with a hardcoded `PARTNERS` array. `agenda-management` already established the working pattern for this exact class of problem (content editable from `/admin`, rendered from Prisma at request time) - this change applies that same pattern to three more sections rather than inventing a new one.

## Goals / Non-Goals

**Goals:**
- CTO/PR can add/edit/delete/reorder speakers, partners, and highlight cards from `/admin` without an engineer touching code or redeploying.
- Landing page reflects changes on next load, same as agenda.
- Existing visual design (`.spk*`, `.pwall`/`.pcard`/`.pmodal*`, `.hl*` classes) is preserved exactly - only the data source changes.
- Launch ships the current hardcoded content as seed data so no section goes blank.

**Non-Goals:**
- File upload for photos/logos - no upload infrastructure exists yet (shared dependency with the deferred banner-upload item). Images are entered as a URL string; whoever manages content is responsible for getting the image hosted somewhere reachable first (ask engineering to drop it in `/public/images/`, or use an external host).
- A shared/generic "content block" abstraction across speakers/partners/highlights - the three entities have different fields and different landing-page rendering (speaker cards vs. logo wall with modal vs. highlight cards). Three small, similar CRUD implementations mirroring `agenda-management`'s pattern are clearer than one generic system built for three call sites.
- Individual per-content-type permissions - same admin session as agenda (CTO and PR both), not gated to CTO-only like `admin-accounts`/`data-export`. Content management is routine PR operational work, same framing as agenda.
- Reproducing every visual variant of the current hardcoded speaker cards pixel-for-pixel (e.g. the original has two visually distinct "not fully confirmed" states - "photo not provided yet" vs. "speaker fully TBD" with a badge). See Decisions below for how this collapses to two boolean-ish signals instead of one.

## Decisions

- **Three new Prisma models, not one generic `ContentBlock`**:
  ```prisma
  model Speaker {
    id        String   @id @default(uuid())
    name      String
    title     String
    bio       String
    photoUrl  String?
    confirmed Boolean  @default(true)
    sortOrder Int
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }

  model Partner {
    id          String   @id @default(uuid())
    name        String
    description String
    logoUrl     String
    sortOrder   Int
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
  }

  model Highlight {
    id        String   @id @default(uuid())
    title     String
    body      String
    sortOrder Int
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }
  ```
  Matches `AgendaItem`'s shape: UUID id, plain-text fields, explicit `sortOrder`, `createdAt`/`updatedAt`. A generic block table (e.g. `{ type, data: Json, sortOrder }`) was considered and rejected - it would move field validation (a speaker needs a name; a highlight doesn't have a "confirmed" flag) out of the schema and into hand-rolled per-type logic anyway, with none of the benefit since each type still needs its own admin UI and landing-page renderer.

- **Speaker's `confirmed` flag collapses two original visual states into one boolean**: the hardcoded markup today has three effective states - (a) confirmed with photo, (b) confirmed but "照片待提供" (photo not in hand yet), (c) fully unconfirmed "待確認" with a badge and generic bio. State (b) is just "confirmed with `photoUrl` null" - no new field needed, the UI shows a placeholder when `photoUrl` is empty. State (c) becomes `confirmed: false`; the admin UI still lets PR type a real title/bio for a not-yet-confirmed speaker (e.g. "優達科技 - 講者待確認"), and the landing page adds the "待確認" badge/styling whenever `confirmed` is false. This is a content simplification, not a missing feature - PR fills in whatever text makes sense per row either way.

- **Partner's `PartnerWall` component becomes prop-driven, not query-driven directly**: `PartnerWall` is `"use client"` (it needs `useState` for the logo-click modal), so it can't `await prisma` itself. `app/seminar/0915/page.tsx` (already a server component with `force-dynamic`) queries partners and passes them down as a prop, same relationship the page already has with `agendaItems`.

- **Reordering via `sortOrder` swap with up/down buttons, same as agenda**: these lists are realistically single-digit to low-double-digit in size and change infrequently; drag-and-drop is unjustified engineering effort for this list size, same reasoning `agenda-management`'s design.md already recorded.

- **Landing page queries Prisma directly at request time, `.catch(() => [])` per query**: identical pattern to the existing `agendaItems` query - a DB hiccup on one section fails safe to an empty section rather than crashing the whole page.

- **All three admin UIs live under `/admin`'s existing nav, no new permission tier**: same session as agenda management (any valid CTO or PR login, no role check in the route handlers - `middleware.ts` already gates `/api/admin/*` on "valid session exists"). Distinct from `admin-accounts`/`data-export`, which are CTO-only.

## Risks / Trade-offs

- [Photo/logo as a raw URL string means broken links are possible if the URL host disappears, and there's no validation that the URL actually points at an image] → acceptable for V1: same class of manual-content-entry risk as any other text field here; a broken image is a visibly obvious, trivially fixable content mistake, not a system failure. Revisit once real upload infrastructure exists (deferred, shared with banner upload).
- [Collapsing three visual speaker states into one `confirmed` boolean loses the ability to distinguish "confirmed, just no photo yet" from "not confirmed at all" as cleanly as the original two-class CSS did] → mitigated by keeping `photoUrl` nullable independently of `confirmed`, so both axes (confirmed vs. not, has photo vs. not) are still independently representable; only the "TBD" badge/copy is tied to `confirmed` alone, which matches the actual data (the two original TBD rows had no photo AND no confirmed name).
- [No audit trail on content edits] → same reasoning as agenda-management's design.md: public marketing copy, not registrant PII, `updatedAt` is enough for V1.

## Migration Plan

1. Add `Speaker`, `Partner`, `Highlight` models to `prisma/schema.prisma`, run `npx prisma migrate dev` to generate one migration covering all three (they ship together, no reason to split).
2. Run all three seed scripts once to populate current hardcoded content (7 speakers, 8 partners, 4 highlights) so nothing renders blank on first load.
3. Ship admin CRUD routes/screens and the landing page's switch from hardcoded JSX/array to DB-backed rendering in the same deploy - additive and self-contained, same as agenda-management, no partial-rollout concern.
4. No rollback complexity: admin UI lets CTO/PR fix bad data directly; reverting the code change alone restores the pre-change hardcoded content since it isn't deleted, only superseded.

## Why

Continuing the v3 (0804) handoff doc comparison recorded in `add-agenda-management`'s proposal.md, item 6: **後台 CMS 範圍擴及 Banner／講者／夥伴／表單欄** — agenda was the first slice of "content editable from `/admin` without an engineer redeploying." Speakers (講者陣容), partners (合作夥伴), and highlights (活動亮點) are hardcoded JSX in `app/seminar/0915/page.tsx` and `components/PartnerWall.tsx` today, same as agenda was before `add-agenda-management`. A speaker swap, a new partner logo, or a wording tweak on a highlight card currently needs an engineer.

Banner upload and the "活動資訊" (Event Info) block are explicitly **out of scope for this change** (see `add-content-cms`'s sibling backlog item, spec-only) because they need file-upload infrastructure this project doesn't have yet — bundling them in here would block the parts that don't need it.

## What Changes

- New `speakers-cms` capability: `/admin/speakers` — CRUD + reorder speaker cards (name, title, bio, photo, confirmed flag), landing page `#speakers` section renders from stored data.
- New `partners-cms` capability: `/admin/partners` — CRUD + reorder partner entries (name, description, logo), landing page `#partners` section (`PartnerWall`) renders from stored data instead of the hardcoded `PARTNERS` array.
- New `highlights-cms` capability: `/admin/highlights` — CRUD + reorder highlight cards (title, body), landing page "活動亮點" section renders from stored data.
- All three follow the exact pattern `agenda-management` established: same-session access (no new permission tier — CTO and PR both manage content, same as agenda), up/down reordering via `sortOrder`, landing page queries Prisma directly at request time, one-time seed script per entity so the current hardcoded content ships as day-one data instead of going blank.
- Photos/logos are entered as a **URL** (text field), not a file upload — this project has no file-upload/storage infrastructure yet (see the deferred banner-upload item). PR pastes a link to an already-hosted image (e.g. one the engineer uploaded to `/public/images/`, or an external host). Building real upload capability is future work shared with banner upload, not duplicated here.

## Capabilities

### New Capabilities
- `speakers-cms`
- `partners-cms`
- `highlights-cms`

### Modified Capabilities
(None. `admin-console`'s existing requirements are scoped to registration data; content management sits alongside it the same way `agenda-management` already does, not modifying its requirements.)

## Impact

- Three new Prisma models (`Speaker`, `Partner`, `Highlight`) + migration.
- Three new admin CRUD API route groups + three new `/admin/*` screens, all reachable from `/admin`'s nav alongside the existing "管理議程" link.
- `app/seminar/0915/page.tsx`: speakers and highlights sections switch from hardcoded JSX to a Prisma query, same as the agenda section already does.
- `components/PartnerWall.tsx`: switches from a hardcoded `PARTNERS` constant to a `partners` prop passed down from the server component.
- Three seed scripts migrating the current hardcoded content (7 speakers, 8 partners, 4 highlights) into the database.
- Not affected: registration API, tracking, transactional email, admin-accounts, data-export, agenda-management.

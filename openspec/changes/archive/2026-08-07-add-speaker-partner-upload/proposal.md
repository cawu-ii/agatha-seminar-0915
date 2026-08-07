## Why

QA testing (Lindy) on 2026/08/06 surfaced two gaps in the existing speakers/partners CMS: (1) both screens only accept a pasted image URL, forcing whoever manages content to host images somewhere else first, and (2) the `Partner` list is a single flat bucket, but the landing page needs to visually separate the event's two fixed hosts (今晧實業、湧現智庫) from the broader list of supporting/co-organizing partners — right now both admin and landing page treat them identically.

## What Changes

- Extend the file-upload infrastructure built earlier today for Banner (`image-size` validation, `public/uploads/` disk storage, `request.formData()` upload route) to speaker photos and partner logos, replacing the URL-paste-only fields.
- Add a `Partner.category` field (`HOST` | `COORGANIZER`) so the two fixed hosts (今晧實業、湧現智庫) are distinguishable from the rest of the partner list.
- Split the landing page's single "合作夥伴" section into two: a **主辦單位** section (hosts only) and a **合作夥伴** section (co-organizers only, i.e. everything that isn't a host).
- Admin `/admin/partners` UI reflects the same split (two managed groups within the same screen) so PR/CTO can tell at a glance which bucket a partner is in.

## Capabilities

### New Capabilities
(None - this extends two existing CMS capabilities, no new admin route or landing-page section type is introduced.)

### Modified Capabilities
- `speakers-cms`: "Admin can create a speaker" and "Admin can edit a speaker" requirements change from URL-paste to file upload for the photo.
- `partners-cms`: "Landing page renders partners from stored data" requirement changes from one undifferentiated list to two category-filtered sections; "Admin can create a partner" and "Admin can edit a partner" requirements change from URL-paste to file upload for the logo, and gain a required host/co-organizer category.

## Impact

- `prisma/schema.prisma`: `Speaker.photoUrl` handling changes (still a stored URL, but now populated by an upload route instead of manual paste); `Partner` gets a new `category` enum field + migration; seed data for the two existing partner-as-host records needs a one-time backfill to `HOST`.
- New `app/api/admin/speakers/upload/route.ts` (or similar) and `app/api/admin/partners/upload/route.ts`, reusing the Banner upload route's shape.
- `components/SpeakerTable.tsx`, `components/PartnerTable.tsx`: add file-input upload UI.
- `components/PartnerWall.tsx` and `app/seminar/0915/page.tsx`: split into two rendered sections, each fed a category-filtered partner list.
- No change to `registration-api`, `tracking-integration`, or any other already-archived capability.

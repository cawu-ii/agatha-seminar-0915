**Implemented and verified 2026-08-07.** design.md's 4 open questions were resolved with the user on 2026/08/07 (speaker photo: minimum-size floor ≥520×520; partner logo: format+width only, no transparency check; HOST category: freely editable; old-file cleanup: immediate delete, same as Banner).

## 1. Data model

- [x] 1.1 Added `PartnerCategory` enum (`HOST`, `COORGANIZER`) and `category` field to `Partner` in `prisma/schema.prisma`
- [x] 1.2 `npx prisma migrate dev` - two migrations: `20260807072324_add_partner_category`, `20260807072711_make_partner_logo_url_optional` (see 1.4)
- [x] 1.3 Updated `prisma/seed-partners.ts`: 今晧實業 backfilled to `category: HOST`, 湧現智庫 added as a new `HOST` row, all other rows `category: COORGANIZER`. Rewrote the seed to find-or-create per row by `name` (was "bail out if any row exists") so re-running it safely backfills `category` on already-seeded installs without duplicating - verified locally: `Created 1 new partner(s), backfilled category on 1 existing partner(s).`
- [x] 1.4 **Revised during implementation**: `Speaker.photoUrl` needed no schema change as planned, but `Partner.logoUrl` did - changed `String` to `String?` (nullable) so a partner can be created via the text-only form and have its logo uploaded as a second step, mirroring `Speaker.photoUrl`'s existing nullable pattern. Second migration covers this.

## 2. Upload infrastructure (extends Banner's pattern - see design.md)

- [x] 2.1 `app/api/admin/speakers/[id]/upload/route.ts` - POST, validates ≥520×520 (minimum, not exact), stores under `public/uploads/speakers/`, deletes old file on replace (skips deletion if the old URL is a pre-existing hardcoded `/images/...` seed asset, not a prior upload)
- [x] 2.2 `app/api/admin/partners/[id]/upload/route.ts` - same shape, validates PNG format + width ≥800px, stores under `public/uploads/partners/`, same old-file-is-a-seed-asset guard
- [x] 2.3 Confirmed `public/uploads/` `.gitignore` entry (directory-level) already covers the new `speakers/`/`partners/` subfolders, no change needed

## 3. Speaker admin UI

- [x] 3.1 `components/SpeakerTable.tsx`: photo URL text input replaced with a per-row file input that uploads immediately (same UX as `BannerUploader.tsx`); text fields (`photoUrl`) removed from the create/edit JSON payloads entirely - upload route is now the only way to set a photo
- [x] 3.2 Resolved: create is a two-step flow - text fields submitted first (speaker created with `photoUrl: null`), then the file-upload control appears on that row in the table for the photo, same pattern used for partners below

## 4. Partner admin UI

- [x] 4.1 `GET /api/admin/partners` still returns the full list; grouping into 主辦單位／協辦單位 happens client-side in `PartnerTable.tsx` by filtering on `category`
- [x] 4.2 `components/PartnerTable.tsx`: split into two visually distinct grouped tables ("主辦單位管理" / "協辦單位管理") within the same screen; drag-and-drop reorder scoped per group (dragging computes the correct group's list before calling `/reorder`, verified the other group's `sortOrder` is untouched)
- [x] 4.3 Create/edit form has a category `<select>`; per the confirmed decision, editable at any time (no lock)
- [x] 4.4 Logo URL text input replaced with a per-row file input using the upload route from 2.2; `logoUrl` removed from create/edit JSON payloads entirely

## 5. Landing page wiring

- [x] 5.1 `app/seminar/0915/page.tsx`: one `prisma.partner.findMany()` query, split into `hostPartners`/`coorganizerPartners` in-memory by `category`
- [x] 5.2 New「主辦單位」section added right before the existing 合作夥伴 section, reusing `PartnerWall` (same click-to-modal behavior, not a separate static display - simpler and consistent, and hosts already have a `description` field to show) - only renders when at least one host exists
- [x] 5.3 Existing `PartnerWall` now fed only `coorganizerPartners`, section heading unchanged ("合作夥伴")

## 6. Cleanup

- [x] 6.1 Updated README (內容管理章節、專案結構、CMS 圖片上傳說明) and `devlog.md` (Phase 34)
- [x] 6.2 No `DEPLOYMENT.md` change needed - confirmed `public/uploads/speakers/`／`/partners/` already fall under the existing top-level `public/uploads/` backup note added for Banner

## 7. Verification

- [x] 7.1 `npm run build` passes - new routes compiled (`/api/admin/speakers/[id]/upload`, `/api/admin/partners/[id]/upload`), `/admin/speakers`/`/admin/partners` remain static
- [x] 7.2 Uploaded a 520×520 speaker photo via direct API testing (session-cookie `fetch`, Browser pane has no file-upload capability - same limitation as Banner), confirmed appears on the landing page (`/uploads/speakers/...` `<img>` present)
- [x] 7.3 Uploaded an 800px-wide PNG partner logo (COORGANIZER) via direct API testing, confirmed appears in the 合作夥伴 section
- [x] 7.4 Verified all three failure modes: speaker photo 400×400 (below floor) → 400 with clear message; partner logo as JPEG → 400 "僅支援 PNG 格式"; partner logo PNG at 500px wide → 400 "寬度過小...需至少 800px"
- [x] 7.5 Confirmed via `getElementById('hosts')`/`getElementById('partners')` card counts: 主辦單位 section renders exactly 今晧實業＋湧現智庫 (2 cards), 合作夥伴 section renders the other 7 - no overlap
- [x] 7.6 Verified via API: reversed the two hosts' order via `/api/admin/partners/reorder`, confirmed the 7 co-organizers' `sortOrder` values were byte-for-byte unchanged before/after, then restored original host order
- [x] 7.7 Confirmed old-file cleanup: re-uploading a speaker photo left only the newest file in `public/uploads/speakers/` (`ls` before/after). **Found and fixed a related gap during verification**: `DELETE /api/admin/speakers/:id` and `DELETE /api/admin/partners/:id` deleted the DB row but never cleaned up the associated uploaded file, leaking disk space on every deletion - added the same guarded `unlink()` (skips non-upload URLs) to both DELETE handlers, verified `public/uploads/{speakers,partners}/` is empty after deleting all test records
- [x] 7.8 Confirmed unauthenticated `POST` to both new upload routes redirects to `/admin/login` (307) - existing global `middleware.ts` coverage, no route-specific auth code needed
- [x] 7.9 `grep -n "CTO"` across both upload routes and both admin table components returns nothing - full PR-role parity with every other content-management screen

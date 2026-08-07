## Context

Both `speakers-cms` and `partners-cms` (archived earlier this session) were built with the CMS-list pattern established by `agenda-management`: CTO/PR manage a plain, orderable list, and image fields (`Speaker.photoUrl`, `Partner.logoUrl`) are pasted URLs, with README explicitly flagging this as a known gap ("這個專案還沒有檔案上傳的基礎建設"). That gap closed today for Banner (`add-banner-event-info-cms`): `image-size` for dimension validation, local disk storage under `public/uploads/`, a `POST` route reading `request.formData()`. This change reuses that same upload mechanism for speakers and partners rather than inventing a second pattern.

Separately, QA (Lindy) flagged that the landing page's single "合作夥伴" wall doesn't distinguish the event's two fixed hosts (今晧實業、湧現智庫— the CTO handoff doc's own organizer list) from the broader set of co-organizing/exhibiting partners. Today's `Partner` records are an undifferentiated list; the landing page needs two visually separate sections.

## Goals / Non-Goals

**Goals:**
- Speaker photo and partner logo become real file uploads, following the exact validation/storage/cleanup shape already proven for Banner.
- Partner records carry a `category` (`HOST` | `COORGANIZER`) so the landing page can render 主辦單位 and 合作夥伴 as two independent sections from the same table.
- Existing partner CRUD (create/edit/delete/reorder) and the admin-auth requirement are otherwise unchanged.

**Non-Goals:**
- No change to `Speaker` beyond the upload mechanism — no new categorization concept for speakers.
- No change to who can manage this content (still any authenticated `/admin` session, CTO or PR — same as every other CMS screen this session).
- Not building a general-purpose "media library" — uploads stay 1:1 with the record they belong to, same as Banner.

## Decisions

- **Reuse Banner's upload route shape exactly**: `POST` with `request.formData()`, `image-size` for dimension checks, write to `public/uploads/<speakers|partners>/`, delete the old file on replace. New routes: `app/api/admin/speakers/[id]/upload/route.ts`, `app/api/admin/partners/[id]/upload/route.ts` (scoped to an existing record's id, unlike Banner's singleton — a speaker/partner must already exist before its photo/logo can be uploaded, matching how the current create form already requires the other fields first).
- **`Partner.category` is a required enum, not a boolean**: `HOST | COORGANIZER` reads more clearly in code and admin UI than an `isHost: Boolean`, and leaves room if a third category is ever needed without a breaking rename.
- **One admin screen, two visually grouped sections** (not two separate routes): `/admin/partners` stays a single page; the existing table splits into a "主辦單位" group and a "協辦單位" group, matching the single-`Partner`-model reality and avoiding a second CRUD surface for two records.

## Risks / Trade-offs

- **[Risk]** Backfilling `category` on the two existing seeded partner rows (if 今晧實業／湧現智庫 already exist as plain `Partner` rows from an earlier seed) could silently miscategorize them if the seed script isn't updated in the same change. → **Mitigation**: `tasks.md` includes an explicit check/update of `prisma/seed-partners.ts` to seed (or backfill) those two rows with `category: HOST`.
- **[Risk]** Non-exact-match dimension validation for partner logos (see Open Questions) is more permissive than Banner's hard pixel match, which could let a poorly-sized logo through. → **Mitigation**: whatever bound is confirmed, still hard-reject outside it and show the same clear required-vs-received messaging Banner uses.

## Open Questions — resolved 2026/08/07

1. **Speaker photo (520×520): exact match or minimum-size?** → **Minimum-size floor**: accept any photo ≥520×520 (both dimensions), reject smaller. Not a hard exact-match like Banner.
2. **Partner logo (透明 PNG, ≥800px 寬): how strictly enforced?** → **Format + width only**: validate MIME type is PNG and width ≥800px. No alpha-channel/transparency check — that's left to the uploader per the upload instructions text, not programmatically enforced.
3. **Is "主辦單位" category admin-editable?** → **Yes, freely editable**, same as any other field on the partner edit form. No lock; a partner's `category` can be changed between `HOST` and `COORGANIZER` at any time by CTO or PR.
4. **Old file cleanup on replace** → **Yes**, same as Banner: immediate delete of the old file on replace, no versioning.

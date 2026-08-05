## Context

See proposal.md. Current state: the hero section's visual (`app/seminar/0915/page.tsx`'s `<section className="hero">`) is built entirely from CSS gradients and inline SVG decoration plus a logo image - there is no separate "banner" raster image slot in the code today; this would be new UI, not a rewire of existing markup like every prior CMS change. The "Event Info" section (Date/Time/Venue/Access, `app/seminar/0915/page.tsx` lines ~206-249) is hardcoded JSX identical in spirit to how Highlights looked before `add-content-cms`.

**This document exists to leave a clear, actionable starting point for whoever implements this later** - it makes real architectural decisions where the answer is clear from this project's existing constraints, and explicitly flags open questions where it isn't, rather than guessing.

## Goals / Non-Goals

**Goals (once implemented):**
- CTO/PR can replace the hero banner (desktop + mobile) and edit the 4 event-info facts from `/admin`, without an engineer touching code or redeploying.
- Banner uploads are validated against the handoff doc's exact specs (desktop 2560×1440 16:9, mobile 1080×1350 4:5) before being accepted, not silently stored regardless of size/shape.
- Event Info follows the same "landing page renders from stored data, query fails safe" pattern already proven 4 times over (agenda/speakers/partners/highlights).

**Non-Goals:**
- Retrofitting speaker-photo/partner-logo fields (currently URL-paste, see `add-content-cms` design.md) onto the new upload infrastructure. Once real upload handling exists, doing this becomes easy and arguably a good follow-up - but it's out of scope for *this* change, which is scoped to what the handoff doc's checklist explicitly asks for.
- Uploading a favicon or OG-share image, even though the handoff doc mentions both in the same paragraph as banner specs (512×512 favicon, 1200×630 OG image). Only "Banner" and "活動資訊" are in this change's scope, per the task this was scoped under; favicon/OG upload would be a separate future change if requested.
- Image editing/cropping in the admin UI (e.g. an in-browser crop tool to hit the exact aspect ratio). V1 validates and rejects/accepts what's uploaded; it doesn't help PR fix a wrong-aspect-ratio image.
- Version history / rollback for the banner or event-info edits. Same reasoning as every prior CMS change: `updatedAt` is enough for V1, this is marketing copy, not registrant PII.

## Decisions

- **`Banner` and `EventInfo` are fixed-slot models, not orderable lists - a deliberate departure from the pattern used by `AgendaItem`/`Speaker`/`Partner`/`Highlight`/`FormOption`**. Those five are all "PR manages a variable-length collection" (add a speaker, remove a partner, reorder highlights). Banner and Event Info are structurally fixed: there is always exactly one active banner and exactly 4 event-info facts (Date/Time/Venue/Access always in that order, per the existing approved design) - PR edits the content of a slot, never adds or removes a slot. Modeling these as CRUD-with-reorder like the others would let an admin accidentally create 3 banners or delete the "Venue" fact, which isn't a real business operation - the schema and the admin UI should make that structurally impossible, not rely on the UI politely not offering the button.

  ```prisma
  enum EventInfoField {
    DATE
    TIME
    VENUE
    ACCESS
  }

  model EventInfo {
    id        String         @id @default(uuid())
    field     EventInfoField @unique
    line1     String         // e.g. "2026.09.15" / "13:30–16:30" / "華南銀行" / "免費參加"
    line2     String?        // second main line - only Venue uses this today ("國際會議中心")
    subText   String?        // the <small> line - e.g. "星期二" / "共 3 小時" / "台北" / "採資格審核 · 名額有限"
    updatedAt DateTime       @updatedAt
  }

  model Banner {
    id         String   @id @default("singleton")
    desktopUrl String?
    mobileUrl  String?
    altText    String   @default("")
    updatedAt  DateTime @updatedAt
  }
  ```
  `EventInfo.field @unique` guarantees exactly one row per fact - the admin PATCH endpoint updates by `field`, never creates/deletes. `Banner.id` defaulting to the literal string `"singleton"` guarantees exactly one row exists structurally (every write is an upsert against that fixed id), rather than relying on application code to "remember" not to create a second row.

- **File storage: local disk under `public/uploads/`, not cloud storage.** This project already made a deliberate, confirmed-by-management decision to run on a single EC2 instance with persistent disk rather than serverless/stateless infrastructure (see `DEPLOYMENT.md`'s "EBS not Instance Store" section) - specifically so a local file (the SQLite database) can be the source of truth. Uploaded banner images are the same class of problem and get the same answer for the same reason: no new cloud storage dependency (S3, etc.) is needed or justified for a single-event microsite. `public/uploads/` should be added to `.gitignore` (same treatment as `/exports/` - user-generated content doesn't belong in git).

  **This does interact with an already-known, already-flagged gap**: `DEPLOYMENT.md` states plainly that there is currently no backup mechanism for the SQLite file. Once uploaded images exist outside git, whatever backup strategy eventually gets set up (see `DEPLOYMENT.md`'s "資料庫是單一檔案：備份與規模限制" section) needs to cover `public/uploads/` too, not just `prisma/dev.db`. This isn't a new problem this change introduces so much as a second thing that will fall into the same existing hole - worth fixing both at once when someone gets to it.

- **Upload handling via Next.js Route Handler `request.formData()`, no new multipart-parsing dependency needed.** Next.js Route Handlers can read `multipart/form-data` natively through the standard `FormData`/`File` Web APIs - no need for `formidable`/`multer`/`busboy`. What *is* a new dependency: something to check an uploaded image's actual pixel dimensions server-side before accepting it (e.g. the `image-size` npm package) - file-extension/MIME-type checking alone doesn't verify dimensions.

## Open Questions (deliberately unresolved - decide before/during implementation)

1. **Dimension mismatch: hard reject or accept-with-warning?** The doc gives exact specs (2560×1440 / 1080×1350). Does the upload endpoint refuse anything that doesn't match exactly (simple, but may frustrate PR over a few stray pixels), refuse anything outside a tolerance band, or just warn and accept whatever's given (simplest to build, weakest guarantee of "looks right on the live page")? No existing precedent in this codebase to extend from - this needs a product decision, not an engineering guess.
2. **Server-side resize/compression on upload?** A raw 2560×1440 upload could be a large file; the hero section is above-the-fold on every landing-page visit, so upload size affects real page-load performance. Adding `sharp` to resize/compress on upload is a real (if fairly standard) increment of engineering work versus just storing whatever's uploaded and trusting PR/marketing to have already exported a web-optimized file. Depends on how much you trust that workflow discipline in practice.
3. **Old file cleanup on replace.** When a new banner is uploaded, should the previous file be deleted immediately, kept as a rollback copy, or left to accumulate (simplest, but unbounded disk growth on a persistent-disk box with no backup/cleanup story yet - see the storage decision above)?
4. **Multi-viewport preview in the admin UI.** Does `/admin/banner` need to show a rough preview of how the desktop/mobile image will actually look framed in the hero section (safe-zone guidance per the doc's "安全區置中"), or is a plain upload-and-confirm sufficient for V1? A preview is meaningfully more frontend work than every prior admin screen in this project has needed.

## Migration Plan (once implementation is greenlit)

1. Add `Banner` and `EventInfo` models, run `npx prisma migrate dev`.
2. Seed script inserts the current hardcoded Event Info content (4 rows) and leaves `Banner` with null `desktopUrl`/`mobileUrl` (there is no existing hardcoded banner image to migrate - this is genuinely new content, unlike every prior CMS change which ported existing hardcoded content forward). The landing page must render sanely with no banner set (e.g. falls back to today's CSS-only hero, or a placeholder) - this is a real launch-sequencing detail: the CMS ships before PR has necessarily uploaded a banner yet.
3. Resolve the Open Questions above (at minimum #1 and #3) before writing the upload endpoint - they affect its behavior, not just its polish.
4. Ship admin CRUD/upload routes/screens and the landing page's switch to DB-backed rendering together, same self-contained-deploy reasoning as every prior change.

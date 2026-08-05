## Why

Closing out the remaining two items from the v3 (0804) handoff doc §6.2 CMS list (議程／講者／夥伴／亮點/表單 are done, see `add-agenda-management`, `add-content-cms`, `add-form-options-cms`). Exact source text from the handoff doc:

> **6.2 後台 CMS（內容可替換）**
> 因內容會依議程與最新狀況調整，報名頁須做成可由後台編輯／上傳替換，無需改程式碼：
> 可編輯區塊：**Banner**主圖（桌面版、手機版）、議程、講者（含照片）、合作夥伴（含 logo 與介紹）、活動亮點與說明文字、**活動資訊**、報名表單欄。
> Hero 主視覺 Banner 可上傳規格：桌機 2560×1440（16:9）、手機 1080×1350（4:5），安全區置中。

And from the §9 上線前驗收 checklist: "後台 CMS 可編輯議程／講者／夥伴／內容並上傳 Hero Banner（桌 2560×1440、手機 1080×1350）", and the §12 test plan's row 2 ("後台改一筆議程／換一張 Banner → 前台即時更新、Banner 尺寸正確").

**This change is spec-only, per explicit instruction - no code is written this round.** The reason `Banner` was deferred from `add-content-cms` in the first place: it needs real file-upload infrastructure (storage, validation, dimension checking) that doesn't exist anywhere in this project yet - every prior CMS change (speakers, partners, highlights) sidesteps this by having PR paste an already-hosted image URL. `活動資訊` (Event Info) has no such blocker (it's plain text, same shape as Highlight), but is bundled into this same change since it's the one remaining §6.2 item and pairs naturally with finishing out the CMS checklist - not because it shares a technical dependency with Banner.

## What Changes (once implemented - not this round)

- New `banner-cms` capability: `/admin/banner` lets CTO/PR upload a desktop and mobile hero banner image; the landing page's hero section renders whichever is currently stored, per viewport.
- New `event-info-cms` capability: `/admin/event-info` lets CTO/PR edit the 4 "活動資訊" fact cards (Date/Time/Venue/Access) currently hardcoded in `app/seminar/0915/page.tsx`.
- Both follow the established CTO/PR-shared-session pattern (no CTO-only gate, same as agenda/speakers/partners/highlights/form-options).
- Unlike every prior content-management change, these are **fixed-slot content, not orderable lists** - there are always exactly 4 event-info facts and exactly one active banner (desktop + mobile pair); there's no "add a new one" or "delete this one" action, only "edit this specific slot." See design.md for why this is a different shape from the CRUD-list pattern used so far.

## Capabilities

### New Capabilities (specified, not implemented)
- `banner-cms`
- `event-info-cms`

### Modified Capabilities
(None yet - no code changes in this round.)

## Impact (once implemented)

- Two new Prisma models (`Banner`, `EventInfo`) - both effectively singleton/fixed-row tables, not growable lists.
- New file-upload handling in a Next.js Route Handler (`request.formData()`, no new parsing library needed) - this project's **first** real file upload; everything so far (speaker photos, partner logos) is a pasted URL.
- New dependencies likely needed: an image-dimension-checking library (e.g. `image-size`) to validate uploads against the doc's exact specs (2560×1440 desktop, 1080×1350 mobile); optionally `sharp` if server-side resize/compression is decided on (see design.md open questions - not decided in this round).
- Uploaded files need a storage location and a backup/deploy story - this project runs on a single EC2 with persistent disk (see `DEPLOYMENT.md`), so local disk under `public/uploads/` is the natural fit (no new cloud storage dependency), but this interacts with the *already-flagged, still-unresolved* "no backup mechanism" gap in `DEPLOYMENT.md` - uploaded banner files would need to be included in whatever backup strategy eventually gets set up, not just the SQLite file.
- `app/seminar/0915/page.tsx`: hero section's image source and the Event Info fact cards switch from hardcoded to DB-backed, same `force-dynamic` pattern already in place.
- Not affected: registration API, tracking, transactional email, admin-accounts, data-export, agenda-management, speakers/partners/highlights CMS, form-options CMS.

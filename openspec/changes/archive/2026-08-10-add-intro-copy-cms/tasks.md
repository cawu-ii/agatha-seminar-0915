## 0. Design decisions (resolved 2026/08/10)

- [x] 0.1 Bold-span handling: support `**bold**` markup syntax, parsed to `<strong>` on render
- [x] 0.2 "Who should attend" eyebrow label: stays fixed, not editable

## 1. Data model

- [x] 1.1 Added `IntroCopyField` enum + `IntroCopy` model to `prisma/schema.prisma`
- [x] 1.2 `npx prisma migrate dev` — migration `20260810072130_add_intro_copy`, applied locally
- [x] 1.3 `prisma/seed-intro-copy.ts` seeding today's exact existing wording (LEAD + ATTENDEE, bold span converted to `**...**`) + `npm run seed:intro-copy` script entry

## 2. Backend

- [x] 2.1 `app/api/admin/intro-copy/route.ts` (GET) — session gating comes from the existing global `middleware.ts` covering all `/api/admin/:path*`, same as `event-info`'s GET route (no redundant per-route check)
- [x] 2.2 `app/api/admin/intro-copy/[field]/route.ts` (PATCH by field) — rejects unknown field names (400) and empty body (400)

## 3. Admin UI

- [x] 3.1 `app/admin/intro-copy/page.tsx` + `components/IntroCopyTable.tsx` — two edit forms (lead paragraph, attendee callout body only, no field for the eyebrow label); attendee field has help text under it: `用 **文字** 讓文字變粗體，其他符號不會被特殊處理`
- [x] 3.2 `app/admin/page.tsx`: added "管理內文" nav link

## 4. Landing page

- [x] 4.1 `app/seminar/0915/page.tsx`: replaced the two hardcoded JSX blocks with a DB query through `renderWithBold()` (`lib/render-bold.tsx`), fail-safe to `INTRO_COPY_FALLBACK` (identical wording to the seed) on error/missing row

## 5. Verification

- [x] 5.1 `npm run build` passes; `/admin/intro-copy`, `/api/admin/intro-copy`, `/api/admin/intro-copy/[field]` all compiled
- [x] 5.2 Confirmed landing page renders byte-identical wording immediately after seeding, before any edit
- [x] 5.3 Verified via direct API calls against the real dev server (same endpoints the UI calls - the Browser pane's form-submit interaction was unreliable this session, same issue noted earlier today): logged in as CTO, `PATCH .../LEAD` with a `**bold**` test string → 200 → reloaded landing page → new text present, `<strong>` correctly wraps the bold span. Reactivated a deactivated PR test account, `PATCH .../ATTENDEE` as PR → 200, confirming no extra role restriction beyond a valid session
- [x] 5.4 Unauthenticated GET and PATCH both → 307 (redirected to login by the existing global middleware, consistent with every other `/api/admin/*` route)
- [x] 5.5 Confirmed via code inspection + the rendered admin page: exactly 2 blocks shown, no add/delete control for either (route only supports GET/PATCH, no POST/DELETE handler exists)
- [x] 5.6 Set `LEAD` to text containing one unmatched `**` (no closing pair) - confirmed it renders as literal `**` text on the landing page, no `<strong>` produced, nothing dropped
- [x] 5.7 Deleted all `IntroCopy` rows to simulate the missing-data case - landing page still rendered fully (hero, banner, rest of page), both blocks fell back to `INTRO_COPY_FALLBACK`'s wording, bold still rendered correctly in the fallback text
- Cleanup: re-ran `seed:intro-copy` to restore the original rows, deactivated the reactivated PR test account again, removed all scratch request-body files

## 6. Cleanup

- [x] 6.1 Updated README (`/admin` 操作說明 new subsection, `.env`/專案結構 references, 專案進度追蹤表) and devlog with the final implementation and both resolved open questions
- [x] 6.2 `openspec validate add-intro-copy-cms --strict` passed, archived as `2026-08-10-add-intro-copy-cms`

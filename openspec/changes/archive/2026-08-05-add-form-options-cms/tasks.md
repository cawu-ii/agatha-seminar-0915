## 1. Data model

- [x] 1.1 Add `FormOptionField` enum and `FormOption` model to `prisma/schema.prisma`
- [x] 1.2 `npx prisma migrate dev` (migration `20260805053917_add_form_options`)
- [x] 1.3 `prisma/seed-form-options.ts` - idempotent (same guard pattern as other seeds), inserts all 40 current values from `lib/form-options.ts` with sequential `sortOrder` per field; added `npm run seed:form-options`

## 2. Validation schema

- [x] 2.1 `lib/registration-schema.ts`: replaced the module-scope `registrationSchema` export with `buildRegistrationSchema(options: FormOptionsByField)`, keeping every non-option field (name/company/taxId/email/phone/agreeTerms/agreeMarketing/utm_*) identical to before
- [x] 2.2 `app/api/register/route.ts`: queries current `FormOption` rows via `loadFormOptions()`, calls `buildRegistrationSchema(...)`, then `.safeParse(body)` - replacing the static import; wrapped in try/catch (500 on DB failure, distinct from a validation 4xx)

## 3. Admin API

- [x] 3.1 `app/api/admin/form-options/route.ts` (GET - all options across all 7 fields, for the admin screen to render in one call)
- [x] 3.2 `app/api/admin/form-options/[field]/route.ts` (POST - add an option to that field; validates `field` against the known enum via `parseFormOptionField`)
- [x] 3.3 `app/api/admin/form-options/[field]/[id]/route.ts` (PATCH - rename; DELETE - remove, rejecting the field's last remaining option with 400)
- [x] 3.4 `app/api/admin/form-options/[field]/[id]/move/route.ts` (POST - reorder within that field)

## 4. Admin UI

- [x] 4.1 `components/FormOptionsTable.tsx` - one client component covering all 7 fields (each with its own inline list + add form + move/delete), not 7 separate screens
- [x] 4.2 `app/admin/form-options/page.tsx`
- [x] 4.3 Added "管理表單選項" link to `app/admin/page.tsx`, visible to both roles (no `isCto` gate)

## 5. Landing page + form

- [x] 5.1 `app/seminar/0915/page.tsx`: queries `FormOption` grouped by field via `loadFormOptions()` (`.catch()` falls back to all-empty-arrays per the established fail-safe pattern), passes grouped values into `<RegistrationForm options={...} />`
- [x] 5.2 `components/RegistrationForm.tsx`: switched from importing `lib/form-options.ts` constants to reading `props.options.{dept,title,industry,size,sessions,stage,consult}`; field types/order/labels unchanged

## 6. Cleanup

- [x] 6.1 Updated README (新增章節、專案結構、測試步驟補 seed 指令、v3 更新對照表、專案進度追蹤) and `devlog.md`; updated `DEPLOYMENT.md`'s seed-script list and checklist

## 7. Verification

- [x] 7.1 `npm run build` passes
- [x] 7.2 Seeded all 40 options, confirmed the registration form renders identically to the hardcoded version it replaces (all 7 fields, same choices, same order) via browser `read_page`
- [x] 7.3 Submitted a full registration through the actual rendered form in the browser (filled every required field, triggered the real submit handler) - succeeded and redirected to `/thanks` with a real `event_id`, proving the dynamic schema and the rendered form stay in lock-step
- [x] 7.4 CRUD + reorder verified via direct API calls with a real CTO session cookie (not just code reading): deleted 3 of 4 `SIZE` options, restored them (re-add + reorder via the move endpoint), confirmed final order exactly matches the original seed order; admin UI screen also confirmed rendering all 7 fields with working add/edit/delete/move controls
- [x] 7.5 Submitted a registration with a value (`size: "50人以下"`) that had just been deleted from its option list - API responded 400 with a field-level `Invalid enum value` error, not a 500 or a silent accept
- [x] 7.6 Attempted to delete a field down to zero options (`SIZE`'s last remaining value after deleting the other 3) - rejected with 400 (`此欄位至少要保留一個選項，無法刪除最後一個`), option not deleted
- [x] 7.7 Unauthenticated `curl` request to `/api/admin/form-options` and `/admin/form-options` both confirmed rejected (307 redirect via existing `middleware.ts` coverage)
- [x] 7.8 Code-inspection check that none of the new admin route handlers (`form-options`, `form-options/[field]`, `form-options/[field]/[id]`, `.../move`) gate on `role === "CTO"` - confirmed PR-role parity with agenda/speakers/partners/highlights by construction, same as `add-content-cms`

**Testing note**: test data cleanup after 7.3/7.5 - deleted the one successfully-created test `Registration` row (`test@example.com`); the rejected stale-value submission (`stale@example.com`) never created a row so nothing to clean up there. `SIZE` field option IDs are new after the delete/restore cycle in 7.4 (values and order match exactly, but `FormOption.id` differs from the original seed) - this is expected and harmless since `Registration.size` stores plain text, not a foreign key into `FormOption` (see design.md).

## Context

See proposal.md for the exact source text this is grounded in. Current state: `lib/gtm.ts` defines a `DataLayerEvent` union of three events (`lp_view`, `cta_click`, `registration_submit`); `components/ThanksTracker.tsx` pushes `registration_submit` once on the thanks page's mount; `components/LpViewTracker.tsx` and `components/CtaLink.tsx` push the other two. `GtmLoader.tsx` already reads the container ID from `NEXT_PUBLIC_GTM_ID` and no-ops when unset — this was built config-driven from the start specifically so a real ID could be dropped in later without a code change (see the original `tracking-integration` spec's Purpose line), and that design already holds up unchanged for this update.

## Goals / Non-Goals

**Goals:**
- Align the event dictionary with what the 0805 doc actually specifies: `generate_lead` (GA4 Key Event) and Meta's Lead event are GTM-side triggers matching the thanks-page URL, not events our code pushes.
- Remove the now-pointless `registration_submit` push rather than leave dead code that implies a wiring that doesn't exist.
- Fix the "Agentic" copy discrepancy found while doing the line-by-line comparison, since it directly touches the same confirmation-email/thanks-page text this change is already reviewing.

**Non-Goals:**
- Actually configuring the `generate_lead` GTM Trigger, the GA4 Key Event flag, or the Meta Pixel Tag - that's explicitly 鼎東's job per §5.1/§6.9, done in the GTM/GA4/Meta Business Manager UIs, not in this codebase.
- Setting `NEXT_PUBLIC_GTM_ID`/`NEXT_PUBLIC_GA4_ID` to their real values in any deployed `.env` - that's a deployment action for whoever manages the production environment (see DEPLOYMENT.md), not a code change. This proposal documents that real values now exist; it doesn't set them anywhere.
- SPF/DKIM/DMARC DNS records for the confirmation-email sending domain - a DNS/ops task outside this codebase, tracked in README's 待確認事項.
- Removing `lp_view` - the 0805 doc doesn't mention it and doesn't forbid it; it's an existing, working, harmless signal. Removing something the doc never asked to be removed would be scope creep dressed up as "keeping in sync with the doc."

## Decisions

- **Retire `registration_submit` entirely rather than keep pushing it as a harmless extra event.** Considered: leave the push in place since an unused dataLayer event costs nothing at runtime. Rejected: it actively misleads whoever reads this codebase later (including 鼎東 during their GTM Preview testing, per §12 test #10 - "確認同一次測試報名 Database／GA4／Meta 事件皆只產生一次") into thinking there's a code-side event feeding GA4's conversion tracking, when the doc is explicit that the real conversion signal is a GTM Trigger matching the Thanks Page URL. Dead code that looks load-bearing is worse than no code.
- **`thank-you-page`'s conversion-event requirement is REMOVED + ADDED, not MODIFIED.** The old requirement ("push `registration_submit` on load") and the new one ("the URL itself is the measurement point, configured externally") aren't a reworded version of the same behavior - the mechanism moved from "our code does X" to "our code does nothing extra, an external system watches for a URL pattern." Trying to force that into a MODIFIED delta while preserving the old scenario name (per the exact-match lesson learned during `add-admin-accounts`'s archiving) would produce a confusing scenario that no longer describes real behavior. REMOVED + ADDED states plainly what happened: this requirement doesn't apply anymore, here's what replaced it.
- **`tracking-integration`'s event-dictionary requirement stays MODIFIED, not REMOVED + ADDED.** Unlike thank-you-page's case, "the event dictionary is fixed and non-PII" is still true and still the right frame - only its contents (3 events → 2 events + a note about externally-configured ones) changed. The existing scenario "Inspecting any tracking event payload" is kept (reworded to describe 2 events, not 3), matching the pattern that worked for `admin-console`'s spec fix during the same lesson.
- **Fix the "Agentic" wording in the same change, not a separate one.** It's a one-line-per-file text fix directly inside the confirmation-email/thanks-page copy this change is already touching for the `registration_submit` removal (`app/seminar/0915/thanks/page.tsx`) or immediately adjacent to it (`lib/integrations/email.ts`, `components/AddToCalendar.tsx`). Splitting it into its own change would be process overhead for a 3-line fix discovered as a side effect of the required line-by-line doc comparison.

## Migration Plan

1. Update `lib/gtm.ts`'s `DataLayerEvent` union (drop `registration_submit`).
2. Delete `components/ThanksTracker.tsx`; remove its import/usage from `app/seminar/0915/thanks/page.tsx`.
3. Fix the "Agentic" wording in `app/seminar/0915/thanks/page.tsx`, `components/AddToCalendar.tsx`, `lib/integrations/email.ts`.
4. Update README: role/responsibility table (鼎東 now owns GTM/GA4 Tag/Meta Pixel), `.env` table (real GTM/GA4 ID values now known, still not set here), 待確認事項 (SPF/DKIM/DMARC), event-dictionary description.
5. No database/schema changes, no migration needed.

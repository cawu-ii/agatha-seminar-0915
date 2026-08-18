## Context

Current state: `components/GtmLoader.tsx` only injects the GTM container after `hasTrackingConsent()` is true (a cookie set only by clicking "我同意" in `components/ConsentBanner.tsx`, or by the `agatha:consent-granted` event it dispatches). This was built deliberately per the CTO handoff doc's privacy requirements, and reconfirmed the same day (2026/08/10, devlog Phase 41) as working-as-intended after Lindy separately reported it looking "broken" - it wasn't broken, it was gating correctly, and most visitors simply weren't clicking accept.

That same fact - most visitors decline or ignore the banner - is now the actual complaint: GA4/Meta Ads Manager see almost no traffic because the gate does its job too well from a data-collection standpoint. The user (CTO) was asked to choose between (a) keeping the real gate but making the accept button more visually prominent, or (b) removing the gate entirely and turning the banner into a dismissible notice, matching a reference screenshot Lindy provided (a generic e-commerce site's "本網站中使用 cookie...我知道了" notice, which has no functional decline path). **The user chose (b)**, after the compliance trade-off was stated explicitly in the option text.

## Goals / Non-Goals

**Goals:**
- GTM (and therefore GA4/Meta, whichever Tags PR configures inside the GTM container) fires on every page load, unconditionally, so ads platforms actually receive traffic data.
- The notice banner is visually prominent (addresses Lindy's literal ask: "不要做成被忽略也行的形式" / "don't make it something that can be ignored").
- No naming in the codebase implies real consent is still being gated on, once it isn't - `hasTrackingConsent`/`grantTrackingConsent` get renamed to reflect what they now actually do.

**Non-Goals:**
- Re-litigating whether this is the right call from a legal/compliance standpoint - that decision was made by the user, not by this document. This document implements it, and records that the trade-off was surfaced before implementation (proposal.md's Why section).
- A real cookie-preferences center / granular consent management platform. Out of scope; this is a single dismissible notice, same complexity level as before.
- Changing what happens inside the GTM container itself (which Tags/Triggers PR's agency configures) - out of this codebase's control per `tracking-integration`'s existing scope.

## Decisions

- **`GtmLoader` injects unconditionally on mount** (still no-ops if `NEXT_PUBLIC_GTM_ID` is unset - that part of the existing behavior is unrelated to consent and stays). No `useEffect` dependency on any cookie or event anymore; `CONSENT_GRANTED_EVENT` and the event-dispatch wiring in `ConsentBanner` are removed entirely rather than kept-but-unused, since dead event-plumbing left behind purely for optics would misrepresent the design to the next person reading the code.

- **`lib/gtm.ts` renamed**: `hasTrackingConsent()` → `hasNoticeBeenDismissed()`, `grantTrackingConsent()` → `dismissNotice()`, `CONSENT_COOKIE` value stays the same cookie name for continuity (visitors who already dismissed the old banner don't see it reappear) but its meaning is now purely "seen the notice," documented as such in a comment at the declaration site. Renaming rather than keeping the old names is deliberate: code that still says `hasTrackingConsent` after this change would actively mislead the next engineer into thinking tracking is still gated on it.

- **Banner becomes single-button, no decline path.** The "僅使用必要功能" button is removed rather than kept-as-a-no-op - a decline button that doesn't actually decline anything is a dark pattern in its own right (implies a choice that isn't real), worse than not offering the choice at all. The remaining button reads "我知道了" and is styled larger/primary (see Risks below for the specific CSS change).

- **Banner copy is otherwise unchanged** - the existing text ("本網站使用行銷追蹤技術...個人資料不會進入網址或廣告事件。詳見《隱私權政策》。") already reads as a neutral notice rather than an explicit opt-in ask, so it doesn't need rewording for the new single-button shape. Not in scope: verifying the linked 隱私權政策 itself still accurately describes the new behavior - that's a legal/content question for whoever owns that page, flagged in tasks.md but not resolved here.

## Risks / Trade-offs

- [Risk] Real compliance/legal exposure for any visitor covered by a jurisdiction requiring genuine prior consent before tracking (e.g., GDPR-style regimes) - this banner no longer provides that. → Mitigation: this is a business decision made explicitly by the user after the trade-off was stated, not something engineering can mitigate technically; recorded in proposal.md's Why section as the paper trail. If this becomes a real problem later, reverting is straightforward (git history has the prior gated implementation).
- [Risk] Anyone reading `lib/gtm.ts` before this change's naming lands, or any external doc/README section not updated in lockstep, could still describe this as "consent-gated" after it no longer is → Mitigation: README's tracking-integration description and the 待確認事項 section get updated in the same change (tasks.md), not left for later.

## Migration Plan

No data migration. Purely a behavior + naming change, deployed like any other code-only change (`git pull && npm install && npm run build && pm2 restart`). No new env vars.

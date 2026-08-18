## Why

Lindy (PR agency, 鼎東) reports GA4/Meta Ads Manager are recording very little data. Root cause: the consent banner is a real opt-in gate (GTM only loads after "我同意" is clicked), and most visitors click the "僅使用必要功能" decline button instead by habit, so GTM/Meta never load for them at all. She asked for the banner to default users toward acceptance; after flagging the compliance trade-off, the confirmed direction is to make the banner a dismissible notice rather than a real gate - GTM loads unconditionally on page load, the banner is purely informational.

**This intentionally reverses a previously deliberate privacy-first design decision** (the original opt-in gate was built specifically to satisfy the CTO handoff doc's privacy requirements and reconfirmed as intentional, not a bug, earlier the same day - see devlog Phase 41). CTO explicitly confirmed this direction via `AskUserQuestion`, after the trade-off (removing the visitor's real ability to opt out, potential compliance exposure in jurisdictions with visitors covered by GDPR-style consent requirements) was laid out - recorded here rather than acted on silently.

## What Changes

- **BREAKING (behavior)**: GTM now injects unconditionally on every page load, regardless of whether the visitor has seen or dismissed the notice banner.
- The banner becomes a single-button dismissible notice ("我知道了"), not a two-choice accept/decline control. Removing the "僅使用必要功能" decline button, since it no longer does anything different from "我知道了" - keeping a non-functional decline button would be actively misleading.
- The accept/acknowledge button is made visually prominent (larger, primary styling, harder to miss) - addresses the "the current button is easy to overlook" part of the ask independent of the gating change.
- The dismissal cookie is repurposed from "has the visitor consented to tracking" to "has the visitor dismissed the notice" - it no longer controls whether GTM loads, only whether the banner reappears.

## Capabilities

### Modified Capabilities
- `landing-page`: "Marketing tracking requires consent before loading" requirement changes from a real gate to "banner is shown once, dismissible, does not block tracking."
- `tracking-integration`: "Tracking container is configuration-driven" requirement's scenario tying injection to consent acceptance is removed; injection now depends only on the GTM ID being configured.

## Impact

- `components/ConsentBanner.tsx`: single button, no decline path.
- `components/GtmLoader.tsx`: drops the consent check, injects unconditionally (still no-ops if `NEXT_PUBLIC_GTM_ID` is unset).
- `components/LpViewTracker.tsx`: `lp_view` was also gated on the same consent event (`CONSENT_GRANTED_EVENT`, now removed) - fires unconditionally on mount too, matching GTM's new unconditional injection. Found while implementing, not caught during initial impact analysis - see devlog for how this was caught (the build would have failed on the now-removed `CONSENT_GRANTED_EVENT` import otherwise).
- `lib/gtm.ts`: `grantTrackingConsent`/`hasTrackingConsent` renamed/repurposed to reflect "notice dismissed," not "consent granted" - naming should not lie about what the flag now means.
- `app/globals.css`: `.consentbar` button styling made more prominent.
- No database or API changes.

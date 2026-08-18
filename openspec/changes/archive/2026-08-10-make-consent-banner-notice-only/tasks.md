## 0. Decision (resolved 2026/08/10)

- [x] 0.1 User (CTO) confirmed via `AskUserQuestion`, after the compliance trade-off was stated explicitly: switch from a real opt-in gate to a dismissible notice-only banner, not just a more-prominent accept button.

## 1. Tracking injection

- [x] 1.1 `components/GtmLoader.tsx`: injects unconditionally on mount, dropped the consent-cookie check and the `CONSENT_GRANTED_EVENT` listener entirely (still no-ops if `NEXT_PUBLIC_GTM_ID` unset)
- [x] 1.2 `lib/gtm.ts`: renamed `hasTrackingConsent()` → `hasNoticeBeenDismissed()`, `grantTrackingConsent()` → `dismissNotice()`; `CONSENT_COOKIE`'s cookie name kept unchanged for continuity, doc comment updated to describe what it now means
- [x] 1.3 (found during implementation, not in original impact list) `components/LpViewTracker.tsx` also depended on `CONSENT_GRANTED_EVENT`/`hasTrackingConsent` - would have broken the build once those were removed. Updated to fire `lp_view` unconditionally on mount, same treatment as GtmLoader

## 2. Banner UI

- [x] 2.1 `components/ConsentBanner.tsx`: removed the "僅使用必要功能" decline button and its handler entirely; single "我知道了" button calls `dismissNotice()` and hides the banner
- [x] 2.2 `app/globals.css` `.consentbar`: acknowledgment button made visually prominent (`.consentbar__ack`: 14px/32px padding, 15px/700 weight, green box-shadow vs. the old 10px/20px 13.5px two-button bar)

## 3. Verification

- [x] 3.1 `npm run build` passes
- [x] 3.2 Fresh session (no cookie), real `next start` production build (not dev - dev mode's React Strict Mode double-invokes effects and produced a misleading false negative on `lp_view`, see note below), local `NEXT_PUBLIC_GTM_ID` temporarily set to the real production container ID (`GTM-M6P5QTRM`): confirmed `gtm-script` tag present and `gtm.js`/`gtm.dom`/`gtm.load` dataLayer events fire immediately on load, with zero interaction with the banner
- [x] 3.3 Confirmed the banner shows on first visit with exactly one button ("我知道了"); clicking it sets the `agatha_tracking_consent` cookie and hides the banner (verified via `getComputedStyle` timing - the DOM update lands a tick after the click, checking synchronously in the same script as the click can show a false "still visible" reading)
- [x] 3.4 Reload after dismissing: banner does not reappear, `gtm-script` tag still present (unconditional injection unaffected by dismissal state)
- [x] 3.5 Visual check via `getComputedStyle`: button is 15px/700 weight/14px×32px padding with a visible box-shadow, vs. the prior 13.5px/10px×20px two-button bar - confirmed more prominent
- Dev-mode false negative note: `npm run dev` showed `lp_view` missing from `dataLayer` after the mount-time changes (1.1–1.3), which looked like a real regression at first. Isolated to a React 18 Strict Mode dev-only artifact (effects double-invoked) by reproducing the exact same fresh-session flow against a real `next build && next start` server, where `lp_view` appeared correctly and in the right order (`gtm.js`, `lp_view`, `gtm.dom`, `gtm.load`). Also confirmed the *old* click-triggered flow exhibited the same theoretical race (both listeners firing synchronously off one `dispatchEvent` call) by testing accept-click on production before this change - it worked there too, for the same reason production doesn't double-invoke effects. Recorded so this doesn't get "fixed" again by someone testing only in dev.
- [x] 3.6 Confirmed `lp_view` still fires exactly once per session (sessionStorage flag persisted correctly across a reload within the same tab)

## 4. Cleanup

- [x] 4.1 Restored local `.env`'s `NEXT_PUBLIC_GTM_ID` to empty after testing (temporarily set to the real container ID for verification only), rebuilt, stopped the extra local production server used for step 3.2/3.5
- [x] 4.2 Updated README (與原型 HTML 差異 tracking row, 追蹤事件字典 section, 待確認事項, 專案進度追蹤表) and devlog with the final implementation, explicitly recording that this reverses the Phase 41 "working as designed" conclusion at the user's confirmed direction
- [x] 4.3 `openspec validate make-consent-banner-notice-only --strict` passed, archived as `2026-08-10-make-consent-banner-notice-only`

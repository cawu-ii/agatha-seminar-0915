// GA4's Key Event (generate_lead) and Meta's Lead event are configured as
// GTM Triggers matching the thank-you page's URL, owned by the PR agency's
// technical team - not pushed from here (openspec: update-tracking-integration).
export type DataLayerEvent = { event: "lp_view" } | { event: "cta_click" };

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/** Pushes to window.dataLayer. Safe no-op if GTM was never injected (no GTM ID configured). */
export function pushDataLayerEvent(event: DataLayerEvent): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

// 2026/08/10 (openspec: make-consent-banner-notice-only): GTM now injects
// unconditionally regardless of this flag - it no longer gates tracking,
// only whether the notice banner reappears. Cookie name kept unchanged so a
// visitor who already dismissed the old (gating) banner doesn't see the new
// one pop back up.
export const CONSENT_COOKIE = "agatha_tracking_consent";

export function hasNoticeBeenDismissed(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${CONSENT_COOKIE}=granted`));
}

export function dismissNotice(): void {
  if (typeof document === "undefined") return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${CONSENT_COOKIE}=granted; path=/; max-age=${oneYear}; SameSite=Lax`;
}

export type DataLayerEvent =
  | { event: "lp_view" }
  | { event: "cta_click" }
  | {
      event: "registration_submit";
      event_id: string;
      utm_source?: string | null;
      utm_medium?: string | null;
      utm_campaign?: string | null;
      utm_content?: string | null;
    };

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/** Pushes to window.dataLayer. Safe no-op if GTM was never injected (no consent / no GTM ID). */
export function pushDataLayerEvent(event: DataLayerEvent): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

export const CONSENT_COOKIE = "agatha_tracking_consent";

export function hasTrackingConsent(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${CONSENT_COOKIE}=granted`));
}

export function grantTrackingConsent(): void {
  if (typeof document === "undefined") return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${CONSENT_COOKIE}=granted; path=/; max-age=${oneYear}; SameSite=Lax`;
}

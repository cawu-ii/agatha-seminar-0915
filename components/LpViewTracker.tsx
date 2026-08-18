"use client";

import { useEffect } from "react";
import { pushDataLayerEvent } from "@/lib/gtm";

const FIRED_FLAG = "agatha_lp_view_fired";

/**
 * Pushes lp_view exactly once per session (landing-page spec). Fires
 * unconditionally on mount - no longer gated on the notice banner (openspec:
 * make-consent-banner-notice-only, 2026/08/10), matching GtmLoader now
 * injecting GTM unconditionally too. Safe no-op if GTM was never injected
 * (no GTM ID configured) since pushDataLayerEvent just writes to
 * window.dataLayer either way.
 */
export function LpViewTracker() {
  useEffect(() => {
    if (window.sessionStorage.getItem(FIRED_FLAG)) return;
    pushDataLayerEvent({ event: "lp_view" });
    window.sessionStorage.setItem(FIRED_FLAG, "1");
  }, []);

  return null;
}

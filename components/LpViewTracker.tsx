"use client";

import { useEffect } from "react";
import { hasTrackingConsent, pushDataLayerEvent } from "@/lib/gtm";
import { CONSENT_GRANTED_EVENT } from "@/components/GtmLoader";

const FIRED_FLAG = "agatha_lp_view_fired";

/** Pushes lp_view exactly once, only after tracking consent (landing-page spec). */
export function LpViewTracker() {
  useEffect(() => {
    const fireOnce = () => {
      if (window.sessionStorage.getItem(FIRED_FLAG)) return;
      pushDataLayerEvent({ event: "lp_view" });
      window.sessionStorage.setItem(FIRED_FLAG, "1");
    };

    if (hasTrackingConsent()) fireOnce();
    window.addEventListener(CONSENT_GRANTED_EVENT, fireOnce);
    return () => window.removeEventListener(CONSENT_GRANTED_EVENT, fireOnce);
  }, []);

  return null;
}

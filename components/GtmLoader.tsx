"use client";

import { useEffect } from "react";
import { hasTrackingConsent } from "@/lib/gtm";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
export const CONSENT_GRANTED_EVENT = "agatha:consent-granted";

function injectGtm() {
  if (!GTM_ID) return; // no ID configured -> never render the script (tracking-integration spec)
  if (document.getElementById("gtm-script")) return; // already injected

  const script = document.createElement("script");
  script.id = "gtm-script";
  script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`;
  document.head.appendChild(script);

  const noscript = document.createElement("noscript");
  noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
  document.body.prepend(noscript);
}

/** Injects GTM only once consent has been granted (cookie present or the accept event fires). No-op if NEXT_PUBLIC_GTM_ID is unset. */
export function GtmLoader() {
  useEffect(() => {
    if (hasTrackingConsent()) injectGtm();
    const onConsent = () => injectGtm();
    window.addEventListener(CONSENT_GRANTED_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_GRANTED_EVENT, onConsent);
  }, []);

  return null;
}

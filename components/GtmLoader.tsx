"use client";

import { useEffect } from "react";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

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

/**
 * Injects GTM unconditionally on mount - no-op only if NEXT_PUBLIC_GTM_ID is
 * unset. Used to wait for the consent banner's accept click (openspec:
 * make-consent-banner-notice-only, 2026/08/10) - the banner is now a
 * dismissible notice, not a gate, so injection no longer depends on it.
 */
export function GtmLoader() {
  useEffect(() => {
    injectGtm();
  }, []);

  return null;
}

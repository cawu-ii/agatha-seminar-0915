"use client";

import { useEffect, useState } from "react";
import { grantTrackingConsent, hasTrackingConsent } from "@/lib/gtm";
import { CONSENT_GRANTED_EVENT } from "@/components/GtmLoader";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasTrackingConsent());
  }, []);

  if (!visible) return null;

  function accept() {
    grantTrackingConsent();
    window.dispatchEvent(new Event(CONSENT_GRANTED_EVENT));
    setVisible(false);
  }

  function decline() {
    setVisible(false);
  }

  return (
    <div className="consentbar glass">
      <p className="consentbar__text">
        本網站使用行銷追蹤技術（GA4／Meta 像素）以優化廣告成效與活動體驗，個人資料不會進入網址或廣告事件。詳見《隱私權政策》。
      </p>
      <div className="consentbar__actions">
        <button type="button" className="btn btn--ghost" onClick={decline}>
          僅使用必要功能
        </button>
        <button type="button" className="btn btn--primary" onClick={accept}>
          我同意
        </button>
      </div>
    </div>
  );
}

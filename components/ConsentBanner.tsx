"use client";

import { useEffect, useState } from "react";
import { dismissNotice, hasNoticeBeenDismissed } from "@/lib/gtm";

// Dismissible notice, not a consent gate (openspec: make-consent-banner-notice-only,
// 2026/08/10) - GtmLoader injects GTM unconditionally regardless of this
// banner's state. A decline button was removed on purpose: keeping one that
// doesn't actually decline anything would be misleading.
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasNoticeBeenDismissed());
  }, []);

  if (!visible) return null;

  function acknowledge() {
    dismissNotice();
    setVisible(false);
  }

  return (
    <div className="consentbar glass">
      <p className="consentbar__text">
        本網站使用行銷追蹤技術（GA4／Meta 像素）以優化廣告成效與活動體驗，個人資料不會進入網址或廣告事件。詳見《隱私權政策》。
      </p>
      <div className="consentbar__actions">
        <button type="button" className="btn btn--primary consentbar__ack" onClick={acknowledge}>
          我知道了
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { pushDataLayerEvent } from "@/lib/gtm";

interface Props {
  eventId: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
}

/** Pushes registration_submit exactly once on mount (thank-you-page spec). No PII. */
export function ThanksTracker({ eventId, utmSource, utmMedium, utmCampaign, utmContent }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || !eventId) return;
    fired.current = true;
    pushDataLayerEvent({
      event: "registration_submit",
      event_id: eventId,
      utm_source: utmSource || null,
      utm_medium: utmMedium || null,
      utm_campaign: utmCampaign || null,
      utm_content: utmContent || null,
    });
  }, [eventId, utmSource, utmMedium, utmCampaign, utmContent]);

  return null;
}

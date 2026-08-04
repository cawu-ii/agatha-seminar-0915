"use client";

import type { AnchorHTMLAttributes } from "react";
import { pushDataLayerEvent } from "@/lib/gtm";

/** Anchor that pushes cta_click before navigating (landing-page spec: CTA click). */
export function CtaLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { onClick, ...rest } = props;
  return (
    <a
      {...rest}
      onClick={(e) => {
        pushDataLayerEvent({ event: "cta_click" });
        onClick?.(e);
      }}
    />
  );
}

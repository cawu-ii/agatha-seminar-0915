import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

interface CapiInput {
  registrationId: string;
  eventId: string;
  email: string;
  phone: string;
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/**
 * Sends the server-side Meta Conversions API "Lead" event for a registration.
 * event_id is also passed as `?eid=` on the thank-you page redirect, so a
 * browser-side Meta Pixel tag reading it from the URL can dedupe against this
 * server hit (doc §6.4) - the Pixel tag itself is GTM-configured by the PR
 * agency's technical team, not pushed from this codebase (openspec:
 * update-tracking-integration).
 * No-op + log when META_CAPI_TOKEN is unset - never throws, never blocks registration.
 */
export async function sendMetaCAPI(input: CapiInput): Promise<void> {
  const token = process.env.META_CAPI_TOKEN;
  const pixelId = process.env.META_PIXEL_ID;

  if (!token || !pixelId) {
    // eslint-disable-next-line no-console
    console.log(
      `[meta-capi:no-op] would send Lead event_id=${input.eventId} for registration ${input.registrationId} (META_CAPI_TOKEN/META_PIXEL_ID unset)`
    );
    await markStatus(input.registrationId, "SKIPPED");
    return;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          {
            event_name: "Lead",
            event_time: Math.floor(Date.now() / 1000),
            event_id: input.eventId,
            action_source: "website",
            user_data: {
              em: [sha256(input.email)],
              ph: [sha256(input.phone.replace(/\D/g, ""))],
            },
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Meta CAPI responded ${res.status}`);
    await markStatus(input.registrationId, "SENT");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[meta-capi:error] registration ${input.registrationId}`, err);
    await markStatus(input.registrationId, "FAILED");
  }
}

async function markStatus(id: string, status: "SENT" | "FAILED" | "SKIPPED") {
  await prisma.registration.update({
    where: { id },
    data: { metaCapiStatus: status, metaCapiSentAt: status === "SENT" ? new Date() : undefined },
  });
}

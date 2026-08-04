import { prisma } from "@/lib/prisma";

/**
 * Phase B stub (see openspec change add-seminar-registration-system, data-export
 * capability). Not called from the registration or admin request paths - only
 * from the CTO-only export script, so an unconfigured/broken Ragic can never
 * affect registrations or the PR admin console.
 */
export async function syncToRagic(registrationId: string): Promise<void> {
  const token = process.env.RAGIC_API_TOKEN;
  const baseUrl = process.env.RAGIC_BASE_URL;

  if (!token || !baseUrl) {
    // eslint-disable-next-line no-console
    console.log(`[ragic:no-op] would sync registration ${registrationId} (RAGIC_API_TOKEN/RAGIC_BASE_URL unset)`);
    return;
  }

  const reg = await prisma.registration.findUnique({ where: { id: registrationId } });
  if (!reg) return;

  try {
    // Field mapping intentionally left for Phase B - Lindy defines the Ragic
    // sheet columns for Irene per CTO handoff doc §6.2 before this is wired.
    await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(reg),
    });
    await prisma.registration.update({ where: { id: registrationId }, data: { ragicSyncedAt: new Date() } });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[ragic:error] registration ${registrationId}`, err);
  }
}

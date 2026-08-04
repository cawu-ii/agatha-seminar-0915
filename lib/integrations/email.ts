import type { Registration } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const EVENT_NAME = "製造業 Agentic AI 商用實戰論壇";
const EVENT_WHEN = "2026/09/15（二）13:30–16:30";
const EVENT_WHERE = "台北・華南銀行國際會議中心";

/** CTO handoff doc §8.1 approved confirmation-email copy. */
function buildEmail(reg: Registration) {
  const subject = `【報名成功】${EVENT_NAME}・9/15`;
  const text = `${reg.name} 您好，

我們已收到您的報名申請，感謝報名 ${EVENT_WHEN} 於${EVENT_WHERE}舉辦的「${EVENT_NAME}」。

本論壇採資格審核制，審核結果將另行以 Email 通知，請留意信件。期待與您現場交流。

—— 湧現智庫 Agatha 團隊敬上`;
  return { subject, text };
}

/**
 * Sends the confirmation email through the configured provider. Never throws -
 * callers must not let this block or fail the registration (see registration-api spec).
 */
export async function sendConfirmationEmail(registrationId: string): Promise<void> {
  try {
    const reg = await prisma.registration.findUnique({ where: { id: registrationId } });
    if (!reg) return;

    const provider = process.env.EMAIL_PROVIDER ?? "none";
    const { subject, text } = buildEmail(reg);

    if (provider === "resend" && process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "Agatha 湧現智庫 <service@emergence.today>",
        to: reg.email,
        subject,
        text,
      });
      await markEmailStatus(reg.id, "SENT");
    } else {
      // eslint-disable-next-line no-console
      console.log(
        `[email:no-op] would send "${subject}" to ${reg.email} (EMAIL_PROVIDER=${provider}, RESEND_API_KEY ${process.env.RESEND_API_KEY ? "set" : "unset"})`
      );
      await markEmailStatus(reg.id, "SKIPPED");
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[email:error] registration ${registrationId}`, err);
    await markEmailStatus(registrationId, "FAILED").catch(() => {});
  }
}

async function markEmailStatus(id: string, status: "SENT" | "FAILED" | "SKIPPED") {
  await prisma.registration.update({
    where: { id },
    data: { emailStatus: status, emailSentAt: status === "SENT" ? new Date() : undefined },
  });
}

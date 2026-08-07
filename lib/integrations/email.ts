import fs from "node:fs";
import path from "node:path";
import type { Registration } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const EVENT_NAME = "製造業 AI 商用實戰論壇";
const EVENT_WHEN = "2026/09/15（二）13:30–16:30";
const EVENT_WHERE = "台北・華南銀行國際會議中心";

const HTML_TEMPLATE_PATH = path.join(
  process.cwd(),
  "lib/integrations/email-templates/registration-confirmation.html"
);
let htmlTemplateCache: string | null = null;

// The template's decorative hero image must be a real hosted URL, not an
// inline base64 data: URI - the original Lindy-designed file embedded it
// inline as one ~384KB unbroken line, which corrupted in transit (SMTP/MIME
// line-length handling broke the HTML mid-attribute, so recipients saw raw
// tag source instead of the rendered email). Extracted to public/email-assets/
// and referenced by absolute URL instead - see devlog Phase 40.
const ASSET_BASE_URL = process.env.EMAIL_ASSET_BASE_URL ?? "https://2026-forum.agatha-ai.com";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Lindy-designed HTML template (lib/integrations/email-templates/); only the
 * registrant's name is templated in - everything else is the same static
 * event copy for every recipient. */
function buildHtmlEmail(reg: Registration): string {
  if (!htmlTemplateCache) {
    htmlTemplateCache = fs.readFileSync(HTML_TEMPLATE_PATH, "utf-8");
  }
  return htmlTemplateCache
    .replace(/\{\{REGISTRANT_NAME\}\}/g, escapeHtml(reg.name))
    .replace(/\{\{ASSET_BASE_URL\}\}/g, ASSET_BASE_URL);
}

/** CTO handoff doc §8.1 approved confirmation-email copy. */
function buildEmail(reg: Registration) {
  const subject = `【報名成功】湧現智庫Agatha・9/15 ${EVENT_NAME}`;
  const text = `${reg.name} 您好，

我們已收到您的報名申請，感謝報名 ${EVENT_WHEN} 於${EVENT_WHERE}舉辦的「${EVENT_NAME}」。

本論壇採資格審核制，審核結果將另行以 Email 通知，請留意信件。期待與您現場交流。

—— 湧現智庫 Agatha 團隊敬上`;
  const html = buildHtmlEmail(reg);
  return { subject, text, html };
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
    const { subject, text, html } = buildEmail(reg);

    if (provider === "resend" && process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "Agatha 湧現智庫 <service@emergence.today>",
        to: reg.email,
        subject,
        text,
        html,
      });
      await markEmailStatus(reg.id, "SENT");
    } else if (provider === "gmail" && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      // Sends through Gmail's own SMTP servers using an account App Password
      // (myaccount.google.com/apppasswords, 16 lowercase chars in 4 groups
      // of 4 - not the account login password). No DNS/SPF/DKIM setup is
      // needed since Gmail's own servers are already the authorized sender
      // for their own domain - this sidesteps the Resend domain-verification
      // path entirely for cases where the confirmation-email mailbox already
      // is a working Gmail account (see README .env table).
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_FROM ?? `Agatha 湧現智庫 <${process.env.GMAIL_USER}>`,
        to: reg.email,
        subject,
        text,
        html,
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

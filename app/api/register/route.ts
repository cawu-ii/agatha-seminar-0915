import { NextRequest, NextResponse, after } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registrationSchema } from "@/lib/registration-schema";
import { sendConfirmationEmail } from "@/lib/integrations/email";
import { sendMetaCAPI } from "@/lib/integrations/meta-capi";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  let registrationId: string;
  let eventId: string;

  try {
    const created = await prisma.registration.create({
      data: {
        idempotencyKey: data.idempotencyKey,
        name: data.name,
        company: data.company,
        taxId: data.taxId,
        dept: data.dept,
        deptOther: data.deptOther,
        title: data.title,
        titleOther: data.titleOther,
        industry: data.industry,
        industryOther: data.industryOther,
        size: data.size,
        email: data.email,
        phone: data.phone,
        sessions: JSON.stringify(data.sessions),
        stage: data.stage,
        stageOther: data.stageOther,
        consult: JSON.stringify(data.consult),
        consultOther: data.consultOther,
        agreeTerms: data.agreeTerms,
        agreeMarketing: data.agreeMarketing,
        utmSource: data.utm_source,
        utmMedium: data.utm_medium,
        utmCampaign: data.utm_campaign,
        utmContent: data.utm_content,
      },
    });
    registrationId = created.id;
    eventId = created.eventId;
  } catch (err) {
    // Duplicate submit (same idempotencyKey): return the original event_id instead
    // of erroring the user-visible flow (registration-api spec, dedup requirement).
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing = await prisma.registration.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
      });
      if (existing) {
        return NextResponse.json({ event_id: existing.eventId }, { status: 200 });
      }
    }
    // eslint-disable-next-line no-console
    console.error("[api/register] insert failed", err);
    return NextResponse.json({ error: "Registration failed, please try again." }, { status: 500 });
  }

  // Runs after the response is sent (Next.js `after()`), so it never blocks or
  // fails the registration, but still gets to finish on serverless platforms
  // that would otherwise freeze the function once the response ships.
  after(async () => {
    await sendConfirmationEmail(registrationId).catch((err) =>
      // eslint-disable-next-line no-console
      console.error("[api/register] sendConfirmationEmail rejected", err)
    );
    await sendMetaCAPI({ registrationId, eventId, email: data.email, phone: data.phone }).catch((err) =>
      // eslint-disable-next-line no-console
      console.error("[api/register] sendMetaCAPI rejected", err)
    );
  });

  return NextResponse.json({ event_id: eventId }, { status: 200 });
}

import { AddToCalendar } from "@/components/AddToCalendar";
import { ThanksTracker } from "@/components/ThanksTracker";

interface PageProps {
  searchParams: Promise<{
    eid?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
  }>;
}

export default async function ThanksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const eventId = params.eid ?? "";

  return (
    <section className="sec thanks">
      <div className="wrap">
        <div className="glass thanks__box">
          <div className="regdone__tick">✓</div>
          <h3>報名申請已送出</h3>
          <p>感謝您報名「製造業 Agentic AI 商用實戰論壇」。我們已收到您的申請，確認信已寄至您填寫的信箱。</p>
          <p className="regdone__meta">2026.09.15（二）13:30–16:30｜台北・華南銀行國際會議中心</p>
          <p>本論壇採資格審核制，審核結果將另行以 Email 通知。</p>
          <p>
            若未收到確認信，請檢查垃圾信匣，或來信 <a href="mailto:service@emergence.today">service@emergence.today</a>。
          </p>
          <AddToCalendar />
          <div className="thanks__actions">
            <a className="btn btn--ghost" href="/seminar/0915">
              返回活動頁
            </a>
          </div>
        </div>
      </div>
      <ThanksTracker
        eventId={eventId}
        utmSource={params.utm_source ?? ""}
        utmMedium={params.utm_medium ?? ""}
        utmCampaign={params.utm_campaign ?? ""}
        utmContent={params.utm_content ?? ""}
      />
    </section>
  );
}

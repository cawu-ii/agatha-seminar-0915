import { AddToCalendar } from "@/components/AddToCalendar";

// The registration flow still redirects here with ?eid=&utm_*= (landing-page
// spec: no PII in the URL), but this page no longer reads them - the GA4/Meta
// conversion Trigger is configured externally against this URL's path alone
// (openspec: update-tracking-integration), and nothing else on this page
// currently needs the query values.
export default function ThanksPage() {
  return (
    <section className="sec thanks">
      <div className="wrap">
        <div className="glass thanks__box">
          <div className="regdone__tick">✓</div>
          <h3>報名申請已送出</h3>
          <p>感謝您報名「湧現智庫Agatha · 製造業 AI 商用實戰論壇」。我們已收到您的申請，確認信已寄至您填寫的信箱。</p>
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
    </section>
  );
}

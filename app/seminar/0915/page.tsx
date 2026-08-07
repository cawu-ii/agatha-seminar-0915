import { CtaLink } from "@/components/CtaLink";
import { ConsentBanner } from "@/components/ConsentBanner";
import { LpViewTracker } from "@/components/LpViewTracker";
import { PageEffects } from "@/components/PageEffects";
import { PartnerWall } from "@/components/PartnerWall";
import { RegistrationForm } from "@/components/RegistrationForm";
import { prisma } from "@/lib/prisma";
import { loadFormOptions } from "@/lib/form-options-db";
import type { FormOptionsByField } from "@/lib/registration-schema";

// Agenda is DB-backed and PR-editable (openspec: add-agenda-management) - the
// page must be rendered per-request, not statically at build time, or admin
// edits would never show up without a full rebuild+redeploy.
export const dynamic = "force-dynamic";

export default async function SeminarLandingPage() {
  // Agenda is PR-editable via /admin/agenda (openspec: add-agenda-management).
  // Query fails safe to an empty list rather than crashing the whole landing
  // page if the DB has a hiccup - the rest of the page still renders.
  const agendaItems = await prisma.agendaItem
    .findMany({ orderBy: { sortOrder: "asc" } })
    .catch(() => []);
  // Speakers/partners/highlights are PR-editable via /admin (openspec:
  // add-content-cms), same pattern as the agenda query above.
  const highlights = await prisma.highlight.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []);
  const speakers = await prisma.speaker.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []);
  // Partners split into two fixed groups (openspec: add-speaker-partner-upload) -
  // HOST (今晧實業、湧現智庫) rendered separately from COORGANIZER partners.
  const partners = await prisma.partner.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []);
  const hostPartners = partners.filter((p) => p.category === "HOST");
  const coorganizerPartners = partners.filter((p) => p.category === "COORGANIZER");
  const highlightLabels = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  const formOptions = await loadFormOptions().catch(
    (): FormOptionsByField => ({ dept: [], title: [], industry: [], size: [], sessions: [], stage: [], consult: [] })
  );
  // Banner/EventInfo are PR-editable via /admin (openspec:
  // add-banner-event-info-cms), same fail-safe pattern as the queries above.
  // No banner uploaded yet -> banner stays null -> the existing CSS-only
  // hero renders exactly as before (the required fallback).
  const banner = await prisma.banner.findUnique({ where: { id: "singleton" } }).catch(() => null);
  const eventInfoFacts = await prisma.eventInfo.findMany().catch(() => []);
  const eventInfoByField = Object.fromEntries(eventInfoFacts.map((f) => [f.field, f]));

  return (
    <>
      <PageEffects />
      <LpViewTracker />

      <header className="nav">
        <div className="wrap nav__in">
          <img className="nav__logo" src="/images/asset-6ba503ad66.png" alt="Agatha" />
          <div className="nav__r">
            <span className="nav__date">2026.09.15（二）· 台北</span>
            <CtaLink className="btn btn--primary" href="#register">
              立即申請報名
            </CtaLink>
          </div>
        </div>
      </header>

      {(banner?.desktopUrl || banner?.mobileUrl) && (
        <div className="hero-banner">
          {banner.desktopUrl && (
            <img className="hero-banner--desktop" src={banner.desktopUrl} alt={banner.altText || "Agatha Forum 2026"} />
          )}
          {banner.mobileUrl && (
            <img className="hero-banner--mobile" src={banner.mobileUrl} alt={banner.altText || "Agatha Forum 2026"} />
          )}
        </div>
      )}

      <section className="hero">
        <div className="hero__fx">
          <div className="dotgrid" />
          <div className="hero__orb" />
          <div className="ring ring--1" />
          <div className="ring ring--2" />
          <svg className="agentnet" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <radialGradient id="gG" cx="34%" cy="28%" r="80%">
                <stop offset="0" stopColor="#66f0a8" />
                <stop offset="1" stopColor="#09A25B" />
              </radialGradient>
              <radialGradient id="gB" cx="34%" cy="28%" r="80%">
                <stop offset="0" stopColor="#aed3ff" />
                <stop offset="1" stopColor="#5b95f0" />
              </radialGradient>
              <radialGradient id="gL" cx="34%" cy="28%" r="80%">
                <stop offset="0" stopColor="#e8ec9f" />
                <stop offset="1" stopColor="#b6bd4f" />
              </radialGradient>
              <linearGradient id="lnG" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity=".24" />
                <stop offset="1" stopColor="#ffffff" stopOpacity=".04" />
              </linearGradient>
            </defs>
            <g stroke="url(#lnG)" strokeLinecap="round">
              <line x1="300" y1="300" x2="140" y2="175" />
              <line x1="300" y1="300" x2="470" y2="160" />
              <line x1="300" y1="300" x2="505" y2="360" />
              <line x1="300" y1="300" x2="360" y2="475" />
              <line x1="300" y1="300" x2="175" y2="420" />
              <line x1="140" y1="175" x2="250" y2="110" />
              <line x1="470" y1="160" x2="505" y2="360" />
              <line x1="360" y1="475" x2="430" y2="470" />
            </g>
            <circle r="3.5" fill="#7cf0b0">
              <animateMotion dur="9s" repeatCount="indefinite" path="M300,300 L140,175" />
            </circle>
            <circle r="3.5" fill="#a9d0ff">
              <animateMotion dur="11s" repeatCount="indefinite" path="M300,300 L470,160" />
            </circle>
            <circle r="3" fill="#e0e6a0">
              <animateMotion dur="12s" repeatCount="indefinite" path="M300,300 L360,475" />
            </circle>
            <circle r="3" fill="#7cf0b0">
              <animateMotion dur="10s" repeatCount="indefinite" path="M300,300 L175,420" />
            </circle>
            <g className="node">
              <circle cx="300" cy="300" r="36" fill="url(#gG)" opacity=".22" />
              <circle cx="300" cy="300" r="16" fill="url(#gG)" />
              <circle cx="300" cy="300" r="6" fill="#Eafff3" />
            </g>
            <g className="node node--2">
              <circle cx="140" cy="175" r="22" fill="url(#gB)" opacity=".2" />
              <circle cx="140" cy="175" r="9" fill="url(#gB)" />
            </g>
            <g className="node node--3">
              <circle cx="470" cy="160" r="22" fill="url(#gL)" opacity=".2" />
              <circle cx="470" cy="160" r="9" fill="url(#gL)" />
            </g>
            <g className="node node--4">
              <circle cx="505" cy="360" r="20" fill="url(#gG)" opacity=".2" />
              <circle cx="505" cy="360" r="8" fill="url(#gG)" />
            </g>
            <g className="node node--5">
              <circle cx="360" cy="475" r="20" fill="url(#gB)" opacity=".2" />
              <circle cx="360" cy="475" r="8" fill="url(#gB)" />
            </g>
            <g className="node node--3">
              <circle cx="175" cy="420" r="18" fill="url(#gL)" opacity=".2" />
              <circle cx="175" cy="420" r="7" fill="url(#gL)" />
            </g>
            <circle cx="250" cy="110" r="5" fill="#66f0a8" opacity=".85" />
            <circle cx="430" cy="470" r="5" fill="#aed3ff" opacity=".85" />
          </svg>
        </div>
        <div className="wrap hero__in">
          <div className="hero__col">
            <p className="en">AGATHA FORUM 2026</p>
            <h1>
              製造業 <span className="g">AI</span> 商用實戰論壇
            </h1>
            <p className="hero__sub">
              代理式 AI 的智動化與治動化：打造員工好用、老闆放心的<b>全流程可控平台</b>
            </p>
            <div className="hero__event">
              <div className="hero__date">
                09.15
                <span>2026 · 星期二</span>
              </div>
              <div className="hero__vinfo">
                <b>13:30 – 16:30</b>
                <br />
                台北 · 華南銀行國際會議中心
              </div>
            </div>
            <div className="chips">
              <span className="chip">
                <b>可使用</b>
              </span>
              <span className="chip">
                <b>可管控</b>
              </span>
              <span className="chip">
                <b>可治理</b>
              </span>
            </div>
            <div className="hero__cta">
              <CtaLink className="btn btn--primary" href="#register">
                立即申請報名
              </CtaLink>
              <a className="btn btn--ghost" href="#agenda">
                查看完整議程
              </a>
              <span className="hero__note">免費 · 採資格審核 · 名額有限</span>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 8 }}>
        <div className="wrap ta">
          <p className="ta__lead reveal">
            當 Agentic AI 進入應用爆發期，真正的關鍵不在「用了多少 AI」，而在能不能把 AI
            嵌進企業既有的產、銷、人、發、財流程，讓它可用、可控、可治理。Agatha
            以雲地整合與治理為底層，協助製造業把單點試用，變成全員可用、可被交付與衡量的日常戰力——讓 AI
            真正驅動生產力與 ROI，落在營運成果上。
          </p>
          <div className="glass ta__box reveal">
            <p className="en">Who should attend</p>
            <p>
              專為<strong>製造業經營者、IT 與營運決策者</strong>量身打造。9/15，一次看懂「可使用、可管控、可治理」的代理式
              AI，如何成為驅動企業生產力的智慧戰略中心。
            </p>
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec__h">
            <p className="en">Highlights</p>
            <h2>活動亮點</h2>
          </div>
          <div className="grid2">
            {highlights.map((h, idx) => (
              <article className="glass hl reveal" key={h.id}>
                <span className="hl__no">亮點{highlightLabels[idx] ?? idx + 1}</span>
                <h3 className="hl__t">{h.title}</h3>
                <p className="hl__b">{h.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec__h">
            <p className="en">Event Info</p>
            <h2>活動資訊</h2>
          </div>
          <div className="facts">
            {(
              [
                { key: "DATE", label: "Date" },
                { key: "TIME", label: "Time" },
                { key: "VENUE", label: "Venue" },
                { key: "ACCESS", label: "Access" },
              ] as const
            ).map(({ key, label }) => {
              const fact = eventInfoByField[key];
              if (!fact) return null; // not seeded yet - skip this card rather than crash
              return (
                <div className="glass fact" key={key}>
                  <b>{label}</b>
                  <p>
                    {fact.line1}
                    {fact.line2 ? (
                      <>
                        <br />
                        {fact.line2}
                      </>
                    ) : null}
                    {fact.subText ? (
                      fact.line2 ? (
                        <small>
                          <br />
                          {fact.subText}
                        </small>
                      ) : (
                        <>
                          <br />
                          <small>{fact.subText}</small>
                        </>
                      )
                    ) : null}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sec" id="agenda" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec__h">
            <p className="en">Agenda</p>
            <h2>活動議程</h2>
          </div>
          <div className="glass ag">
            {agendaItems.map((item) => (
              <div className={`ag__row${item.isBreak ? " ag__row--break" : ""}`} key={item.id}>
                <div className="ag__time">{item.timeLabel}</div>
                <div className="ag__t">{item.title}</div>
                <div className="ag__spk">{item.speaker || "—"}</div>
              </div>
            ))}
          </div>
          <p className="ag__note">＊講題與講者以最終確認為準。</p>
        </div>
      </section>

      <section className="sec" id="speakers" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec__h">
            <p className="en">Speakers</p>
            <h2>講者陣容</h2>
          </div>
          <div className="grid3s">
            {speakers.map((s) => (
              <article className={`glass spk reveal${!s.confirmed ? " spk--tbd" : ""}`} key={s.id}>
                <div
                  className={`spk__ph${!s.confirmed ? " spk__ph--tbd" : !s.photoUrl ? " spk__ph--soon" : ""}`}
                >
                  {s.photoUrl ? (
                    <img src={s.photoUrl} alt={s.name} loading="lazy" />
                  ) : (
                    <span>{s.confirmed ? "照片待提供" : "待確認"}</span>
                  )}
                </div>
                <div className="spk__body">
                  <div className="spk__nm">
                    {s.name}
                    {!s.confirmed && <span className="badge">待確認</span>}
                  </div>
                  <div className="spk__ti">{s.title}</div>
                  <p className="spk__bio">{s.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {hostPartners.length > 0 && (
        <section className="sec" id="hosts" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="sec__h">
              <p className="en">Hosts</p>
              <h2>主辦單位</h2>
            </div>
            <PartnerWall
              partners={hostPartners.map((p) => ({ id: p.id, name: p.name, desc: p.description, img: p.logoUrl }))}
            />
          </div>
        </section>
      )}

      <section className="sec" id="partners" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec__h">
            <p className="en">Partners</p>
            <h2>合作夥伴</h2>
            <p className="sec__lead">本次論壇講者單位與攤位夥伴（依序排列，非代表排名）。</p>
          </div>
          <PartnerWall
            partners={coorganizerPartners.map((p) => ({ id: p.id, name: p.name, desc: p.description, img: p.logoUrl }))}
          />
        </div>
      </section>

      <section className="sec" id="register">
        <div className="wrap">
          <div className="reg__head">
            <h2>立即申請報名</h2>
            <p>本論壇免費參加，採資格審核制。填寫後審核通過將以 Email 寄送詳細活動資訊。</p>
            <div className="reg__pills">
              <span>免費參加</span>
              <span>資格審核</span>
              <span>名額有限</span>
            </div>
          </div>
          <RegistrationForm options={formOptions} />
        </div>
      </section>

      <footer className="ft">
        <div className="wrap ft__in">
          <img className="ft__logo" src="/images/asset-6ba503ad66.png" alt="Agatha" />
          <div className="ft__meta">
            <b>Agatha Forum 2026｜製造業 AI 商用實戰論壇</b>
            <br />
            2026.09.15（二）13:30–16:30 · 台北 · 華南銀行國際會議中心
            <br />
            主辦單位：湧現智庫 Agatha ｜ service@emergence.today
          </div>
        </div>
      </footer>

      <div className="float">
        <CtaLink className="btn btn--primary" href="#register">
          立即報名
        </CtaLink>
      </div>

      <ConsentBanner />
    </>
  );
}

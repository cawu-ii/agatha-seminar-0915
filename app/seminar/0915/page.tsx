import { CtaLink } from "@/components/CtaLink";
import { ConsentBanner } from "@/components/ConsentBanner";
import { LpViewTracker } from "@/components/LpViewTracker";
import { PageEffects } from "@/components/PageEffects";
import { PartnerWall } from "@/components/PartnerWall";
import { RegistrationForm } from "@/components/RegistrationForm";

export default function SeminarLandingPage() {
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
            <article className="glass hl reveal">
              <span className="hl__no">亮點一</span>
              <h3 className="hl__t">資料不出廠的雲地整合平台</h3>
              <p className="hl__b">
                探討開放中立、不綁單一 ERP 與模型的 Agentic AI 平台，如何在 SaaS、私有雲到地端三種部署下，把 AI
                嵌進「產、銷、人、發、財」五大節點，讓企業在資料主權不外流的前提下，完成規模化導入。
              </p>
            </article>
            <article className="glass hl reveal">
              <span className="hl__no">亮點二</span>
              <h3 className="hl__t">高科技製造的 AI 資安與可管理工作流</h3>
              <p className="hl__b">
                高科技製造導入 AI Agent，資安與流程兩道關卡並存：員工私下用 AI、Agent
                自主決策，讓資料防線與破口同步改變。本場聚焦如何把每個 Agent
                設計成可交付、可衡量、可管理的工作流，行為可視可稽核，收進管得動的治理架構。
              </p>
            </article>
            <article className="glass hl reveal">
              <span className="hl__no">亮點三</span>
              <h3 className="hl__t">從單點試用到全員上手的真實路徑</h3>
              <p className="hl__b">
                深度剖析製造業導入 Agentic AI 的真實路徑：場景怎麼選、導入卡在哪、生產力提升多少、拿回什麼。從一家 40
                年製造企業的親身佈局，到多場景的實戰回顧，拆解從單點試用到全員上手的真實代價與回報。
              </p>
            </article>
            <article className="glass hl reveal">
              <span className="hl__no">亮點四</span>
              <h3 className="hl__t">降低轉型第一道門檻的政府資源</h3>
              <p className="hl__b">
                盤點製造業 AI 轉型可申請的政府輔導與補助資源，從評估、申請到執行逐步說明，協助企業把「要不要投入」的門檻先降下來，搭配研究法人的產業輔導能量，讓轉型的第一步走得更穩、更有依據。
              </p>
            </article>
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
            <div className="glass fact">
              <b>Date</b>
              <p>
                2026.09.15
                <br />
                <small>星期二</small>
              </p>
            </div>
            <div className="glass fact">
              <b>Time</b>
              <p>
                13:30–16:30
                <br />
                <small>共 3 小時</small>
              </p>
            </div>
            <div className="glass fact">
              <b>Venue</b>
              <p>
                華南銀行
                <br />
                國際會議中心
                <small>
                  <br />
                  台北
                </small>
              </p>
            </div>
            <div className="glass fact">
              <b>Access</b>
              <p>
                免費參加
                <br />
                <small>採資格審核 · 名額有限</small>
              </p>
            </div>
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
            <div className="ag__row">
              <div className="ag__time">13:30–13:35</div>
              <div className="ag__t">開場：從製造 40 年到 AI 元年——傳統製造企業的 AI 戰略佈局</div>
              <div className="ag__spk">今晧實業暨湧現智庫董事長｜石浩吉</div>
            </div>
            <div className="ag__row">
              <div className="ag__time">13:35–14:00</div>
              <div className="ag__t">Agatha 企業級 Agentic AI 平台：雲地整合、串接 ERP、驅動五大流程</div>
              <div className="ag__spk">湧現智庫商務開發副總｜林書琦</div>
            </div>
            <div className="ag__row">
              <div className="ag__time">14:00–14:20</div>
              <div className="ag__t">製造業 AI 轉型的政府資源與補助解析</div>
              <div className="ag__spk">金屬工業研究發展中心 產業創新服務組組長｜陳伊誠</div>
            </div>
            <div className="ag__row">
              <div className="ag__time">14:20–14:40</div>
              <div className="ag__t">AI 駕馭工程的時代：管理 AI Agent 的資安關鍵</div>
              <div className="ag__spk">AIFT 商務合作總監 廖志偉 博士（Dr. Frank Liao）</div>
            </div>
            <div className="ag__row ag__row--break">
              <div className="ag__time">14:40–14:55</div>
              <div className="ag__t">中場休息・攤位交流</div>
              <div className="ag__spk">—</div>
            </div>
            <div className="ag__row">
              <div className="ag__time">14:55–15:20</div>
              <div className="ag__t">企業 Agent 落地實戰：如何設計可被交付、可衡量、可管理的工作流</div>
              <div className="ag__spk">湧現智庫技術長｜傅子維</div>
            </div>
            <div className="ag__row">
              <div className="ag__time">15:20–15:45</div>
              <div className="ag__t">【Panel】從單點試用到全員上手：製造業 Agentic AI 落地的真實代價與回報</div>
              <div className="ag__spk">石浩吉 × 林書琦 × 優達科技〔待確認〕｜主持人 劉涵竹</div>
            </div>
            <div className="ag__row ag__row--break">
              <div className="ag__time">15:45–16:30</div>
              <div className="ag__t">交流時間・填問卷兌換好禮</div>
              <div className="ag__spk">—</div>
            </div>
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
            <article className="glass spk reveal">
              <div className="spk__ph">
                <img src="/images/asset-cd6e2c579d.jpg" alt="石浩吉" loading="lazy" />
              </div>
              <div className="spk__body">
                <div className="spk__nm">石浩吉</div>
                <div className="spk__ti">今晧實業暨湧現智庫董事長</div>
                <p className="spk__bio">
                  帶領今晧從 40 年連接線製造，跨足 AI 軟硬體生態系佈局。以經營者視角，分享傳統製造企業啟動 AI
                  轉型的戰略思路與親身實戰。
                </p>
              </div>
            </article>
            <article className="glass spk reveal">
              <div className="spk__ph">
                <img src="/images/asset-ed714b886a.jpg" alt="林書琦" loading="lazy" />
              </div>
              <div className="spk__body">
                <div className="spk__nm">林書琦</div>
                <div className="spk__ti">湧現智庫商務開發副總</div>
                <p className="spk__bio">
                  第一線協助製造業導入 Agatha 的商務負責人。將拆解雲地整合平台如何串接 ERP、驅動「產、銷、人、發、財」五大流程。
                </p>
              </div>
            </article>
            <article className="glass spk reveal">
              <div className="spk__ph">
                <img src="/images/asset-d7d77edfc5.jpg" alt="傅子維" loading="lazy" />
              </div>
              <div className="spk__body">
                <div className="spk__nm">傅子維</div>
                <div className="spk__ti">湧現智庫技術長</div>
                <p className="spk__bio">
                  主導 Agatha 平台架構，專注非硬編碼的 Agent 架構與資料治理。將示範如何設計可被交付、可衡量、可管理的 AI
                  Agent 工作流。
                </p>
              </div>
            </article>
            <article className="glass spk reveal">
              <div className="spk__ph spk__ph--soon">
                <span>照片待提供</span>
              </div>
              <div className="spk__body">
                <div className="spk__nm">陳伊誠</div>
                <div className="spk__ti">金屬工業研究發展中心 產業創新服務組組長</div>
                <p className="spk__bio">熟悉製造業創新輔導資源，將盤點企業 AI 轉型可申請的政府補助與輔導方案，協助企業降低轉型的第一道門檻。</p>
              </div>
            </article>
            <article className="glass spk reveal">
              <div className="spk__ph">
                <img src="/images/asset-e0a7f92abb.jpg" alt="廖志偉 博士（Dr. Frank Liao）" loading="lazy" />
              </div>
              <div className="spk__body">
                <div className="spk__nm">廖志偉 博士（Dr. Frank Liao）</div>
                <div className="spk__ti">AIFT 商務合作總監</div>
                <p className="spk__bio">
                  Frank
                  在企業數位轉型與技術創新領域有超過十年的實戰經驗，長期協助金融、保險與製造等高度監管產業導入創新技術。曾任職於國泰金控、國泰人壽與台灣王道銀行，專注於創新專案推進、系統落地規劃與風險控管等。目前在
                  AIFT 推動生成式 AI 與 AI Agent 的資安解決方案 Vulcan，協助金融、製造及其他各產業，在導入 AI
                  的同時兼顧安全與合規。
                </p>
              </div>
            </article>
            <article className="glass spk reveal">
              <div className="spk__ph">
                <img src="/images/asset-8caa1bf6e1.jpg" alt="劉涵竹" loading="lazy" />
              </div>
              <div className="spk__body">
                <div className="spk__nm">劉涵竹</div>
                <div className="spk__ti">主持人</div>
                <p className="spk__bio">資深財經主播、主持人，歷任非凡新聞、三立 iNEWS、中天、東森財經新聞台，以財經專業串接全場議程與 Panel 對談。</p>
              </div>
            </article>
            <article className="glass spk reveal spk--tbd">
              <div className="spk__ph spk__ph--tbd">
                <span>待確認</span>
              </div>
              <div className="spk__body">
                <div className="spk__nm">
                  優達科技 <span className="badge">待確認</span>
                </div>
                <div className="spk__ti">講者待確認</div>
                <p className="spk__bio">以製造業第一線導入者身分現身說法，分享 Agentic AI 從單點試用到全員上手的真實經驗。</p>
              </div>
            </article>
            <article className="glass spk reveal spk--tbd">
              <div className="spk__ph spk__ph--tbd">
                <span>待確認</span>
              </div>
              <div className="spk__body">
                <div className="spk__nm">
                  資策會 <span className="badge">待確認</span>
                </div>
                <div className="spk__ti">講者待確認</div>
                <p className="spk__bio">從產業推動視角，補充製造業 AI 導入的整體觀察與資源觀點。</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="sec" id="partners" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec__h">
            <p className="en">Partners</p>
            <h2>合作夥伴</h2>
            <p className="sec__lead">本次論壇講者單位與攤位夥伴（依序排列，非代表排名）。</p>
          </div>
          <PartnerWall />
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
          <RegistrationForm />
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

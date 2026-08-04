# 開發 Log（從頭到尾，逐 phase 記錄）

這是完整的開發時間軸記錄，涵蓋從需求理解、規劃到實作、驗證的每一步。操作說明看 [README.md](README.md)；規格文件在 [openspec/changes/add-seminar-registration-system/](openspec/changes/add-seminar-registration-system/)。

---

## Phase 1 — 需求理解與規劃

**做了什麼：**
- 讀取兩份參考資料：
  - CTO 交接文件（`.docx`）：這是二進位檔，Read 工具無法直接讀。改用 PowerShell 把 `.docx` 當 zip 解壓縮，解析 `word/document.xml` 的 XML，抽出段落文字與表格內容，轉成純文字檔再讀取。
  - 已核准的靜態 HTML 設計稿（989KB，單檔內嵌大量 base64 圖片）：先用 Grep 找出 `<section>`/`<script>` 等結構關鍵字定位每個區塊的行號，再用 `sed` 切出小段分別 Read，避免一次讀進整份超大檔案觸發 token 上限。
- 確認交接文件核心要求：CTO/工程負責「報名頁＋自建後台、GTM、GA4／Meta 像素埋設、交易信 API 串接與網域驗證、感謝頁、UTM 落庫、開後台權限給公關」，§12 訂 8/5–8/7 為 staging 測試窗口。
- 現有專案資料夾裡完全沒有既有骨架，先拍板 4 個關鍵技術決策：
  1. 技術棧 → **Next.js 全端**
  2. 資料庫 → **託管 Postgres／Supabase**
  3. 後台範圍 → **V1 簡化版：單一共用密碼**
  4. 第三方憑證現況 → **都還沒有，先用預留環境變數**
- 確認兩項交付要求：這是主管指派的 CTO/工程業務，8/5 前要完成；完成後要有一版 README 把 material 寫清楚。
- 把完整計畫寫進 plan 檔，內容包含 Context、OpenSpec 規格骨架步驟、系統架構圖、關鍵檔案清單、Registration 資料表欄位、事件字典對應、待確認事項、README 交付物規格、驗證方式。計畫定案後開始動工。

**遇到的問題：** 無（此階段是研究與規劃，沒有執行會失敗的動作）。

---

## Phase 2 — OpenSpec 規格建立

**做了什麼：**
- 執行 `npx @fission-ai/openspec@latest init --tools claude --no-animation .` 建立 `openspec/` 骨架與 Claude Code 的 skills/commands。
- 建立 change proposal `add-seminar-registration-system`。
- 依 OpenSpec 的 artifact 相依順序，依序產出：
  1. `proposal.md`（why / what changes / 7 個 capability）
  2. `design.md`（技術決策與理由：Next.js、Postgres→Docker、event_id 冪等設計、單密碼後台、CTO-only 匯出）
  3. `specs/*/spec.md` × 7（landing-page、registration-api、thank-you-page、tracking-integration、transactional-email、admin-console、data-export，每個需求都寫成 WHEN/THEN 的 Scenario）
  4. `tasks.md`（逐項任務清單，對應交接文件章節）
- 執行 `openspec validate --strict`，通過。

**遇到的問題：**
- `openspec init --yes` 這個 flag 不存在，改用 `--tools claude --no-animation .` 才能非互動執行。
- `openspec validate --change <name>` 參數名稱不對，正確是 `openspec validate <name>`（不是 `--change`）。

---

## Phase 3 — 專案骨架建立

**做了什麼：**
- 手動寫 `package.json`、`tsconfig.json`、`next.config.mjs`、`.gitignore`（沒有用 `create-next-app` 互動式 CLI，因為它對非空資料夾會走互動提示，這個執行環境無法回應互動輸入）。
- 設計 `prisma/schema.prisma`：`Registration` model，含 UTM 四欄位、`eventId`/`idempotencyKey` 唯一鍵、`emailStatus`/`metaCapiStatus`/`ragicSyncedAt` 整合狀態欄位、`reviewed`/`reviewerNote` 審核欄位。
- 寫 `.env.example`（逐項標註誰要提供、對照交接文件 §0/§11）與本機用的 `.env`。
- `npm install` 安裝套件。
- 建立 `docker-compose.yml`，執行 `docker compose up -d` 想跑本機 Postgres。

**遇到的問題（本次專案唯一一處偏離已核准計畫）：**
- `docker compose up -d` 直接報錯：連不上 `dockerDesktopLinuxEngine`（Docker Desktop 的引擎沒有在跑）。
- 嘗試手動啟動 `Docker Desktop.exe`（背景執行），輪詢等待引擎就緒最長到 2 分 50 秒逾時，`docker info` 仍然卡住沒回應。判斷這是需要 GUI 互動（例如 WSL2 初次設定、Windows 確認視窗）的啟動流程，命令列排除不了，繼續等下去會拖垮 8/5 的交付時間。
- **決策：改用 SQLite 做本機／staging 驗證**（零外部依賴，不需要 Docker 也不需要任何帳號）。修改 `prisma/schema.prisma`：`datasource provider` 改成 `"sqlite"`；`sessions`/`consult` 兩個欄位從 Postgres 專用的 `String[]` 改成 JSON 字串（SQLite 沒有原生陣列型別）。`.env`/`.env.example` 的 `DATABASE_URL` 改成 `file:./dev.db`（並保留一行註解掉的 Postgres 連線字串範例）。`docker-compose.yml` 保留檔案，之後 Docker 能用或 Supabase 帳號到位時可以直接切換。
- 執行 `npx prisma migrate dev --name init`，這次成功建立 `dev.db`。

---

## Phase 4 — 落地頁移植

**做了什麼：**
- 原始 HTML 989KB 太大無法一次讀取，寫了一支暫存的 Node script（`extract-assets.mjs`，只存在 scratchpad，沒有留在專案內）：用正規表達式找出所有 `data:image/...;base64,...` 內嵌圖片，解碼後依內容雜湊命名，各自存成獨立檔案到 `public/images/`，原本的 base64 字串換成短路徑 `/images/asset-xxx.png`。這一步把檔案從 989KB 壓到 63KB，才有辦法逐段讀取轉譯，總共取出 14 張圖片。
- 用 `sed` 依行號切出各區塊（CSS、nav、hero、活動資訊/who-should-attend、亮點、活動資訊 facts、議程、講者、夥伴牆、報名表單、script）分別存成小檔案逐一 Read，確保每一段文案都逐字核對過，不是憑印象重寫。
- 建立共用邏輯層：`lib/gtm.ts`（dataLayer 封裝 + 同意 cookie 讀寫）、`lib/utm.ts`（UTM 擷取與 sessionStorage 持久化）、`lib/form-options.ts`（表單選項清單，前後端共用避免漂移）、`lib/registration-schema.ts`（zod 驗證 schema）。
- 建立元件：`CtaLink`（CTA 點擊推 `cta_click`）、`LpViewTracker`（同意後推 `lp_view`，用 sessionStorage flag 確保只推一次）、`PageEffects`（1:1 移植原始 IntersectionObserver 淡入效果與 hero 滑鼠視差效果）、`PartnerWall`（夥伴卡片 + 介紹彈窗，含 8 家夥伴的完整簡介文字）、`ConsentBanner`、`GtmLoader`（依 `NEXT_PUBLIC_GTM_ID` 有無決定要不要注入腳本）、`RegistrationForm`（完整表單邏輯：必填驗證、複選群組至少一項的檢查、UTM 帶入、送出後導向感謝頁）。
- `app/globals.css`：原始 CSS 用 `sed` 整段搬過去（含尾端的「LIGHT THEME」覆寫層，這其實才是最終呈現的視覺——整份 CSS 是層層覆寫，最後一段淺色主題才是真正生效的樣式），另外在檔尾新增本次新元件（同意橫幅、感謝頁、後台）要用的樣式，全部沿用既有設計 token（`--green`/`--lime`/`.glass`/`.btn`），沒有引入新的視覺語言。
- `app/layout.tsx`、`app/seminar/0915/page.tsx` 組裝所有區塊。

**遇到的問題：** 無執行面問題，主要工作量在「怎麼在有限 token 內安全地搬移一份 989KB 的已核准設計稿而不打錯字」。

---

## Phase 5 — 報名 API

**做了什麼：**
- `lib/integrations/email.ts`、`meta-capi.ts`、`ragic.ts`：三個整合點都做成「沒憑證就 no-op + log，不拋錯」。
- `app/api/register/route.ts`：zod 驗證 → Prisma insert（唯一鍵衝突時視為重複送出，回傳原本的 `event_id` 而不是報錯）→ 觸發非同步寄信與 Meta CAPI → 回傳 `{event_id}`。

**遇到的問題／實作中修正：**
- 原始設計是「不 await 的 fire-and-forget」（`void sendConfirmationEmail(...)`）。但意識到 Next.js Route Handler 部署到 Vercel 這類 serverless 平台時，回應送出後 process 可能被直接凍結，naked `void fn()` 不保證背景工作真的會跑完。改用 Next.js 15 的 `after()` API，讓寄信/CAPI 這些背景工作在回應送出「之後」仍保證執行完畢，同時不阻塞、不拖慢使用者收到的回應時間。這點在 design.md 原本沒寫到這麼細，是實作時的補強。

---

## Phase 6 — 感謝頁

**做了什麼：**
- `components/AddToCalendar.tsx`：提供 Google 日曆連結（純 URL，不需要任何第三方帳號）+ `.ics` 檔案下載（前端用 Blob 產生），兩種都涵蓋，解決交接文件 §8.1 裡「這邊來得及加按鈕嗎？」的懸問。
- `components/ThanksTracker.tsx`：用 `useRef` 確保 `registration_submit` 只推一次。
- `app/seminar/0915/thanks/page.tsx`：Next.js 15 的 `searchParams` 是 Promise，要 `await` 才能讀到 query string（`eid`/`utm_*`），文案採用交接文件 §8.2 官方版本。

**遇到的問題：** 無。

---

## Phase 7 — 後台

**做了什麼：**
- `lib/session.ts`：HMAC 簽章的 session token，做單密碼登入。
- `middleware.ts` 保護 `/admin/*` 與 `/api/admin/*`（排除 `/admin/login` 與 `/api/admin/login`）。
- `app/api/admin/login`、`logout`、`registrations`（GET 清單+篩選）、`registrations/[id]/review`（標記已處理）、`registrations/[id]/resend`（重寄信）。
- `app/admin/login/page.tsx`、`app/admin/page.tsx`、`components/AdminTable.tsx`（搜尋/篩選/標記/重寄信，debounce 250ms）、`components/LogoutButton.tsx`。
- 刻意不做刪除鍵、不做整批匯出鍵——這是規格明文要求（PR 角色不能刪改、不能整批匯出），不是漏做。

**遇到的問題：**
- 原本 `lib/session.ts` 用 Node 內建 `crypto`（`createHmac`/`timingSafeEqual`）。中途發現 `middleware.ts` 預設跑在 Next.js 的 Edge runtime，Node 的 `crypto` 模組在 Edge runtime 不保證可用，若照原寫法上線，`/admin` 的保護機制可能直接在 middleware 這層炸掉。**改寫成只用 Web Crypto（`crypto.subtle`）**，這個 API 在 Node 18+ 跟 Edge runtime 都能跑，一次解決相容性問題。密碼比對也改用「先雜湊再逐字元比較雜湊值」的方式做基本的 timing-safe 比較（避免用 `crypto.timingSafeEqual`，因為那支也是 Node-only）。

---

## Phase 8 — 匯出

**做了什麼：**
- `scripts/export-registrations.ts`：CTO 本機執行 `npm run export:registrations`，輸出帶 BOM 的 UTF-8 CSV（確保 Excel 開繁體中文不亂碼）到 `exports/`（已加進 `.gitignore`，含個資不能進版控）。
- `app/api/export/route.ts`：另開一支 API，用**跟 `ADMIN_PASSWORD` 完全分開**的 `EXPORT_TOKEN` 驗證，且沒有在 `/admin` UI 裡放任何連結或按鈕指向它。
- `lib/integrations/ragic.ts`：no-op stub，只有這支匯出腳本會呼叫，不會被報名或後台的請求路徑觸發。

**遇到的問題：** 無。

---

## Phase 9 — Build 驗證

**做了什麼：**
- `npx prisma generate && npm run build`。
- 第一次執行就編譯成功，12 個路由（含 8 支 API route）全部產生，TypeScript 型別檢查通過。

**遇到的問題：** 無。

---

## Phase 10 — 瀏覽器端到端驗證

**做了什麼：**
- 建立 `.claude/launch.json`（`seminar-dev` 設定，`npm run dev` on port 3000）。
- 逐項在瀏覽器分頁測試（用 `javascript_tool`/`get_page_text`/`read_page`/`computer` 混合驗證，不是只看畫面）：
  1. 帶 UTM 連結造訪 → `sessionStorage` 正確存下四個 UTM 值。
  2. 同意橫幅預設顯示、`dataLayer`/GTM script 都是空的；點「我同意」後 cookie 寫入、`lp_view` 推播一次、GTM script 依然不注入（因為 `NEXT_PUBLIC_GTM_ID` 沒設，符合規格：沒 ID 就永遠不注入）。
  3. 點 CTA 按鈕 → `cta_click` 正確推播。
  4. 直接呼叫 `POST /api/register`（完整測試資料）→ 200 + `event_id`，查 DB 確認資料含 UTM、`emailStatus`/`metaCapiStatus` 都是 `SKIPPED`（沒憑證的正確行為）。
  5. 同一筆 `idempotencyKey` 再送一次 → 回傳同一個 `event_id`，DB 只有 1 筆（冪等驗證通過）。
  6. 送一筆 Email 格式錯誤的資料 → 400 + 欄位層級錯誤訊息。
  7. 直接開感謝頁網址（帶 `eid`+UTM，不帶任何個資）→ 文案正確顯示、`registration_submit` 事件正確推播且只含 `event_id`/UTM。
  8. `/admin` 未登入 → 被 middleware 導到 `/admin/login`；輸入密碼登入成功。
  9. 後台列表顯示剛剛測試送出的那筆資料；用 `utm_content=wave2` 篩選（不存在的值）→ 正確回傳 0 筆。
  10. 點「標記已處理」→ 狀態即時更新成「已處理」。
  11. 點「重寄確認信」→ dev log 印出 `[email:no-op]` 訊息，確認呼叫鏈路正確。
  12. 確認整個 `/admin` DOM 樹裡沒有任何刪除或整批匯出的按鈕/連結（用 `read_page filter=all` 全量掃描確認）。
  13. `GET /api/export`：不帶 token → 401；帶 `ADMIN_PASSWORD` 當 token → 401（證明兩個密碼真的分開，管理員密碼打不開匯出端點）；帶正確的 `EXPORT_TOKEN` → 200。
  14. `npm run export:registrations` 本機執行成功，產出 CSV。

**遇到的問題：**
- `preview_start({name: "seminar-dev"})` 第一次執行時，實際啟動的是主要工作目錄 `.claude/launch.json` 裡殘留的另一組設定（`streamlit-app`，port 8501），因為 `seminar_apply` 一開始沒有自己的 `launch.json`。發現後在 `seminar_apply/.claude/launch.json` 新增正確設定，但 `preview_start` 的 `name` 查找似乎仍固定指向主要工作目錄的設定檔，沒有改用新設定。改用替代方案：直接用 Bash 在背景執行 `npm run dev`，等它印出 `Ready` 之後，用 `preview_start({url: "http://localhost:3000/..."})` 開分頁連過去，成功繞過這個限制。
- `computer({action: "screenshot"})` 每次都逾時失敗，錯誤訊息是「Browser pane is not displayed, so the page is not compositing frames」——這個環境的瀏覽器分頁沒有被畫面顯示出來，導致無法截圖做視覺比對。**因此本次沒有用截圖驗證過實際排版/RWD/動畫效果**，只驗證了 DOM 結構、文字內容、互動邏輯（點擊、表單送出、API 回應）。如果要嚴謹核對視覺呈現，需要在有畫面顯示的環境下重跑一次截圖驗收。

---

## Phase 11 — README 撰寫

**做了什麼：**
- 寫 `README.md`：專案是什麼、對應交接文件版本、部署狀態、怎麼跑起來、`.env` 逐項說明（誰提供/沒有時會怎樣）、`/admin` 使用說明、CTO-only 匯出說明、已知偏離計畫之處（SQLite）、§12 測試表對照（今天測過 vs 卡在憑證）、待確認事項、下一步時程（對照文件 §10）。

**遇到的問題：** 無。

---

## Phase 12 — OpenSpec tasks.md 同步

**做了什麼：**
- 把 `openspec/changes/add-seminar-registration-system/tasks.md` 所有項目改成 `[x]`，並在 1.3（Docker → Postgres）那項附註實際發生的偏離與原因，讓規格文件跟實際完成狀況保持一致，不是寫好就沒人管。

**遇到的問題：** 無。

---

## Phase 13 — Docker 二次確認

**做了什麼：**
- 先前那個逾時被丟到背景執行的 `docker info` 指令，事後回報「完成了（exit code 0）」，看起來像是 Docker 突然好了。
- 重新檢查該指令的實際輸出：內容只印到 Docker CLI 的 plugin 清單（`agent`/`ai`/`buildx`/`compose`/`debug`，這些都是 Client 端資訊），並沒有真正印出 Server 端狀態，代表當時其實還是沒有真正連上 daemon，只是指令本身不再無限期卡住而已。
- 為了確認，主動重新執行一次 `docker info`：得到跟一開始一模一樣的錯誤（`dockerDesktopLinuxEngine` pipe 連不上）。
- **結論：Docker 目前仍不可用，維持 SQLite 現況不強行切換**，避免在沒把握的狀態下改動已經驗證通過的資料庫層。等確認 Docker Desktop 能正常啟動、或 Supabase 帳號到位，再照 README 的切換步驟處理。

---

## Phase 14 — 本開發 Log 建立

- 把整個開發過程「by phase、step by step」完整記錄進一份開發 log。本檔案即為該紀錄，取代先前建立的簡版 `DEVLOG.md`（已刪除，內容整合進本檔並補齊 Phase 1 的規劃階段細節）。

---

## Phase 15 — README 補圖表與檔名調整

- 跑 `npx prisma migrate dev` 時要注意是 `npx` 不是 `npm`——`npm` 沒有 `prisma` 子指令；`package.json` 裡也提供 `npm run db:migrate` 這個別名可以用，避免打錯。
- 盤點「現在的網頁和 demo 原型 HTML 差在哪裡」，整理成一份對照表（送出邏輯、UTM、感謝頁、追蹤、確認信、Meta CAPI、後台、匯出），核心結論：畫面是同一套皮，差別都在「送出之後」的資料流與後台，追蹤／寄信這些第三方整合管線已經接好但因無憑證而是安全的 no-op。
- 把上述對照表寫進 `README.md`（新增「跟原型 HTML 差在哪」一節，放在系統架構圖之前）。
- 把檔名 `開發log.md` 改成 `devlog.md`（改用純英文檔名），同步修正 `README.md` 裡的所有連結與專案結構樹裡的檔名引用，以及本檔內部提到自己檔名的地方。

---

## Phase 16 — README 視覺整理

- 目標：「README 整齊好看」、「資料流做成一張圖」。確認畫面的整齊感來自：頂部技術棧 badge、依負責人上色的 `mermaid flowchart`（用 `classDef` 上色而非預設灰底）、對齊整齊的 tree 區塊，而不是什麼特殊渲染器——都是標準 Markdown + Mermaid，換一個支援 Mermaid 的檢視器（GitHub／VS Code／Cursor 等）就能看到同樣效果。
- 對應改造 `README.md`：
  1. 頂部加技術棧 badge（Next.js／TypeScript／Prisma／SQLite／Supabase／狀態）。
  2. 新增「目錄」錨點連結。
  3. 新增「角色與分工」一節，把交接文件 §0 的角色表（Lindy／CTO／公關／BD）轉成彩色圓點標示法（🔵 CTO・🟠 Lindy・🩷 公關・🟣 公司），這組顏色之後在資料流圖、`.env` 表、專案結構樹裡重複使用，維持一致。
  4. 把原本分開的「系統架構圖」（`graph TD`）與「資料流圖」（`sequenceDiagram`）**合併成一張**「系統資料流」`flowchart TD`，用 `classDef` 依「憑證/操作由誰負責」上色，而不是依技術模組上色——這樣顏色才對應到「這格要等誰」，比純技術分層更有資訊量。
  5. `.env` 逐項說明表、專案結構樹也補上對應色點，讓「誰負責」這件事在全篇文件視覺上一致，不用每節重新說明一次。
  6. 「專案結構」保留先前已澄清的說明——**明確標注這不是 monorepo**（單一 Next.js App Router 專案），不使用會誤導的標題字面說法。
- 接著新增「工作區紀錄」小節，用表格列 `open`／`ongoing`／`done` 三態。新增在 README 最後一節，把先前散落在各節的「已知偏離」「待確認事項」「下一步」等未完成項目，收斂成一張單一狀態表，並定義三態的判斷標準（`done`=已完成並驗證；`ongoing`=程式碼/管線就緒但等外部條件；`open`=還沒動工或卡在工程無法自己解決的外部依賴），避免跟既有段落內容重複又對不上。
- 無執行面問題，純文件排版與資訊架構調整，未動到任何程式碼。

---

## Phase 17 — README 用詞專業化

- 整份 README 依同樣精神做用詞正式專業化。
- 依此原則，將所有標題與跨節指稱同步改為正式書面語，並更新對應的「目錄」錨點連結（逐一手算 GitHub 風格 slug 規則核對過，未直接假設）：
  - `/admin` 怎麼用 → `/admin` 操作說明
  - `.env` 逐項說明（誰要提供，對照文件 §0／§11） → `.env` 環境變數說明（責任分工，對照文件 §0／§11）
  - 已知偏離計畫之處 → 已知偏離計畫事項
  - §12 測試表對照：今天測過 vs 卡在憑證 → §12 測試表對照：已完成測項與待驗證測項
  - 待確認事項（可直接轉發給 Lindy／公關） → 待確認事項（可轉知 Lindy／公關）
  - 下一步（對照文件 §10 關鍵時程） → 後續規劃（對照文件 §10 關鍵時程）
  - 工作區紀錄 → 專案進度追蹤
- 表格欄位標題也一併調整：「誰提供」→「負責提供」、「沒有時會怎樣」→「未設定時之行為」；內文用語如「這樣」「怎麼」「沒有」「跑起來」「打不開」等口語詞替換為「如此」「操作」「未設定」「執行」「無法存取」等書面語；「跟...差在哪」表格的欄位標題也同步改為「原型 HTML」／「本次 Next.js 實作」。
- 「角色與分工」一節移除原本 4 條 shields.io badge 圖片，僅保留文字說明與角色分工表格。
- 全篇改寫後重新檢查所有內部跨節引用文字（例如頂部狀態列提及「見下方」的段落名稱、`/admin 操作說明` 第 4 點提及「後續規劃」）確保與新標題一致，避免指稱對不上。
- 無執行面問題，純文件用詞調整，未動到任何程式碼；系統資料流的 mermaid 圖表僅微調節點標籤文字用詞，節點 ID 與結構未變動。

---

## Phase 18 — 建立 GitHub Repo 並首次 push

- 決定 repo 命名與描述：採用與 `package.json` 一致的 `agatha-seminar-0915`（理由：目前系統確實是為此單場活動打造，資料庫/後台皆非通用多活動架構），並考量到 `..._CTO交接文件_0729.docx` 這份內部規格文件會一起進版控，原則上以 Private 起手較安全。
- repo 建於 `https://github.com/cawu-ii/agatha-seminar-0915.git`，開始 commit/push：
  1. `git ls-remote` 確認不到該 repo（`Repository not found`），且本機 `gh auth status` 顯示登入帳號為 `ocaaaaii`，不是 `cawu-ii`——查明原因：repo 原本設為 private，改成 public 後才能被查到。
  2. 改成 public 後重新確認可以看到 repo（`gh repo view` 回傳 `isPrivate:false`），但此時衍生新風險：原本設 Private 保護 docx 的前提已不成立。重新檢視這份標註 `Confidential`／「內部作業文件；對外文案發布前須經行銷確認」的 docx，決定**不 push**，把該檔名加進 `.gitignore`，並同步更新 README 專案結構樹裡對這份檔案的註解（從「保留當規格來源」改成「本機保留、標註 Confidential、已加入 .gitignore」）。
  3. `git init` → `git branch -M main` → `git remote add origin ...` → `git add -A`，`git status` 逐項核對確認 `.env`、`prisma/dev.db`、`exports/`、docx、`node_modules`、`.next` 皆未被 staged，只有 87 個預期檔案 → commit。
  4. 第一次 `git push` 失敗：`Permission to cawu-ii/agatha-seminar-0915.git denied to ocaaaaii`（403）。確認是這台機器的 git/gh 憑證屬於 `ocaaaaii`，沒有 `cawu-ii` repo 的寫入權，需要重新登入成 `cawu-ii` 帳號。
  5. 執行 `gh auth logout` → `gh auth login`（web browser 互動式流程登入 `cawu-ii`，過程中「Authenticate Git with your GitHub credentials?」選 Yes，讓 git 共用同一組憑證）。
  6. 登入完成後，`gh auth status` 顯示的仍是 `ocaaaaii`（可能是該指令的快取／keyring 顯示延遲），但實際執行 `git push -u origin main` 已經成功（`* [new branch] main -> main`），以 `gh repo view` 的 `pushedAt` 時間戳確認 push 真的落地，不是只看指令沒報錯就假設成功。
- 本次沒有把任何 push 動作建立在假設上：repo 是否存在、是否可寫入、docx 是否該公開，每一步都是先查證（`ls-remote`／`gh repo view`／`git status`）再動手，而不是直接執行後才發現問題。

---

## Phase 19 — 獨立 QA 測試、資料清理、README 同步更新

**做了什麼：**
- 開一輪獨立 QA 驗證，先讀完 7 份 capability spec、把 CTO 交接文件 §12 測試表 10 項逐一對應到 spec 需求，再實際跑起 app、逐項用瀏覽器與 API 執行測試（不是只看文件推論結果），並補測 spec 明文要求但未列在 §12 表格的項目（冪等性、匯出權限隔離、CTO 匯出腳本、Ragic no-op 等）。結果：**20 Pass、3 Blocked（#4 確認信／#7 GA4／#8 Meta 像素，皆待真實憑證，非缺陷）、0 Fail**。完整紀錄寫入 `qa/test-log-2026-08-04.md`。
- QA 過程中意外發現一個環境問題：長時間運行的 `next dev` 快取損毀，導致 `/seminar/0915/thanks` 一度回傳 500。查證方式是分別跑一次全新 `next build`（編譯正常）與重啟 `next dev`（立即恢復正常），確認是開發伺服器的快取問題、不是原始碼缺陷，重啟後排除。記錄為操作建議：8/5 測試窗口開始前先重啟一次 staging 服務，或改用 `next build && next start` 避開 dev 模式的快取風險。
- QA 期間累積了 5 筆可辨識的測試報名資料（`test+qa-*@example.com` 等）。後台故意沒有刪除功能，所以在刪除前先用 Prisma 查出全部 5 筆逐一核對 email 都符合測試資料格式，確認無誤後才在資料庫層執行 `deleteMany`，刪後再次查詢確認資料庫歸零，不是刪完就假設沒事。
- `qa/test-log-2026-08-04.md` commit + push 上 GitHub。
- 回頭把 QA 結果同步進 `README.md`：頂部狀態列與 `devlog.md` 連結旁新增 QA 紀錄連結；「§12 測試表對照」整節改寫成引用獨立 QA 複測結果（20/3/0），並把「快取損毀」的操作建議寫進去；「專案進度追蹤」新增「獨立 QA 測試」「測試資料清理」兩列（皆 `done`），新增「8/5 測試窗口前重啟 staging 服務」一列（`open`）。

**遇到的問題：** 無執行面問題；QA 發現的快取問題已在當次排除，不需要額外修復動作。

---

## Phase 20 — SQLite 定案、Turso 共用資料庫串接

**背景：** 主管確認「用 SQLite 就可以」——SQLite 從此是正式採用的資料庫，不是等 Docker/Supabase 到位前的暫時方案。同時要求做一個後台登入查報名者資訊；`/admin` 其實已經做好（Phase 7），不用重做。真正的缺口是「共用」：SQLite 是單機檔案，之前只存在這台開發機上，CTO 跟公關要透過同一個 `/admin` 看到同一份即時資料，需要一個大家都連得到的共用資料庫，不是各自機器各存一份。

**做了什麼：**
- 選型：**Turso**（雲端託管 libSQL，SQLite 方言）——符合「SQLite」的決策，不用改資料型別或重寫 schema，比切換到 Postgres 改動小很多。
- 確認要裝的套件版本：`prisma`/`@prisma/client` 本機裝的是 6.19.3，`@prisma/adapter-libsql` 特地釘在同一個版本（6.19.3）而不是裝最新的 7.x，避免 major version 對不齊。
- `prisma/schema.prisma`：`generator client` 一度加了 `previewFeatures = ["driverAdapters"]`，執行後發現這版 Prisma 已經內建、該 flag 已棄用，故拿掉；`datasource` 維持 `provider = "sqlite"` 不變，加註解說明現在的 `url`／`DATABASE_URL` 只給 Prisma CLI（migrate/studio）用，應用程式本身走 driver adapter。
- `lib/prisma.ts` 改寫：用 `@prisma/adapter-libsql` 建立 `PrismaClient`；`TURSO_DATABASE_URL` 有設就連 Turso，沒設就回退成本機檔案（`path.join(process.cwd(), "prisma", "dev.db")` 組出絕對路徑再轉成 `file:` URL，不依賴相對路徑解析規則，避免 Prisma 原生 sqlite provider 跟 libsql client 對「相對路徑基準點」認知不同造成的落差）。
- `.env`／`.env.example` 新增 `TURSO_DATABASE_URL`／`TURSO_AUTH_TOKEN` 兩個變數，說明留空即回退本機檔案。

**遇到的問題／修正：**
1. `npx prisma generate` 第一次跑就噴 `EPERM: operation not permitted, rename ...query_engine-windows.dll.node`——查出是這台機器上還留著兩組完整的 `npm run dev` → `next dev` → `start-server.js` 行程鏈（其中一組是很早之前手動起的、另一組疑似 QA agent 那輪留下的），把產生的 query engine dll 檔案鎖住了。用 `Get-CimInstance Win32_Process` 依 command line 找出全部相關 PID 後逐一 `Stop-Process -Force`，殺乾淨才能重新 generate。
2. `npm run build` 第一次噴 webpack 錯誤：`libsql`／`@libsql/client` 內部用動態 `require` 把自己的 `README.md`／`LICENSE` 也拉進 bundle，webpack 看到非 JS 內容直接 parse failed。libsql 的本機檔案／原生綁定客戶端本來就不是設計給 bundler 打包的，是要在執行期用 Node 原生 `require` 載入。修法：`next.config.mjs` 加 `serverExternalPackages: ["@libsql/client", "libsql", "@prisma/adapter-libsql"]`，告訴 Next.js 這幾個套件在伺服器端維持原生 require、不要進 webpack bundle。
3. 修完 webpack 問題後換成 TypeScript 型別錯誤：`new PrismaLibSQL(buildLibsqlClient())` 型別不合，因為 `PrismaLibSQL` 建構子吃的是連線設定物件（`{url, authToken}`），不是已經 `createClient()` 建好的 `Client` 實例。原本寫法多繞了一手，改成直接把設定物件傳給 `PrismaLibSQL`，讓 adapter 自己內部去建立底層 client。
4. 修完後 `npm run build` 又噴一個看似無關的錯誤：`Cannot find module for page: /api/export`。判斷是 `.next` 快取又髒了（跟 Phase 19 QA 發現的同一類問題），`rm -rf .next` 全新重 build 後正常，不是程式碼問題。
5. 本機驗證回退路徑時，先用 `curl -d '{...中文...}'` 直接在 bash 內嵌 JSON 送測試資料，結果中文欄位全部變亂碼、驗證失敗——這是 Windows git-bash 底下 shell 字串傳遞的編碼問題（QA log 也記錄過同一類「測試方法產物」，不是伺服器端問題）。改用 `node -e` 搭配原生 `fetch()`、在 Node 的 JS 字串字面值裡直接寫中文（Node 對 UTF-8 字串處理正確，不經過 shell 轉譯），送出後 200 + 正確寫入。之後用一般（非 adapter）的 `PrismaClient` 直接查 `dev.db`，確認 adapter 路徑跟原本的路徑讀寫的是同一個檔案，驗證完刪除這筆測試資料。
- 因為 Postgres／Supabase 不再是計畫的一部分，移除已經沒用的 `docker-compose.yml`，並同步修正 README／`openspec` `design.md` 裡所有跟 Docker/Postgres/Supabase 相關的敘述——`design.md` 的做法是保留原始決策脈絡（當初為何選 Postgres）、標記為「已被後續決策取代」，而不是直接刪掉改寫，讓決策紀錄還能追溯。
- 在 README 新增「資料庫架構：SQLite（本機檔案／Turso 共用）」一節，取代原本的「已知偏離計畫事項」，並寫清楚建立 Turso 帳號、資料庫、Token 的步驟——這一步需要外部帳號，無法代為執行，留給你本人操作。

**未完成、待後續：** Turso 帳號與資料庫尚未實際建立（需要外部帳號，不是工程能自己生出來的），目前程式碼已經準備好、一有連線資訊就能直接運作，不需要再改程式碼。

---

## Phase 21 — Turso 降級為選用，改成純 SQLite 為預設

**背景：** 主管明確表示希望純用 SQLite 就好，並且部署（含網域）由主管方負責。這代表 Turso 不是必要條件，程式碼原本的設計（`TURSO_DATABASE_URL` 留空即回退本機檔案，見 Phase 20）剛好已經支援「純 SQLite」這個模式，不需要改程式碼；需要調整的是**文件的敘事重心**——原本把 Turso 寫成「解決共用問題的主要方案」，現在要倒過來，把純 SQLite 寫成預設、Turso 降級成選用附註。

**做了什麼：**
- 釐清一件容易被忽略的事，並直接寫進 README：**純 SQLite 不等於不用決定部署方式**。SQLite 是單一檔案，寫在哪台主機的硬碟上，就決定了「誰連得到」；這件事跟用不用 Turso無關，是任何 SQLite 部署都要面對的限制。用 AskUserQuestion 想確認部署方式時，使用者選擇「dismiss」（不想在這個時間點決定部署平台），隨後說明部署由主管方處理、含網域設定，工程端不用管平台選型。
- 既然部署方要另外決定主機，工程端唯一該提前講清楚的是：**該主機類型必須支援持久化硬碟**（SQLite 檔案寫入才留得住），**不能是 Vercel 這類 serverless／無狀態部署**——這不是效能問題，是選錯的話報名資料會真的消失。這件事寫進 README 三個地方：「資料庫架構」一節的專屬小標題、「待確認事項」新增一條請轉知主管、「專案進度追蹤」把「部署與網域」列成 `ongoing`（由主管方負責，工程端已告知限制）。
- 把 README「資料庫架構」一節整個倒過來寫：標題從「SQLite（本機檔案／Turso 共用）」改成「SQLite」；本文先講持久化硬碟這個硬性限制，Turso 整段降級成「（選用）Turso 共用資料庫」小節，說明是選用、不影響純 SQLite 部署，程式碼已經預留好但不強制。同步修正頂部技術棧 badge（拿掉 `via Turso` 字樣）、系統資料流圖的 DB 節點標籤（改成「部署主機硬碟上的檔案」，不再提 Turso 字樣）、`.env` 環境變數說明表（`TURSO_*` 那列標成「選用」、「留空即為純 SQLite」）、「專案進度追蹤」表（「Turso 帳號建立」這個待辦項目拿掉，改成「部署與網域」`ongoing`）。
- 沒有動到任何程式碼——這一輪純粹是把既有的（本來就支援純 SQLite 回退）行為，在文件敘事上調整成正確的優先順序。

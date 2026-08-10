# 開發 Log（從頭到尾，逐 phase 記錄）

這是完整的開發時間軸記錄，涵蓋從需求理解、規劃到實作、驗證的每一步。操作說明看 [README.md](README.md)；規格文件在 [openspec/changes/add-seminar-registration-system/](openspec/changes/add-seminar-registration-system/)。

---

## Phase 1 — 需求理解與規劃（2026/08/04）

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

## Phase 2 — OpenSpec 規格建立（2026/08/04）

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

## Phase 3 — 專案骨架建立（2026/08/04）

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

## Phase 4 — 落地頁移植（2026/08/04）

**做了什麼：**
- 原始 HTML 989KB 太大無法一次讀取，寫了一支暫存的 Node script（`extract-assets.mjs`，只存在 scratchpad，沒有留在專案內）：用正規表達式找出所有 `data:image/...;base64,...` 內嵌圖片，解碼後依內容雜湊命名，各自存成獨立檔案到 `public/images/`，原本的 base64 字串換成短路徑 `/images/asset-xxx.png`。這一步把檔案從 989KB 壓到 63KB，才有辦法逐段讀取轉譯，總共取出 14 張圖片。
- 用 `sed` 依行號切出各區塊（CSS、nav、hero、活動資訊/who-should-attend、亮點、活動資訊 facts、議程、講者、夥伴牆、報名表單、script）分別存成小檔案逐一 Read，確保每一段文案都逐字核對過，不是憑印象重寫。
- 建立共用邏輯層：`lib/gtm.ts`（dataLayer 封裝 + 同意 cookie 讀寫）、`lib/utm.ts`（UTM 擷取與 sessionStorage 持久化）、`lib/form-options.ts`（表單選項清單，前後端共用避免漂移）、`lib/registration-schema.ts`（zod 驗證 schema）。
- 建立元件：`CtaLink`（CTA 點擊推 `cta_click`）、`LpViewTracker`（同意後推 `lp_view`，用 sessionStorage flag 確保只推一次）、`PageEffects`（1:1 移植原始 IntersectionObserver 淡入效果與 hero 滑鼠視差效果）、`PartnerWall`（夥伴卡片 + 介紹彈窗，含 8 家夥伴的完整簡介文字）、`ConsentBanner`、`GtmLoader`（依 `NEXT_PUBLIC_GTM_ID` 有無決定要不要注入腳本）、`RegistrationForm`（完整表單邏輯：必填驗證、複選群組至少一項的檢查、UTM 帶入、送出後導向感謝頁）。
- `app/globals.css`：原始 CSS 用 `sed` 整段搬過去（含尾端的「LIGHT THEME」覆寫層，這其實才是最終呈現的視覺——整份 CSS 是層層覆寫，最後一段淺色主題才是真正生效的樣式），另外在檔尾新增本次新元件（同意橫幅、感謝頁、後台）要用的樣式，全部沿用既有設計 token（`--green`/`--lime`/`.glass`/`.btn`），沒有引入新的視覺語言。
- `app/layout.tsx`、`app/seminar/0915/page.tsx` 組裝所有區塊。

**遇到的問題：** 無執行面問題，主要工作量在「怎麼在有限 token 內安全地搬移一份 989KB 的已核准設計稿而不打錯字」。

---

## Phase 5 — 報名 API（2026/08/04）

**做了什麼：**
- `lib/integrations/email.ts`、`meta-capi.ts`、`ragic.ts`：三個整合點都做成「沒憑證就 no-op + log，不拋錯」。
- `app/api/register/route.ts`：zod 驗證 → Prisma insert（唯一鍵衝突時視為重複送出，回傳原本的 `event_id` 而不是報錯）→ 觸發非同步寄信與 Meta CAPI → 回傳 `{event_id}`。

**遇到的問題／實作中修正：**
- 原始設計是「不 await 的 fire-and-forget」（`void sendConfirmationEmail(...)`）。但意識到 Next.js Route Handler 部署到 Vercel 這類 serverless 平台時，回應送出後 process 可能被直接凍結，naked `void fn()` 不保證背景工作真的會跑完。改用 Next.js 15 的 `after()` API，讓寄信/CAPI 這些背景工作在回應送出「之後」仍保證執行完畢，同時不阻塞、不拖慢使用者收到的回應時間。這點在 design.md 原本沒寫到這麼細，是實作時的補強。

---

## Phase 6 — 感謝頁（2026/08/04）

**做了什麼：**
- `components/AddToCalendar.tsx`：提供 Google 日曆連結（純 URL，不需要任何第三方帳號）+ `.ics` 檔案下載（前端用 Blob 產生），兩種都涵蓋，解決交接文件 §8.1 裡「這邊來得及加按鈕嗎？」的懸問。
- `components/ThanksTracker.tsx`：用 `useRef` 確保 `registration_submit` 只推一次。
- `app/seminar/0915/thanks/page.tsx`：Next.js 15 的 `searchParams` 是 Promise，要 `await` 才能讀到 query string（`eid`/`utm_*`），文案採用交接文件 §8.2 官方版本。

**遇到的問題：** 無。

---

## Phase 7 — 後台（2026/08/04）

**做了什麼：**
- `lib/session.ts`：HMAC 簽章的 session token，做單密碼登入。
- `middleware.ts` 保護 `/admin/*` 與 `/api/admin/*`（排除 `/admin/login` 與 `/api/admin/login`）。
- `app/api/admin/login`、`logout`、`registrations`（GET 清單+篩選）、`registrations/[id]/review`（標記已處理）、`registrations/[id]/resend`（重寄信）。
- `app/admin/login/page.tsx`、`app/admin/page.tsx`、`components/AdminTable.tsx`（搜尋/篩選/標記/重寄信，debounce 250ms）、`components/LogoutButton.tsx`。
- 刻意不做刪除鍵、不做整批匯出鍵——這是規格明文要求（PR 角色不能刪改、不能整批匯出），不是漏做。

**遇到的問題：**
- 原本 `lib/session.ts` 用 Node 內建 `crypto`（`createHmac`/`timingSafeEqual`）。中途發現 `middleware.ts` 預設跑在 Next.js 的 Edge runtime，Node 的 `crypto` 模組在 Edge runtime 不保證可用，若照原寫法上線，`/admin` 的保護機制可能直接在 middleware 這層炸掉。**改寫成只用 Web Crypto（`crypto.subtle`）**，這個 API 在 Node 18+ 跟 Edge runtime 都能跑，一次解決相容性問題。密碼比對也改用「先雜湊再逐字元比較雜湊值」的方式做基本的 timing-safe 比較（避免用 `crypto.timingSafeEqual`，因為那支也是 Node-only）。

---

## Phase 8 — 匯出（2026/08/04）

**做了什麼：**
- `scripts/export-registrations.ts`：CTO 本機執行 `npm run export:registrations`，輸出帶 BOM 的 UTF-8 CSV（確保 Excel 開繁體中文不亂碼）到 `exports/`（已加進 `.gitignore`，含個資不能進版控）。
- `app/api/export/route.ts`：另開一支 API，用**跟 `ADMIN_PASSWORD` 完全分開**的 `EXPORT_TOKEN` 驗證，且沒有在 `/admin` UI 裡放任何連結或按鈕指向它。
- `lib/integrations/ragic.ts`：no-op stub，只有這支匯出腳本會呼叫，不會被報名或後台的請求路徑觸發。

**遇到的問題：** 無。

---

## Phase 9 — Build 驗證（2026/08/04）

**做了什麼：**
- `npx prisma generate && npm run build`。
- 第一次執行就編譯成功，12 個路由（含 8 支 API route）全部產生，TypeScript 型別檢查通過。

**遇到的問題：** 無。

---

## Phase 10 — 瀏覽器端到端驗證（2026/08/04）

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

## Phase 11 — README 撰寫（2026/08/04）

**做了什麼：**
- 寫 `README.md`：專案是什麼、對應交接文件版本、部署狀態、怎麼跑起來、`.env` 逐項說明（誰提供/沒有時會怎樣）、`/admin` 使用說明、CTO-only 匯出說明、已知偏離計畫之處（SQLite）、§12 測試表對照（今天測過 vs 卡在憑證）、待確認事項、下一步時程（對照文件 §10）。

**遇到的問題：** 無。

---

## Phase 12 — OpenSpec tasks.md 同步（2026/08/04）

**做了什麼：**
- 把 `openspec/changes/add-seminar-registration-system/tasks.md` 所有項目改成 `[x]`，並在 1.3（Docker → Postgres）那項附註實際發生的偏離與原因，讓規格文件跟實際完成狀況保持一致，不是寫好就沒人管。

**遇到的問題：** 無。

---

## Phase 13 — Docker 二次確認（2026/08/04）

**做了什麼：**
- 先前那個逾時被丟到背景執行的 `docker info` 指令，事後回報「完成了（exit code 0）」，看起來像是 Docker 突然好了。
- 重新檢查該指令的實際輸出：內容只印到 Docker CLI 的 plugin 清單（`agent`/`ai`/`buildx`/`compose`/`debug`，這些都是 Client 端資訊），並沒有真正印出 Server 端狀態，代表當時其實還是沒有真正連上 daemon，只是指令本身不再無限期卡住而已。
- 為了確認，主動重新執行一次 `docker info`：得到跟一開始一模一樣的錯誤（`dockerDesktopLinuxEngine` pipe 連不上）。
- **結論：Docker 目前仍不可用，維持 SQLite 現況不強行切換**，避免在沒把握的狀態下改動已經驗證通過的資料庫層。等確認 Docker Desktop 能正常啟動、或 Supabase 帳號到位，再照 README 的切換步驟處理。

---

## Phase 14 — 本開發 Log 建立（2026/08/04）

- 把整個開發過程「by phase、step by step」完整記錄進一份開發 log。本檔案即為該紀錄，取代先前建立的簡版 `DEVLOG.md`（已刪除，內容整合進本檔並補齊 Phase 1 的規劃階段細節）。

---

## Phase 15 — README 補圖表與檔名調整（2026/08/04）

- 跑 `npx prisma migrate dev` 時要注意是 `npx` 不是 `npm`——`npm` 沒有 `prisma` 子指令；`package.json` 裡也提供 `npm run db:migrate` 這個別名可以用，避免打錯。
- 盤點「現在的網頁和 demo 原型 HTML 差在哪裡」，整理成一份對照表（送出邏輯、UTM、感謝頁、追蹤、確認信、Meta CAPI、後台、匯出），核心結論：畫面是同一套皮，差別都在「送出之後」的資料流與後台，追蹤／寄信這些第三方整合管線已經接好但因無憑證而是安全的 no-op。
- 把上述對照表寫進 `README.md`（新增「跟原型 HTML 差在哪」一節，放在系統架構圖之前）。
- 把檔名 `開發log.md` 改成 `devlog.md`（改用純英文檔名），同步修正 `README.md` 裡的所有連結與專案結構樹裡的檔名引用，以及本檔內部提到自己檔名的地方。

---

## Phase 16 — README 視覺整理（2026/08/04）

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

## Phase 17 — README 用詞專業化（2026/08/04）

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

## Phase 18 — 建立 GitHub Repo 並首次 push（2026/08/04）

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

## Phase 19 — 獨立 QA 測試、資料清理、README 同步更新（2026/08/04）

**做了什麼：**
- 開一輪獨立 QA 驗證，先讀完 7 份 capability spec、把 CTO 交接文件 §12 測試表 10 項逐一對應到 spec 需求，再實際跑起 app、逐項用瀏覽器與 API 執行測試（不是只看文件推論結果），並補測 spec 明文要求但未列在 §12 表格的項目（冪等性、匯出權限隔離、CTO 匯出腳本、Ragic no-op 等）。結果：**20 Pass、3 Blocked（#4 確認信／#7 GA4／#8 Meta 像素，皆待真實憑證，非缺陷）、0 Fail**。完整紀錄寫入 `qa/test-log-2026-08-04.md`。
- QA 過程中意外發現一個環境問題：長時間運行的 `next dev` 快取損毀，導致 `/seminar/0915/thanks` 一度回傳 500。查證方式是分別跑一次全新 `next build`（編譯正常）與重啟 `next dev`（立即恢復正常），確認是開發伺服器的快取問題、不是原始碼缺陷，重啟後排除。記錄為操作建議：8/5 測試窗口開始前先重啟一次 staging 服務，或改用 `next build && next start` 避開 dev 模式的快取風險。
- QA 期間累積了 5 筆可辨識的測試報名資料（`test+qa-*@example.com` 等）。後台故意沒有刪除功能，所以在刪除前先用 Prisma 查出全部 5 筆逐一核對 email 都符合測試資料格式，確認無誤後才在資料庫層執行 `deleteMany`，刪後再次查詢確認資料庫歸零，不是刪完就假設沒事。
- `qa/test-log-2026-08-04.md` commit + push 上 GitHub。
- 回頭把 QA 結果同步進 `README.md`：頂部狀態列與 `devlog.md` 連結旁新增 QA 紀錄連結；「§12 測試表對照」整節改寫成引用獨立 QA 複測結果（20/3/0），並把「快取損毀」的操作建議寫進去；「專案進度追蹤」新增「獨立 QA 測試」「測試資料清理」兩列（皆 `done`），新增「8/5 測試窗口前重啟 staging 服務」一列（`open`）。

**遇到的問題：** 無執行面問題；QA 發現的快取問題已在當次排除，不需要額外修復動作。

---

## Phase 20 — SQLite 定案、Turso 共用資料庫串接（2026/08/04）

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

## Phase 21 — Turso 降級為選用，改成純 SQLite 為預設（2026/08/04）

**背景：** 主管明確表示希望純用 SQLite 就好，並且部署（含網域）由主管方負責。這代表 Turso 不是必要條件，程式碼原本的設計（`TURSO_DATABASE_URL` 留空即回退本機檔案，見 Phase 20）剛好已經支援「純 SQLite」這個模式，不需要改程式碼；需要調整的是**文件的敘事重心**——原本把 Turso 寫成「解決共用問題的主要方案」，現在要倒過來，把純 SQLite 寫成預設、Turso 降級成選用附註。

**做了什麼：**
- 釐清一件容易被忽略的事，並直接寫進 README：**純 SQLite 不等於不用決定部署方式**。SQLite 是單一檔案，寫在哪台主機的硬碟上，就決定了「誰連得到」；這件事跟用不用 Turso無關，是任何 SQLite 部署都要面對的限制。用 AskUserQuestion 想確認部署方式時，使用者選擇「dismiss」（不想在這個時間點決定部署平台），隨後說明部署由主管方處理、含網域設定，工程端不用管平台選型。
- 既然部署方要另外決定主機，工程端唯一該提前講清楚的是：**該主機類型必須支援持久化硬碟**（SQLite 檔案寫入才留得住），**不能是 Vercel 這類 serverless／無狀態部署**——這不是效能問題，是選錯的話報名資料會真的消失。這件事寫進 README 三個地方：「資料庫架構」一節的專屬小標題、「待確認事項」新增一條請轉知主管、「專案進度追蹤」把「部署與網域」列成 `ongoing`（由主管方負責，工程端已告知限制）。
- 把 README「資料庫架構」一節整個倒過來寫：標題從「SQLite（本機檔案／Turso 共用）」改成「SQLite」；本文先講持久化硬碟這個硬性限制，Turso 整段降級成「（選用）Turso 共用資料庫」小節，說明是選用、不影響純 SQLite 部署，程式碼已經預留好但不強制。同步修正頂部技術棧 badge（拿掉 `via Turso` 字樣）、系統資料流圖的 DB 節點標籤（改成「部署主機硬碟上的檔案」，不再提 Turso 字樣）、`.env` 環境變數說明表（`TURSO_*` 那列標成「選用」、「留空即為純 SQLite」）、「專案進度追蹤」表（「Turso 帳號建立」這個待辦項目拿掉，改成「部署與網域」`ongoing`）。
- 沒有動到任何程式碼——這一輪純粹是把既有的（本來就支援純 SQLite 回退）行為，在文件敘事上調整成正確的優先順序。

---

## Phase 22 — 修正主管端 `/admin` 崩潰：資料庫未初始化未被攔截（2026/08/04）

**背景：** 密碼改成 `admin123` 之後，主管自己把 repo clone 到公司 AWS 工作機測試，`/admin` 畫面噴出一個 Next.js runtime 錯誤覆蓋層：`Failed to execute 'json' on 'Response': Unexpected end of JSON input`，出在 `components/AdminTable.tsx` 的 `res.json()`。

**診斷過程（先重現，不猜）：**
- 懷疑是資料庫沒初始化（clone 下來的新機器沒有 `prisma/dev.db`，這個檔案本來就被 `.gitignore` 排除）。實際重現：把本機 `dev.db` 備份後刪掉、重啟開發伺服器、用 `curl` 直接打 `/api/admin/registrations`（帶登入後的 cookie），拿到 `HTTP/1.1 500`，**body 完全是空的**——這正好對應瀏覽器端 `res.json()` 對空字串解析失敗的錯誤訊息。
- 查伺服器端 log 確認真正的例外：`PrismaClientUnknownRequestError ... SQLITE_ERROR: no such table: main.Registration`。根本原因：**資料庫檔案存在（libsql 第一次連線會自動建立空檔案）但裡面沒有任何資料表**，因為沒有人在這台新機器上跑過 `npx prisma migrate dev`。

**修的東西：**
1. `app/api/admin/registrations/route.ts`、`app/api/admin/registrations/[id]/review/route.ts`、`app/api/export/route.ts`：原本呼叫 Prisma 的地方完全沒有 try/catch，例外直接往上炸穿整個 route handler，Next.js 就回一個沒有 body 的 500。三支都補上 try/catch，抓到例外時回傳結構化的 `{ error: "資料庫查詢失敗，請確認資料庫已初始化（npx prisma migrate dev）" }` 並記 log，不再是空白 500。
2. `lib/integrations/email.ts` 的 `sendConfirmationEmail()`：函式上方註解寫著「Never throws」，但實際上 `prisma.registration.findUnique(...)` 那行在 try/catch 範圍外，違反了自己宣告的契約——如果資料庫有問題，這支函式其實會拋出例外。把整個函式本體（含 `findUnique`）都包進 try/catch，`markEmailStatus` 的失敗路徑也額外接 `.catch(() => {})`，讓「絕不拋出例外」變成真的成立，不只是註解說說而已。這連帶修掉 `/api/admin/registrations/[id]/resend/route.ts` 會被同一類例外炸穿的風險（該 route 直接 `await sendConfirmationEmail(id)`，先前完全沒有防護）。
3. `components/AdminTable.tsx`：`load()` 原本假設 API 一定回傳 `{registrations: [...]}`，例外只是讓 `res.json()` 直接炸掉整個元件（Next.js dev 模式顯示紅色錯誤覆蓋層，production 則是使用者只會看到一片空白或「發生錯誤」）。改成先判斷 `res.ok`，失敗時把後端回傳的錯誤訊息顯示在畫面上（新增 `loadError` state），並在 `fetch` 本身失敗（斷線）時也顯示對應訊息，而不是讓整個 React 元件掛掉。
4. 用同一招（刪掉 `dev.db`、重啟、重新走一次登入＋打 API）重新驗證：`/api/admin/registrations` 跟 `/api/export` 都改回傳 `200`／`500` 皆帶正確 JSON body；瀏覽器端 `/admin` 畫面直接顯示「資料庫查詢失敗，請確認資料庫已初始化（npx prisma migrate dev）」文字，不再是 runtime 錯誤覆蓋層。驗證完把備份的 `dev.db` 還原，`registration.count()` 確認資料還在（0 筆，符合 Phase 19 清理後的狀態）。

**同步修正的文件缺口：** README「測試步驟」原本寫「`.env` 已提供一份可直接執行之本機開發設定」——這句話只在這台開發機上成立，因為 `.env` 是我在本機手動建立的，從沒進過 git（`.gitignore` 排除，理所當然，機密不該進版控）。但這代表**任何一次全新 `git clone`（換機器、換人）都不會有 `.env`**，照原本步驟直接跑會在更早的地方就失敗（`SESSION_SECRET is not configured` 或密碼永遠對不起來）。改寫成明確的兩步驟：`cp .env.example .env` 並列出至少要填的三個變數（`ADMIN_PASSWORD`／`SESSION_SECRET`／`EXPORT_TOKEN`），以及為什麼漏掉任一步會出現什麼現象，讓下一台新機器（或下一個人）照著做就不會重踩同一個坑。

**根本原因總結**：這不是主管操作錯誤，是文件沒把「換一台全新機器」這個場景交代清楚（`.env` 建立步驟完全沒寫），疊加上 API 對這類環境問題完全沒有防護（例外直接讓回應變成空白）。兩個問題都已修正：文件補齊步驟，程式碼補上防護，兩者疊加確保下次同樣情境不會再變成一個看不懂的空白錯誤。

---

## Phase 23 — 交接文件 v3（0804）比對、議程管理 OpenSpec 規格（2026/08/05）

**背景：** 行銷／公關組提出新需求，交接文件更新到 v3（0804 版），比 0729 版多了 22 行內容。收到的指示是「詳細比對並且將比較結果新增至 openspec」，並點出主要新增功能：公關可從後台新增會議議程、更新到前端。

**做了什麼：**
- 用跟 Phase 1 同一套方法（PowerShell 把 docx 當 zip 解壓、解析 `word/document.xml`）把 0804 版完整抽成純文字（202 行 vs 舊版 180 行），逐段跟 0729 版對照，列出全部差異，不只挑使用者點名的那一項：
  1. 議程可由後台管理（點名的主要新功能）
  2. 報名頁換新子網域 `2026-forum.agatha-ai.com`
  3. GA4 已開通（`G-L8NZJXKM3J`）
  4. UTM 來源從 4 個增為 6 個（新增「合作夥伴」`utm_medium=referral`），且**不再分波次**（舊版的 wave1/2/3、edm1/2 這套 `utm_content` 區分方式在 v3 消失了）
  5. 名單匯出要求改成 Excel（.xlsx），且要「走權限控管並記錄 log」
  6. 後台 CMS 範圍其實遠大於議程——連 Banner、講者、合作夥伴、活動亮點、活動資訊、**報名表單欄**都要求可後台編輯
  7. 公關帳號要求改成「個別帳號，不可共用一組」，且「權限只綁這場活動，結束即回收」——這點跟現有 admin-console 的 V1 單一共用密碼設計直接衝突
  8. 後台要能「發送行前／會後通知」，不只是現有的單筆重寄確認信
  9. Meta Pixel 追蹤細節（§6.7）展開成 4 項重點，但核對後發現既有實作（event_id 去重、非個資參數、CAPI 雜湊）本來就已經涵蓋，不需要改動
  10. 投廣週報從每週一改每週三、8/19 起，欄位大幅擴充——純內部報表流程，不涉及本系統程式碼
  11. §12 測試計畫新增「CMS 編輯」「名單匯出」兩項測試，拿掉了波次區分測試
- 逐項核對「新來源 UTM／新增合作夥伴」對程式碼的實際影響：查 `lib/registration-schema.ts` 確認 `utm_source`／`utm_content` 從一開始就是自由字串（`z.string().optional()`），不是寫死的 enum，**新的 UTM 值完全不需要改程式碼**，這點直接記錄下來、不用另開工。
- 決定範圍：使用者明確點名「主要新增功能」是議程管理，其餘 10 項雖然都比對出來了，但沒有得到要動工的指示，所以**只針對議程管理寫 OpenSpec 規格**，其餘 10 項整理成一張表格記錄在 proposal.md 跟 README 裡，不擅自擴大範圍去猜測其他項目要不要做。
- 執行 `openspec archive add-seminar-registration-system -y`：這是本次第一次真的把已完成的 change 歸檔——先前只有一個 change 且從未跑過 archive，`openspec/specs/` 資料夾原本是空的。歸檔後 7 個 capability spec（landing-page、registration-api 等）正式落在 `openspec/specs/`，變成後續 change 可以參照／修改的「主真相」。這一步是必要的：如果不歸檔，新 change 想用 OpenSpec 慣例的「MODIFIED Requirements」引用既有 capability 時，會找不到 `openspec/specs/<capability>/spec.md` 這個檔案。
- 建立新 change `add-agenda-management`：
  - `proposal.md`：Why、完整 11 項比對表（含「本次是否處理」欄位）、Capabilities（新增 `agenda-management`，不修改任何既有 capability——查證後發現議程項目是跟報名資料完全不同的實體，admin-console 現有「不能刪除／不能整批匯出」的限制文字明確只針對報名資料，不影響議程 CRUD，所以不需要 MODIFIED delta）。
  - `design.md`：`AgendaItem` model 設計（`timeLabel` 用自由文字而非結構化時間，因為現有設計本來就是純顯示字串、不需要程式運算時長；`sortOrder` 用上下移動而非拖拉排序，因為議程項目數量小、拖拉排序的前端工程量不成比例）；落地頁直接在 server component 查 Prisma，不另開公開 API；沿用既有單一共用密碼保護議程管理，不因為這次新功能就提前做個別帳號（那是 v3 比對表第 7 項，明確列為未處理）；種子資料只跑一次，避免每次部署重複塞資料。
  - `specs/agenda-management/spec.md`：7 條 requirement（渲染、新增、編輯、刪除、排序、需要 admin 驗證），皆為 ADDED（新 capability，不影響既有 spec）。
  - `tasks.md`：5 組任務（資料模型、後台 API、後台 UI、落地頁改造、驗證），全部未勾選——這次只寫規格，沒有動一行 app 程式碼。
  - `openspec validate add-agenda-management --strict` 通過。
- 複製 0804 版 docx 進專案（比照 0729 版做法），把 `.gitignore` 裡原本寫死單一檔名的規則改成萬用字元 `Agatha_Seminar*CTO交接文件*.docx`，一次涵蓋所有版本，不用每次交接文件更新都手動加一行；用 `git check-ignore -v` 對兩個檔名都測過確認規則生效。
- README 新增「交接文件 v3（0804）更新對照」一節（摘要版比對表 + 連結到完整版），頂部規格文件連結改成指向歸檔路徑＋`openspec/specs/`＋新 change 路徑；「專案進度追蹤」新增 3 列：議程規格（`done`）、議程實作（`open`，待確認後排入開發）、v3 其餘新需求（`open`，記錄但未排程）。

**遇到的問題：** 無執行面問題。這次純粹是研究比對＋規格撰寫，沒有跑 build、沒有動 app 程式碼，故未執行驗證步驟。

---

## Phase 24 — 議程管理實作（`add-agenda-management` 落地）（2026/08/05）

**做了什麼：** 依 Phase 23 寫好的 OpenSpec 規格（`tasks.md` 5 組任務）逐項實作。

- **資料模型**：`prisma/schema.prisma` 新增 `AgendaItem`（`timeLabel`／`title`／`speaker?`／`isBreak`／`sortOrder`／`createdAt`／`updatedAt`），跑 `npx prisma migrate dev --name add_agenda_item`。migrate 前先照 Phase 20 學到的教訓，用 `Get-CimInstance` 找出殘留的 `node.exe` 行程（背景一直開著的 `npm run dev`）先關掉，避免 query engine dll 檔案被鎖住導致 `EPERM`。
- **種子腳本**：`prisma/seed-agenda.ts`，把原本寫死在 `page.tsx` 裡的 8 筆議程原封不動搬過去（時間、標題、講者、休息時段旗標皆逐字核對，不是憑印象重打），`sortOrder` 用 10 的倍數（10/20/30...）留間隔，方便之後在中間插入新項目不用整批重排；已有資料時自動跳過、不會重複塞。`package.json` 加 `npm run seed:agenda`。跑完直接查 DB 核對 8 筆內容與順序完全正確。
- **後台 API**：`app/api/admin/agenda/route.ts`（GET 列表／POST 新增）、`app/api/admin/agenda/[id]/route.ts`（PATCH／DELETE）、`app/api/admin/agenda/[id]/move/route.ts`（用 `$transaction` 交換相鄰兩筆的 `sortOrder` 做上下移動）。三支都比照 Phase 22 學到的教訓包了 try/catch，資料庫有問題時回結構化錯誤訊息，不會是空白 500。確認 `middleware.ts` 既有的 `/api/admin/:path*` matcher 本來就涵蓋這些新路徑，不用改 middleware。
- **後台 UI**：新增 `components/AgendaTable.tsx`（列表＋行內編輯表單＋新增表單，上下箭頭排序按鈕）與 `app/admin/agenda/page.tsx`，並在 `app/admin/page.tsx` 加一個「管理議程」連結。
- **落地頁**：把 `app/seminar/0915/page.tsx` 裡 8 段寫死的 `.ag__row` JSX 換成 `agendaItems.map(...)`，資料來源改成 `prisma.agendaItem.findMany({ orderBy: { sortOrder: "asc" } })`，查詢包 `.catch(() => [])`——資料庫有狀況時議程區塊安全地顯示空清單，不會拖垮整頁。HTML/CSS class（`.ag__row`／`.ag__row--break`／`.ag__time`／`.ag__t`／`.ag__spk`）完全沿用，只換資料來源。

**實作中發現、原計畫沒寫到的問題：**
- 把 `page.tsx` 改成 `async function` 查資料庫之後，`npm run build` 的輸出顯示 `/seminar/0915` 還是標成 `○`（Static）。查了一下 Next.js 的行為：沒有用到 `cookies()`／`headers()`／動態 searchParams 之類的動態 API 時，App Router 預設會在**build 當下**執行這個 async server component 一次、把結果烤進靜態 HTML，之後 `next start` 在 production 會一直吐同一份快取內容，**不會每次請求重新查資料庫**。這代表公關在後台改議程，正式環境上完全不會反映，除非重新 build＋部署——直接違反規格寫的「WHEN an admin updates ... THEN the landing page reflects the new speaker name on next load」。這個問題在 `next dev` 底下完全測不出來（dev 模式不管動態靜態分類、永遠重新 render），只有跑 `next build` 仔細看輸出的 route 分類符號才會發現，是那種「看起來能動、實際上悄悄壞掉」的 bug。加一行 `export const dynamic = "force-dynamic"` 解決，重新 build 後確認 route 符號從 `○` 變成 `ƒ`（Dynamic）。這件事也補寫回 `tasks.md` 的 4.3，跟 openspec 的紀錄保持誠實（不是原計畫就想到的，是實作中才發現）。

**驗證方式（都是瀏覽器/API 實際打過，不是只看程式碼）：**
1. `rm -rf .next && npm run build`，確認 `/seminar/0915` 是 `ƒ` 不是 `○`。
2. 開瀏覽器讀 `#agenda` 底下的 DOM，確認 8 筆、2 筆休息時段樣式正確、第一筆文字內容跟原本寫死的版本逐字相同（視覺 parity）。
3. 用 `fetch` 登入後新增一筆測試議程，**重新整理落地頁**（不是打 API 而已）確認新項目立刻出現在頁面上——這一步同時驗證了「後台改資料」跟「force-dynamic 修好了」兩件事，不能只驗其中一個就假設沒事。
4. 測 move up：確認該筆從第 9 筆移到第 8 筆，跟原本第 8 筆對調位置正確。
5. 測 PATCH：只改 `speaker` 欄位，確認 `title` 完全沒被動到（避免部分更新誤觸其他欄位）。
6. 測 DELETE：刪除測試項目後，`GET` 回傳筆數確認精準少 1 筆、回到原本 8 筆。
7. 用 `curl`（不帶 session cookie）直接打 GET／POST，確認回傳 307 導去 `/admin/login`，跟既有 `/admin` 路由的保護行為一致。
8. 用 `computer` 工具在瀏覽器裡對「編輯」按鈕做**真的滑鼠點擊**（不是只用 fetch 模擬），確認行內編輯表單真的會開啟/關閉——前面幾項都是打 API，這步才是真正驗證 React 元件本身接線正確。
- 全部測完，查資料庫確認議程表精準回到 8 筆（等於乾淨狀態），才把 dev server 關掉。

**同步更新：** `openspec/changes/add-agenda-management/tasks.md` 全部項目勾選並補上實作中發現的 4.3；執行 `openspec archive add-agenda-management -y` 歸檔，`agenda-management` capability 正式進入 `openspec/specs/`。README 新增「議程管理（`/admin/agenda`）」操作說明、「交接文件 v3 更新對照」表格狀態改成「已實作並驗證」、「測試步驟」補上 `npm run seed:agenda` 這一步（否則全新環境的議程區塊會是空的，同一類「文件沒寫清楚全新環境要做什麼」的坑，這次主動補上不等下次真的有人踩到）、專案結構樹更新（agenda 相關檔案、`openspec/specs`／`archive`、`qa/` 資料夾）、頂部規格文件連結指向正確的歸檔路徑。

## Phase 25 — 個別帳號＋角色權限、Excel 匯出實作（`add-admin-accounts` 落地）（2026/08/05）

**做了什麼：** 依 v3 比對表列出「要做」的兩項——公關個別帳號（v3 §6.9）、名單匯出改 Excel（v3 §6.3）——寫 OpenSpec 規格並實作，兩項合併成一個 change（帳號與匯出的權限判斷互相依賴，拆開會讓中間狀態無法自洽驗證）。

- **資料模型**：`prisma/schema.prisma` 新增 `AdminRole`（`CTO`／`PR`）enum、`AdminAccount`（email／passwordHash／name／role／active／lastLoginAt）、`AdminAuditLog`（accountId／action／detail／createdAt，僅記錄 login／export 兩類動作，不記錄每一次 CRUD——設計時就決定稽核紀錄要拿來回答「誰、何時、做了什麼敏感操作」，不是完整操作日誌）。跑 `npx prisma migrate dev --name add_admin_accounts`，一樣先用 `Get-CimInstance` 清殘留 node 行程避免 DLL 鎖住。
- **密碼與 session**：改用 `bcryptjs`（純 JS，避開 `bcrypt` 原生綁定在 webpack 打包時的老問題，跟當初 `@libsql/client` 需要 `serverExternalPackages` 是同一類坑，這次直接選開發階段就沒有這個坑的套件）。`lib/session.ts` 的 token payload 從 `<expires>` 改成 `<accountId>.<role>.<expires>`，簽章機制不變。新增 `lib/auth.ts` 放 `getCurrentAccount()`——刻意跟 `session.ts` 分開兩個檔案，因為 `next/headers` 的 `cookies()` 只能在 route handler／server component 用，不能在 Edge middleware 用，混在同一個檔案會讓 middleware 那邊 import 直接炸掉。
- **登入改造**：`app/api/admin/login/route.ts` 從比對單一 `ADMIN_PASSWORD` 改成查 `AdminAccount` by email、`bcrypt.compare`、檢查 `active`，並在同一個 `$transaction` 裡更新 `lastLoginAt` 與寫入 audit log，避免兩個寫入不同步。
- **帳號管理**：`app/api/admin/accounts/route.ts`（GET 列表／POST 新增）、`.../[id]/route.ts`（PATCH 停用／啟用／重設密碼），全部在 route handler 內部自行檢查 `role === "CTO"`，回 403，**不是只靠隱藏 UI 連結**；`app/admin/accounts/page.tsx` 額外加了 server-side redirect，PR 帳號直接打網址也會被導回 `/admin`，兩層防護而非各自信任對方。
- **Excel 匯出**：加 `exceljs`，把「建立 workbook」的邏輯抽成 `lib/export-workbook.ts`，讓 CLI 腳本（`scripts/export-registrations.ts`）、token 認證的 `/api/export`、session 認證的新端點 `/api/admin/export` 三處共用同一份欄位定義，避免將來欄位改一處漏另外兩處。`/api/admin/export` 額外在回傳前寫入 audit log。
- **UI**：`app/admin/page.tsx` 從伺服器端算出 `isCto`，「帳號管理」「匯出 Excel」兩個入口只在 CTO 角色渲染；議程管理連結兩角色都看得到。
- **Seed**：`prisma/seed-admin.ts`，仿照 `seed-agenda.ts` 的冪等寫法——資料庫已有任何帳號就跳過，否則從 `INITIAL_CTO_EMAIL`／`INITIAL_CTO_PASSWORD` 建立第一個 CTO 帳號；沒設這兩個環境變數就直接報錯中止，不會靜靜地不做事。

**實作中發現、原計畫沒寫到的問題：**
- ExcelJS 產生的 `Buffer`直接塞進 `new NextResponse(buffer, {...})` 在 `npm run build` 時報 TypeScript 錯誤（`Buffer` 不滿足 `BodyInit`），兩個匯出路由都要多包一層 `new Uint8Array(buffer)` 才過。
- 測試建立公關帳號時用 `curl -d '{"name":"QA 公關測試",...}'`，在這台 Windows／git-bash 環境下中文字真的被寫壞進資料庫（不只是顯示亂碼，直接查 DB 也是壞的）——這是 Phase 20 就踩過的同一個坑，這次直接改用 Node `fetch()` 送測試請求，繞過 `curl` 在這個環境下的編碼問題。壞掉的測試帳號後來刪除時又踩到第二個問題：因為它已經登入產生過 audit log，外鍵擋下直接刪除——這正是「停用不刪除」設計要保護的情境，不是 bug，照設計先刪 audit log 再刪帳號完成清理。

**驗證方式：**
1. `npm run build` 通過（含上述 `Uint8Array` 修正）。
2. Seed 一個 CTO 帳號，登入後確認既有報名／議程功能不受影響。
3. 從 `/admin/accounts` 建一個 PR 帳號，登入後確認：報名／議程功能正常、看不到帳號管理連結、看不到匯出按鈕、直接打 `/admin/accounts` 網址被導回 `/admin`、直接呼叫匯出 API 收到 403（不是只有 UI 藏起來）。
4. 停用該 PR 帳號，確認無法再登入（401）。
5. CTO 角色匯出後，把下載回來的 `.xlsx` 用 `exceljs` 讀回來核對筆數與欄位值，不是只看 HTTP 狀態碼跟 content-type 就當作過關。
6. 確認登入與匯出兩個動作都正確寫進 `AdminAuditLog` 並可對應到正確的帳號。
7. 確認舊的 `ADMIN_PASSWORD` 登入方式（環境變數已移除）無法再使用。

**OpenSpec archive 過程踩的坑：** `openspec archive add-admin-accounts -y` 連續失敗三次，都是同一類錯誤——MODIFIED requirement 的標題／scenario 名稱寫成新的措辭，但 OpenSpec 要求 MODIFIED 區塊的標題要跟現有 spec **逐字相同**（空白不敏感），且不能讓現有 scenario 名稱在新版本裡憑空消失（validator 會擋，因為這代表可能悄悄遺失了原本的驗證情境）。修法固定：改標題／scenario 名稱時，先用 `openspec validate --strict` 看錯誤訊息裡指名的「原文」，把它逐字放回去，新的差異用「新增一個 scenario」的方式表達，而不是「把舊的改名」。`admin-console`、`data-export` 兩份 delta spec 都是這樣修好的，修完 `validate --strict` 過、`archive` 成功，`admin-accounts` capability 正式進入 `openspec/specs/`，`admin-console`／`data-export` 也同步更新。

**同步更新：** `openspec/changes/add-admin-accounts/tasks.md` 全部項目勾選並補上測試備註；歸檔為 `2026-08-05-add-admin-accounts`。README 多處更新：專案說明、與原型 HTML 差異表、v3 更新對照表（帳號＋匯出兩項改為「已實作並驗證」）、角色與分工、系統資料流圖、專案結構樹、測試步驟（補 `seed:admin`、拿掉 `ADMIN_PASSWORD`）、`.env` 變數說明表、`/admin` 操作說明（改寫為個別帳號，新增「帳號管理」小節）、名單匯出說明（CSV 改 `.xlsx`，補第二條 `/admin` 內建按鈕路徑）、§12 測試表（匯出權限隔離改成角色判斷、新增稽核紀錄測項）、待確認事項、後續規劃、專案進度追蹤表（新增帳號管理／Excel 匯出／稽核紀錄三個 `done` 項目，拿掉已完成的 Phase B 項目）。

## Phase 26 — 講者／合作夥伴／活動亮點 CMS 實作（`add-content-cms` 落地）（2026-08-05）

**做了什麼：** v3 比對表排定要做的三項 CMS 區塊（講者、合作夥伴、活動亮點），完全比照 `agenda-management` 已經驗證過的模式——同一組 admin session（CTO／PR 皆可操作，不像帳號管理／匯出限定 CTO）、`sortOrder` 上下箭頭排序、落地頁直接查 Prisma、首次上線用種子資料填入現有內容。三個實體放進同一個 change，因為它們是同一類問題的三次重複，拆成三個 change 只會製造不必要的流程開銷。

- **資料模型**：新增 `Speaker`（name／title／bio／photoUrl?／confirmed／sortOrder）、`Partner`（name／description／logoUrl／sortOrder）、`Highlight`（title／body／sortOrder），三個 model 一次 `npx prisma migrate dev --name add_content_cms` 解決，不分開 migrate（同批上線，沒有分批的理由）。
- **設計決策：圖片只能貼網址，不做檔案上傳**：這個專案目前完全沒有檔案上傳的基礎建設（儲存、驗證、大小限制都沒有），而 v3 待辦裡另外有一項「Banner 上傳」明確需要同一套基礎建設。與其在這次順手做一個陽春版上傳擠進來，design.md 明確把這個決定記下來：圖片／Logo 一律是文字網址欄位，PR 自己找地方放好圖片（工程協助丟到 `/public/images/`，或用外部圖床），真正的上傳能力等 Banner 那個 change 一起做，不要兩邊各做一半、互相打架。
- **講者的「已確認」欄位吸收了原本三種視覺狀態**：原始寫死的頁面其實有三種講者卡片樣式——已確認有照片、已確認但「照片待提供」、完全「待確認」帶徽章。這次沒有為此加第三個欄位，而是讓 `confirmed`（boolean）跟 `photoUrl`（nullable）兩個獨立欄位組合出三種狀態：`confirmed=true` 且有 `photoUrl` → 正常卡片；`confirmed=true` 但 `photoUrl` 是 null → 「照片待提供」；`confirmed=false` → 「待確認」徽章樣式，不管有沒有照片。這是內容簡化，不是漏做功能——公關兩個欄位打勾/填空就能表達所有原本的狀態組合。
- **`PartnerWall.tsx` 從硬編碼陣列改成 props 驅動**：這個元件是 `"use client"`（要用 `useState`做點擊 Logo 彈窗），沒辦法自己 `await prisma`，所以維持原本的元件介面設計，只是把資料來源從模組層級的常數陣列改成從 server component（`app/seminar/0915/page.tsx`）查完 Prisma 之後往下傳的 prop——跟 `agendaItems` 已經在用的模式完全一樣，只是這次多一層「client 元件本身不能查資料庫」需要繞過去。
- **後台 API／UI**：三組各自的 `route.ts`（GET/POST）、`[id]/route.ts`（PATCH/DELETE）、`[id]/move/route.ts`（上下排序），連同對應的 `SpeakerTable.tsx`／`PartnerTable.tsx`／`HighlightTable.tsx`／`app/admin/{speakers,partners,highlights}/page.tsx`，逐字比照 `AgendaTable.tsx`／`app/api/admin/agenda/*` 的結構，刻意沒有抽共用元件——三個實體的欄位形狀不一樣（講者要處理已確認/照片兩個獨立狀態、夥伴要處理彈窗介紹文字、亮點只有標題內容兩欄），硬要抽一個共用的「內容區塊」抽象只會把欄位驗證邏輯從 schema 挪到應用層，換不到什麼好處，design.md 的 Non-Goals 也明確記下這個決定。
- **種子資料**：`prisma/seed-speakers.ts`（8 筆）／`seed-partners.ts`（8 筆）／`seed-highlights.ts`（4 筆），逐字核對原始寫死內容（不是憑印象重打），沿用 `seed-agenda.ts` 的冪等寫法，各自對應 `npm run seed:speakers`／`seed:partners`／`seed:highlights`。

**驗證方式（瀏覽器實際操作，不只是看程式碼或打 API）：**
1. `npm run build` 通過。
2. 種子跑完後，用瀏覽器 `read_page` 讀出落地頁「活動亮點」「講者陣容」「合作夥伴」三個區塊的完整內容，逐項核對跟原本寫死的版本文字一致——包含兩筆「待確認」講者的徽章樣式、陳伊誠「照片待提供」的樣式都正確重現，不是只驗證「有東西顯示」。
3. 以 CTO 帳號登入，在講者管理頁實際新增一筆測試講者（真的點按鈕、真的填表單，不是打 API 模擬），確認出現在列表最後、預設為「已確認」狀態；再實際點刪除，確認列表精準回到原本的 8 筆。
4. 確認 `/admin` 首頁的巡覽列正確顯示「管理講者」「管理夥伴」「管理亮點」三個連結，且跟「管理議程」一樣不受 CTO-only 判斷影響（PR 角色也看得到）。
5. 直接用 `curl`（不帶 session cookie）打三組新 API 與其中一個新頁面，確認全部回 307 導去登入頁——確認新路由有被 `middleware.ts` 既有的 `/api/admin/:path*`／`/admin/:path*` matcher 涵蓋，不需要額外設定。
6. PR 角色能否操作這三個功能沒有另外重新登入手動測，因為六支新 route handler 逐一檢查過原始碼，沒有任何一支呼叫 `getCurrentAccount()` 或檢查 `role`——跟 `agenda-management` 已經驗證過的「無角色限制」是同一套機制、同一份程式碼形狀，屬地驗證即可，記在 `tasks.md` 裡註明是用程式碼檢查而非重複手動測試。

**同步更新：** `openspec/changes/add-content-cms/tasks.md` 全部項目勾選（除了空狀態的重複驗證明確標記為跳過並附理由）；歸檔為 `2026-08-05-add-content-cms`。README 更新：專案說明（新增四條 `/admin/*` 內容管理路由）、v3 更新對照表（講者/夥伴/亮點 CMS 改為「已實作並驗證」）、專案結構樹、測試步驟（補三個 seed 指令）、`/admin` 操作說明（新增「內容管理」小節，說明圖片只能貼網址的限制與原因）、專案進度追蹤表。同步更新 [DEPLOYMENT.md](DEPLOYMENT.md) 的部署步驟與上線前檢查清單，把新增的三個 seed 指令補進去，並把「這幾步最容易漏跑」的提醒寫得更明顯——呼應同一天稍早在 EC2 上真的漏跑過 `seed:admin`／`seed:agenda` 兩次的教訓，不能只加進文件就假設下次不會再漏。

## Phase 27 — 報名表單選項清單 CMS 實作（`add-form-options-cms` 落地）（2026-08-05）

**做了什麼：** v3 待辦裡「表單欄」這項的範圍，先跟你確認過只做「選項清單可編輯」，不做完整表單建構器（欄位種類、順序、單複選型態都維持寫死）。這個範圍界定直接影響了資料模型設計——不是比照議程/講者/夥伴/亮點各開一個 model，而是一個 `FormOption` model 涵蓋 7 個既有欄位（dept/title/industry/size/sessions/stage/consult），用 `field` enum 欄位區分，因為這 7 個欄位的形狀完全一樣（一個值＋一個排序），分開開 7 張表只是重複同一套 CRUD 邏輯 7 次。

- **資料模型**：新增 `FormOptionField` enum（DEPT/TITLE/INDUSTRY/SIZE/SESSIONS/STAGE/CONSULT）與 `FormOption` model（field／value／sortOrder），`@@unique([field, value])` 防止同一欄位塞進重複選項。`npx prisma migrate dev --name add_form_options`。
- **這次真正新的工程難題（跟前三次 CMS 不一樣的地方）**：`lib/registration-schema.ts` 原本的 `registrationSchema` 是模組載入時就建好、之後每次請求重複使用的常數——這在選項是編譯期常數時沒問題，但選項一旦變成後台可編輯，這個常數就會跟資料庫脫鉤。改成 `buildRegistrationSchema(options)` 函式，`app/api/register/route.ts` 每次請求都先查一次目前的 `FormOption`，用查到的清單現組一份 schema 再驗證——這保證了「表單上看到的選項」跟「API 實際接受的選項」永遠是同一份資料源，不會有表單給了選項但 API 卻拒絕、或表單沒給的選項 API 卻收的落差。
- **「最後一個選項不可刪除」是為了保護這個機制，不是隨意加的限制**：`z.enum()` 需要非空的 tuple，如果一個欄位被刪到剩 0 個選項，動態組 schema 這一步會直接壞掉。所以在 admin 的 DELETE 端點加了一個檢查：這個欄位目前選項數量 ≤ 1 就拒絕（400），從寫入端保證「欄位永遠至少有 1 個選項」，比在讀取端（組 schema、渲染表單）處理「空清單」這個邊界情況更簡單、更誠實。
- **「其他」選項不需要特殊處理**：原本以為要保留「選了『其他』才顯示自由文字欄位」這個行為，結果檢查 `globals.css` 才發現 `.fother--sel { display: block }`，這個自由文字欄位本來就是**一直顯示**、沒有跟著選什麼而顯示/隱藏的 JS 邏輯。所以「其他」在這次的 CMS 裡就是一個普通的、可編輯的選項字串，不需要額外接線——少了一項原本以為會有的複雜度。
- **後台 API 按欄位參數化，不是 7 組獨立路由**：`app/api/admin/form-options/route.ts`（GET 全部）、`.../[field]/route.ts`（POST 新增）、`.../[field]/[id]/route.ts`（PATCH／DELETE）、`.../[field]/[id]/move/route.ts`（排序），`[field]` 這個 URL 參數會對照 `FormOptionField` enum 驗證，不合法的欄位名稱直接 400。後台畫面同理，`FormOptionsTable.tsx` 一個元件用 `.map()` 把 7 個欄位的區塊畫出來，不是複製貼上 7 份幾乎一樣的 JSX，也不是開 7 個獨立頁面——跟「只做選項清單，不做表單建構器」這個範圍界定一致，UI 也不需要比照議程/講者/夥伴/亮點那樣一個功能一個 nav 連結。
- **`RegistrationForm.tsx` 改成 props 驅動**：原本直接 `import` `lib/form-options.ts` 的常數，現在改成從 `app/seminar/0915/page.tsx`（server component）查完 `FormOption` 之後往下傳。`lib/form-options.ts` 的常數沒有刪除，改成只給種子腳本讀取，執行期的表單渲染和驗證都不再碰它。

**驗證方式（這次特別針對「動態 schema」這個新機制做了額外測試，不只是照抄前幾次 CMS 的驗證清單）：**
1. `npm run build` 通過。
2. 種子跑完後，瀏覽器 `read_page` 讀出報名表單全部 7 個欄位、40 個選項，逐項核對跟原本寫死版本一致（順序、內容都對）。
3. **實際在瀏覽器裡把整張報名表單填完、按下送出**（不是打 API 模擬，是真的觸發表單的 submit handler），確認成功導向 `/thanks` 並帶著真實的 `event_id`——這一步同時證明了「動態組出來的 schema」跟「畫面實際渲染的選項」是同一份資料，不會表單給了 A 選項但 schema 卻不認得。
4. 用 CTO session 直接打 API：把 `SIZE` 欄位（4 個選項）刪到剩 1 個，確認前 3 次刪除都成功、第 4 次（最後一個）被拒絕並回 400，訊息清楚說明原因；刪完之後用新增＋排序 API 把 3 個選項原樣復原，最終順序跟原始種子資料逐一核對一致。
5. 拿一個剛剛被刪掉的選項值（`size: "50人以下"`）直接打 `/api/register`，確認被 400 拒絕、錯誤訊息明確指出是哪個欄位的哪個值不合法，不是 500 也不是被靜默接受。
6. 用 `curl`（不帶 session cookie）直接打新的 admin API 與新的 admin 頁面，確認都回 307 導去登入頁。
7. 六支新 route handler 逐一檢查過原始碼，沒有任何一支呼叫 `getCurrentAccount()` 或檢查 `role`，跟前三次 CMS 一樣是「CTO／PR 皆可操作」，這次也是用程式碼檢查代替重複的手動雙角色登入測試。
8. 測試產生的報名資料（含被拒絕的那筆，實際上因為驗證失敗根本沒有寫入）事後查資料庫確認清乾淨，只留下一筆需要清除、清除後歸零。

**同步更新：** `openspec/changes/add-form-options-cms/tasks.md` 全部項目勾選並補上測試備註（含 `SIZE` 選項 id 在復原後跟原始種子不同、但內容與順序一致，不影響任何東西，因為 `Registration.size` 是純文字欄位不是外鍵）；歸檔為 `2026-08-05-add-form-options-cms`。README 更新：專案說明、v3 更新對照表（表單選項清單 CMS 改為「已實作並驗證」）、專案結構樹（新增 `lib/form-options-db.ts`、`FormOption` model、`form-options` 相關路由與元件）、測試步驟（補 `seed:form-options`，並特別註明漏跑這一步會讓報名功能整個壞掉、不只是畫面空白）、`/admin` 操作說明（新增「內容管理：報名表單選項清單」小節，說明範圍限定與同步機制）、專案進度追蹤表。同步更新 [DEPLOYMENT.md](DEPLOYMENT.md) 的部署步驟／檢查清單，把 `seed:form-options` 補進 seed 指令清單。

## Phase 28 — Banner 上傳＋活動資訊 CMS：只寫規格，不實作（`add-banner-event-info-cms`）（2026-08-05）

**做了什麼：** v3 待辦清單裡最後兩項未處理的 CMS 區塊——Banner 上傳、活動資訊——這次按照原本排定的範圍**只寫 OpenSpec 規格，不動一行程式碼**。跟前四次 CMS change 最大的差異：這次刻意不實作，是因為 Banner 上傳需要這個專案目前完全沒有的檔案上傳基礎建設（儲存位置、驗證、尺寸檢查都還沒有任何雛形），貿然邊做邊決定架構風險比先寫清楚規格、留給下一輪實作時直接照著做更高。

- **先去交接文件 v3（0804）原文核對確切措辭，不是憑印象寫規格**：這台機器上就有 docx 檔案（`Agatha_Seminar_報名系統與追蹤_CTO交接文件_0804.docx`），用 `anthropic-skills:docx` 技能提示改用 `unzip` + 從 `document.xml` 抓 `<w:t>` 文字節點的方式取出純文字（環境裡沒裝 pandoc），核對到 §6.2 的精確規格：「Hero 主視覺 Banner 可上傳規格：桌機 2560×1440（16:9）、手機 1080×1350（4:5），安全區置中」——這組精確尺寸就直接寫進了 proposal.md 引用與 design.md 的資料模型注解，不是我自己編的數字。
- **辨認出這兩個功能跟前四次 CMS 是不同的資料形狀**：議程/講者/夥伴/亮點/表單選項清單都是「PR 管理一個可增減、可排序的清單」；但 Banner 永遠只有一組現正使用中的圖（不是清單），活動資訊永遠剛好是 4 張固定卡片（Date/Time/Venue/Access，順序也固定，不能增加第 5 張或刪掉某一張）。design.md 把這個差異寫成明確的設計決策：`Banner` 用單例模式（`id` 固定字面值，永遠只有一筆）、`EventInfo` 用 `field` enum 加 `@unique` 保證剛好 4 筆、後台 API 只給 PATCH 不給 POST/DELETE——用資料結構本身防止「不小心新增第二個 Banner」或「刪掉 Venue 那張卡」，不是靠 UI 客氣地不提供按鈕。
- **老老實實列出還沒決定、需要之後實作時再拍板的問題**，而不是每個都自己隨便決定掉：尺寸不符時要硬擋還是只警告、要不要上傳時順手用 sharp 壓縮、換圖之後舊檔案要不要清掉、後台要不要做預覽——這四個在 design.md 的「Open Questions」單獨列出來，因為這個專案裡沒有任何既有先例可以直接套用，是產品/設計層級的判斷，不該由我這輪單方面決定掉再假裝是定案。
- **順手指出一個之前沒注意到、這次才浮出來的既有缺口**：`DEPLOYMENT.md` 已經寫明目前完全沒有備份機制，這次的上傳檔案（存在 `public/uploads/`，不進 git）會是第二個掉進同一個坑的東西，design.md 跟 tasks.md 都記了一筆，等真的要做備份機制時記得把上傳檔案也算進去，不是只顧資料庫檔案。

**跟前四次 CMS change 的流程差異：** 只跑了 `openspec validate --strict`（通過），**沒有跑 `openspec archive`**——archive 是給「已經照 tasks.md 做完」的 change 用的，這個 change 的 tasks.md 全部項目刻意保持未勾選並在檔案開頭加一行「以下任務尚未開始實作」的提醒，所以 change 本身留在 `openspec/changes/add-banner-event-info-cms/`（不在 `archive/` 底下），跟其他已完成、已歸檔的四個 change 用資料夾位置本身區分清楚「這個還沒做」。

**同步更新：** README 多處更新，全部用「規格已完成、尚未實作」這個明確措辭，不跟其他已驗證完成的項目混在一起看起來像做完了——頂部規格文件連結段落（新增一句指向未歸檔的這個 change）、v3 更新對照表、目前狀態摘要句、後續規劃（Phase B 那條）、專案進度追蹤表（新增一列，狀態 `open` 並註明「規格已完成」，跟其他 `done` 列在視覺上區分開）、講者/夥伴 CMS 小節裡原本提到「之後會跟 Banner 上傳一起處理」的那句補上規格連結。

## Phase 29 — 後台 CRUD 修樣式、排序改成拖曳（2026-08-05）

**做了什麼：** 兩件事，都是主管實際用過後台之後回報的體驗問題。

- **修樣式**：主管截圖回報帳號管理／議程／講者／夥伴／亮點／表單選項六個後台新增表單長得很醜。查原因：這六個元件裡的 `<input>`／`<textarea>`／`<select>` 全部沒有加 CSS class，退回瀏覽器原生樣式（沒有 padding、邊框很細）；前台報名表單用的 `.finput`／`.fselect` 樣式從一開始就沒有被套用到這幾個後台元件上——只有最早期（Phase 7）就存在的報名列表篩選欄位因為包在 `.admin__filters` 裡才躲過這個問題。修法直接了當：六個元件的每個表單欄位都補上 `.finput`（select 再加 `.fselect`），逐一在瀏覽器截圖比對過跟前台一致。
- **排序改拖曳**：主管接著要求把議程／講者／夥伴／亮點／表單選項五處可排序的清單，從「上下箭頭按鈕」改成「拖曳＋三條橫槓（☰）握把」。這不是單純前端小改動，牽涉到排序資料怎麼送回後端：
  - 原本的「上移／下移」API 一次只交換相鄰兩筆的 `sortOrder`，拖曳排序需要的是「使用者放開滑鼠時，告訴後端完整的新順序」，兩種操作的資料形狀不一樣。新增一組 `POST .../reorder` API（agenda／speakers／partners／highlights／form-options 各一支，表單選項那支還要多驗證 `[field]` 參數），body 帶完整排序後的 id 陣列，後端在同一個 `$transaction` 裡把每筆的 `sortOrder` 設成 `(index+1)*10`——比起串接多次「上移一格」呼叫，這是一次到位、原子性的寫法。
  - 舊的「上移／下移」API（`[id]/move/route.ts`）確認沒有其他呼叫端之後直接刪除，不留死代碼，對應的空資料夾也清掉了。
  - 前端沒有用瀏覽器原生的 HTML5 `draggable` 拖曳 API——那套機制在自動化測試工具下很難穩定觸發（原生拖放事件不是單純的滑鼠事件，CDP 自動化工具通常無法可靠模擬），改用滑鼠事件手刻：在握把上 `onMouseDown` 記錄正在拖曳的項目、在每一列 `onMouseEnter` 記錄目前懸停在哪一列、全域 `mouseup` 時才真正送出新順序給後端。這樣不但比較好測試驗證，程式碼也更直接可控（拖曳中的視覺回饋：被拖曳的那列半透明、懸停中的那列上緣有綠色提示線）。
  - 表單選項那個元件比較特別：7 個欄位的選項其實是同一個全域清單、用 `field` 篩選顯示，拖曳排序要限制在同一個欄位內才有意義——`persistReorder` 裡明確擋掉「起點跟終點屬於不同欄位」的情況，避免使用者不小心把「所屬部門」的選項拖進「職稱」欄位去。

**驗證方式：** `npm run build` 過。瀏覽器裡登入後六個後台畫面逐一截圖確認樣式修好了。議程管理實際拖曳一筆項目、重新整理頁面確認新順序有正確寫進資料庫（不是只有畫面上暫時對、實際沒送出去），再拖曳回原位。表單選項管理也實測拖曳排序有效，同樣拖回原位、逐項比對過跟原始種子順序完全一致才收尾。

**同步更新：** 這次是既有功能的 UI 呈現方式調整（排序機制從按鈕換成拖曳），沒有動到 OpenSpec 規格裡「管理員可以改變顯示順序」這個需求本身的描述（規格沒有規定用什麼互動方式達成排序），所以沒有另開 OpenSpec change 或補 MODIFIED delta，只記在這裡。

## Phase 30 — 交接文件 0805/0806 更新：GTM／GA4 憑證到位、追蹤事件改版（`update-tracking-integration`）（2026-08-06）

**做了什麼：** Lindy 於 2026/08/06 轉發交接文件 0805 修訂版（`Agatha_Seminar_報名系統與追蹤_CTO交接文件_0805.docx`），訊息裡特別點名「GTM 碼安裝、報名流程設定（感謝頁＋發送報名確認信）、埋 UTM」是這次更新的重點。跟前面幾次交接文件比對一樣，先把新舊兩版 docx 解壓、抓出純文字逐段比對（環境裡沒裝 pandoc，沿用 Phase 28 建立的 `unzip` + 抓 `<w:t>` 節點做法），確認實際變動範圍再動手。

- **GTM／GA4 真實憑證第一次到位**：GA4 評估 ID `G-C2D5DC3DLS`（已開通）、GTM 容器 `GTM-M583KSV7`（已開通，文件內附完整 `<head>`／`<body>` 貼上程式碼，跟 `components/GtmLoader.tsx` 既有的注入邏輯逐字比對完全一致，代表這段程式碼從一開始的「設定驅動、真實 ID 隨時可插」設計是對的，不需要改程式碼，只需要在正式部署的 `.env` 填入這兩個值）。
- **這次真正的需求變化，不是「多了憑證」，是「追蹤層的責任歸屬換人」**：0805 版文件 §5.1／§6.9 明確把「GTM Container 維護、GA4 Tag 建立、Meta Pixel／Meta Pixel Tag 建立、Trigger 設定、GTM Preview 測試」全部劃給鼎東（公關公司的技術團隊），湧現（CTO）只剩「Landing Page、CMS、Database、報名資料、Excel 匯出」。這跟 0804 版預設「CTO 自己埋 GTM／GA4／Meta」完全不同——原來公關公司自己有技術團隊，直接把追蹤層的維運責任接走了。
- **GA4 主轉換事件（Key Event）的做法整個換掉**：文件明文寫「本次不另外建立 `registration_submit` 事件；GA4 以 `generate_lead` 作為正式報名完成事件」，且 `generate_lead` 的觸發條件是「Trigger: `page_view`；Page Location contains: `/seminar/0915/thanks`」——這是鼎東在 GTM／GA4 後台直接設定的網址比對 Trigger，不是我方程式碼推的事件。Meta 的 Lead 事件同理，文件建議「以 Thanks Page 作為完成事件，避免使用 Submit Button Trigger」。這代表原本 Phase 6 做的 `ThanksTracker` 元件（推 `registration_submit` 這個自訂事件）從一開始設計的「GTM Trigger 監聽這個自訂事件」這條路徑，現在確定不會有任何 Trigger 去接它了——留著會讓人誤以為它還有作用，直接刪除比留著當死代碼誠實。
- **順手抓到一個既有、跟這次文件更新無關、但剛好在逐字核對確認信文案時發現的小 bug**：確認信主旨/內文、感謝頁、加入行事曆檔案這三處的活動名稱寫成「製造業 **Agentic** AI 商用實戰論壇」，但 0804／0805 兩版文件的官方文案（§8.1／§8.2）都一致寫「製造業 AI 商用實戰論壇」（沒有「Agentic」），跟網站標題列、落地頁頁尾已經正確不含「Agentic」的版本不一致——三選一複製貼上時多打了一個字，藉這次逐字核對文案的機會一併修正，沒有另開一個 change。

**OpenSpec 處理方式：** 新開 `update-tracking-integration`，MODIFIED `tracking-integration`（事件字典從 3 個事件改成 2 個前端事件＋外部 GTM Trigger 的說明，沿用 `admin-console` 那次學到的「保留原本 scenario 名稱、標題逐字比對」做法）；`thank-you-page` 的「頁面載入時推送轉換事件」這條需求改用 **REMOVED + ADDED**（不是 MODIFIED）——因為這不是同一件事换个说法，是「我方程式碼做 X」變成「我方程式碼什麼都不用做，交給外部設定」，機制整個換了，硬塞進 MODIFIED 只會產生一個文不對題的 scenario。

**程式碼變動：**
- `lib/gtm.ts`：`DataLayerEvent` 型別拿掉 `registration_submit`，只剩 `lp_view`／`cta_click`。
- 刪除 `components/ThanksTracker.tsx`；`app/seminar/0915/thanks/page.tsx` 拿掉它的 import／使用，順便發現整個 `searchParams`（`eid`／utm_*）在拿掉 tracker 之後，這個頁面本身完全沒有其他地方在讀它，乾脆把整個 prop 一起清掉，不留半用的殘骸。
- `components/AddToCalendar.tsx`、`lib/integrations/email.ts`：修正「Agentic」文案。
- `lib/integrations/meta-capi.ts`：驗證階段發現一處過期註解還在提「client-side registration_submit dataLayer event」，改寫成現在實際的去重機制說明（`event_id` 透過感謝頁網址的 `?eid=` 帶出去，供鼎東設定的 Meta Pixel 標籤讀取比對，不是靠我方推事件）。

**驗證方式：**
1. `npm run build` 過。**發現一個非預期但正確的副作用**：`/seminar/0915/thanks` 從 `ƒ`（Dynamic）變回 `○`（Static）——因為拿掉 `searchParams` 之後這個頁面真的完全不依賴每次請求的資料了，Next.js 正確判斷可以靜態化。這跟 Phase 24 踩過的「該動態卻被靜態化」是反過來的情況：那次是 bug（該動態的被錯誤靜態化），這次是「本來該動態、拿掉依賴後現在真的可以靜態化」，先確認清楚兩者不是同一回事，不是重蹈覆轍。
2. 全域搜尋 `registration_submit`／`ThanksTracker`／「Agentic AI 商用實戰論壇」確認程式碼裡沒有殘留（`meta-capi.ts` 裡抓到一處過期註解，已修正；`devlog.md` 裡舊 phase 的歷史紀錄保留不動，那是忠實記錄「當時做了什麼」，不是現在的程式碼狀態，沒有理由回頭改寫歷史）。
3. 瀏覽器開感謝頁確認文案正確顯示「製造業 AI 商用實戰論壇」（無 Agentic）、console 沒有錯誤（`ThanksTracker` 拿掉後不會有孤兒 import 報錯）。

**同步更新：** `openspec/changes/update-tracking-integration/tasks.md` 全部項目勾選，`openspec validate --strict` 過後歸檔為 `2026-08-06-update-tracking-integration`。README 多處更新：專案說明（感謝頁描述）、與原型 HTML 差異表（追蹤事件說明、新增一列記錄這次更新）、交接文件 v3 更新對照（標題改成同時涵蓋 0804／0805-0806，新增一列）、角色與分工（鼎東角色範圍大幅擴大，明確標註 2026/08/06 更新）、系統資料流圖（GTM 節點的顏色/描述改成鼎東而非 Lindy、感謝頁到 GTM 的箭頭改成虛線＋外部設定說明，拿掉不再存在的 `lindy` 顏色類別）、新增「追蹤事件字典」獨立章節（對照文件 §6.6）、`.env` 變數說明表（GTM／GA4 真實值已知，負責窗口改成鼎東）、§12 測試表對照（GA4／Meta 測試項目改成鼎東負責、SPF/DKIM/DMARC 三項並列）、待確認事項（新增 SPF/DKIM/DMARC 與 GTM 權限確認兩項，皆標註 2026/08/06 新增）、後續規劃（8/11 時程行動補充憑證到位狀態）、專案進度追蹤表（新增 GTM／GA4 真實 ID 已到位、Meta Pixel 建置改鼎東負責兩列）。

**下載並保留的原始文件**：`Agatha_Seminar_報名系統與追蹤_CTO交接文件_0805.docx` 已複製進專案根目錄（比照既有 0729／0804 兩版的做法），受 `.gitignore` 的 `Agatha_Seminar*CTO交接文件*.docx` 萬用字元規則保護，不會進版控。

## Phase 31 — Banner 上傳＋活動資訊 CMS：實作＋驗證（`add-banner-event-info-cms` 落地）（2026-08-06）

**做了什麼：** Phase 28 只寫了規格、刻意不實作；design.md 留的 4 個開放問題已於 2026/08/05 跟你確認定案（尺寸不符直接拒絕、不做伺服器端壓縮、換圖直接刪舊檔、後台不做預覽），這次照著已定案的規格直接落地實作，是本專案第一次真正的檔案上傳功能。

- **資料模型**：`prisma/schema.prisma` 新增 `Banner`（單例，`id` 固定為 `"singleton"`，`desktopUrl`／`mobileUrl`／`altText` 三欄）與 `EventInfoField` enum ＋ `EventInfo` model（`field` 為 `@unique`，固定 4 筆：DATE／TIME／VENUE／ACCESS）。`npx prisma migrate dev` 建表；`prisma/seed-event-info.ts` 灌入現有寫死在 JSX 裡的 4 筆活動資訊內容，Banner 無對應 seed（起始為空，落地頁需優雅處理無圖狀態）。
- **上傳基礎建設**：新增 `image-size` 套件做伺服器端尺寸校驗（`imageSize(bytes)` 同步回傳寬高，吃 `Uint8Array`）。圖片實際存放在本機磁碟 `public/uploads/banner/`（沿用這個專案「單一 EC2＋持久化硬碟」的既有部署模型，跟 `dev.db` 放在同一顆硬碟上，不需要額外接雲端儲存），已加入 `.gitignore`。
- **`app/api/admin/banner/route.ts`**：GET 回傳目前 Banner；POST 吃 `multipart/form-data`（`slot`＝`desktop`/`mobile`＋`file`），驗證 MIME 類型、用 `image-size` 讀實際尺寸跟該插槽要求的精確尺寸（桌機 2560×1440／手機 1080×1350）比對，不符直接 400 並在錯誤訊息裡列出「需要的尺寸」與「收到的尺寸」；寫檔後 upsert 該插槽對應欄位，若舊檔存在且跟新檔不同則立即刪除（`unlink().catch(() => {})`，不做回滾備份）。
- **`app/api/admin/event-info/route.ts`／`[field]/route.ts`**：前者 GET 全部 4 筆，後者**只有 PATCH，沒有 POST/DELETE**——用路由本身的形狀鎖死「只能編輯既有欄位，不能新增或刪除欄位」，不是靠 UI 客氣地不給按鈕。
- **前端**：`BannerUploader.tsx`（兩張卡片：桌機／手機，各自顯示目前狀態「已上傳／尚未上傳」，`<input type="file">` 選檔後立即用 `FormData` 送出）、`EventInfoTable.tsx`（4 張固定卡片，各自一個「編輯」按鈕切換成 3 個輸入框＋儲存／取消，永遠沒有新增／刪除控制項）。兩者都沿用 Phase 29 修正過的「靜默重新載入」模式（`load(silent)`），操作後不會整頁閃一次 loading。
- **落地頁串接**：`app/seminar/0915/page.tsx` 查詢 `Banner`／`EventInfo`（皆用 `.catch()` 容錯，沿用既有模式），Hero 區塊在有任一張圖時才渲染（`banner?.desktopUrl || banner?.mobileUrl`），活動資訊區塊把原本寫死的 4 個 `<div className="glass fact">` 改成對 `eventInfoByField` 的 `.map()`，逐一重建原本針對 Venue（有 `line2`）跟其他三項（無 `line2`）不同的 `<br/>`/`<small>` 巢狀邏輯，畫面結構跟原設計稿保持一致。

**過程中發現並修正的一個真實 bug（不是規格問題，是這次實作時才浮現的 CSS 缺陷）：** 用瀏覽器驗證手機視窗時，發現桌機版跟手機版兩張圖同時顯示，沒有依斷點正確切換。追查後發現是 CSS specificity 問題：`.hero-banner img{display:block}`（class＋元素選擇器，優先度 (0,1,1)）的優先度**高於**單一 class 的切換規則 `.hero-banner--mobile{display:none}`／`.hero-banner--desktop{display:none}`（優先度 (0,1,0)），導致不管視窗寬度、也不管有沒有進 media query，基底規則永遠贏，兩張圖只要都上傳了就都會是 `display:block`。修法是把切換規則也加上 `img` 元素限定（`.hero-banner img.hero-banner--mobile` 等），優先度拉高到 (0,2,1) 蓋過基底規則。修正後重新在 375px／1200px 兩種視窗寬度用 `getComputedStyle` 逐一確認只有對應變體可見，才視為驗證通過。

**驗證方式：**
1. `npm run build` 過，新路由編譯正常（`/admin/banner`／`/admin/event-info` 為靜態，`/api/admin/banner`／`/api/admin/event-info*` 為動態，符合預期）。
2. 因為瀏覽器自動化工具（Browser pane）的 `<input type="file">` 無法用程式設值（`InvalidStateError`，瀏覽器安全限制），改用 Node `fetch()` + `FormData`/`Blob`（帶已登入 session cookie）直接測 API：錯誤尺寸（800×600 傳到需要 2560×1440 的桌機插槽）正確回 400 並列出精確尺寸；正確尺寸的桌機／手機各自上傳成功，且互不覆蓋（upsert 只更新對應欄位）；重新上傳同一插槽後，舊檔案確認已從磁碟刪除、新檔案確認存在。
3. 瀏覽器裡實際打開落地頁，桌機視窗（1200px）跟手機視窗（375px）都用 `getComputedStyle` 逐一確認只有對應的圖片變體 `display:block`、另一個是 `none`（即上述 CSS bug 的驗證，修正前後對照）。
4. 瀏覽器裡登入後台，實際點開 `/admin/event-info` 的「編輯」按鈕，把 DATE 卡片的主要內容暫時改成一個測試字串，儲存後confirm 落地頁立即反映該測試字串，再改回原本的 `2026.09.15`；過程中確認其他 3 張卡片未受影響。
5. 用 Node `fetch()` 確認未登入狀態下呼叫新增的兩組 admin API（GET/POST banner、GET event-info、PATCH event-info/[field]）與 `/admin/banner` 頁面皆被既有全域 `middleware.ts` 攔截、307 導回 `/admin/login`——沒有另外寫路由層級的驗證程式碼，因為 `middleware.ts` 的 matcher 本來就涵蓋 `/admin/:path*`／`/api/admin/:path*`，新路由自動繼承這層保護。
6. 程式碼檢查確認新增的兩組路由與兩個後台頁面都沒有任何 `role === "CTO"` 判斷——PR／CTO 角色權限完全對等，跟其他內容管理畫面一致。

**同步更新：** `openspec/changes/add-banner-event-info-cms/tasks.md` 全部項目勾選並補上驗證備註，`openspec validate --strict` 過後歸檔為 `2026-08-06-add-banner-event-info-cms`。`DEPLOYMENT.md` 備份章節補上一句：`public/uploads/` 跟 `dev.db` 一樣是需要納入備份範圍的本機檔案。README 多處更新：頂部規格文件連結段落（拿掉「只寫規格未實作」的措辭，併入已歸檔清單）、專案說明（後台頁面清單補上 banner／event-info）、v3 更新對照表（狀態改為已實作並驗證）、專案結構（新增檔案、`public/uploads/` 目錄、新 spec 資料夾）、測試步驟（補 `seed:event-info` 指令與對應的漏跑後果說明）、內容管理章節（新增 Banner／活動資訊小節，圖片上傳章節的措辭更新為「本專案第一個真正的上傳功能已完成」）、後續規劃（Phase B 拿掉已完成的項目）、專案進度追蹤表（改為 `done`，記錄過程中修正的 CSS bug）。

**測試資料清理：** API 測試過程中在 `public/uploads/banner/` 產生的測試圖檔、資料庫裡對應的 `Banner` singleton row、專案根目錄的 `.test-cookie` 暫存檔，皆於驗證完成後清除，維持這個開發資料庫在「功能已驗證、無殘留測試資料」的乾淨狀態（比照這次 session 每個 phase 結尾的既有慣例）。

## Phase 32 — GTM／GA4 埋設暫緩：Phase 30 狀態回溯修正（2026-08-06）

**做了什麼：** Phase 30 才在同一天上午記錄「GTM／GA4 真實憑證已到位（`GTM-M583KSV7`／`G-C2D5DC3DLS`），待部署時填入 `.env`」，但同日稍晚公關方在群組訊息裡通知情況有變：

> Lindy：「主要是GTM（容器）& GA4的埋設可以先等等，因為埋設碼要換 但是感謝頁 與 自動寄送郵件這個可以繼續沒問題」
>
> 公關方：「剛剛跟公關公司討論、GTM改由我們這裡設定再開放他們權限操作 我更新好上面那份給你，再麻煩你們今天協助埋設，在那之前先不用動作～感謝!!」

也就是說，Phase 30 記錄的 `GTM-M583KSV7` 容器代碼即將更換（改由公關方自行設定 GTM 容器後，再開放鼎東操作權限），**在拿到新代碼前，工程端不採取任何埋設動作**；感謝頁與確認信寄送邏輯不受影響，可繼續照常運作。同時主管另外指示一項：確認信寄件人須使用 `service@emergence.today`——查核後**這項本來就已經符合**（`lib/integrations/email.ts` 的 `EMAIL_FROM` 預設值、以及本機 `.env` 現有設定，皆已是這個位址），不需要任何程式碼異動。

- **確認程式碼層級沒有需要回滾的東西**：先查了本機 `.env`，`NEXT_PUBLIC_GTM_ID`／`NEXT_PUBLIC_GA4_ID` 從頭到尾都是空字串——Phase 30 只是把「已取得的真實值」記錄進 README 文件，從未真的寫進任何會進版控或會被部署的設定檔。全域搜尋 `GTM-M583KSV7`／`G-C2D5DC3DLS` 也確認這兩組代碼只出現在 README／devlog／已歸檔的 proposal 文字說明裡，程式碼（`components/GtmLoader.tsx` 等）從一開始就是純設定驅動、沒有寫死任何 ID。**這代表這次不需要 `git revert` 任何 commit，也沒有任何機密／設定值需要清除**——純粹是文件裡「狀態已確認」的措辭需要往回修正成「暫緩、待新代碼」，不要讓看 README 的人誤以為現在就可以直接拿 `GTM-M583KSV7` 去部署。
- **不回頭改寫 Phase 30 那則歷史紀錄本身**：Phase 30 忠實記錄了「當天上午發生的事」（憑證確實一度到位、程式碼比對確實一致），這件事本身沒有錯，只是幾小時後情況又變了——比照這個專案一貫「devlog 是歷史紀錄，不因後續變化回頭改寫」的做法，新增這則 Phase 32 記錄「後來發生了什麼」，而不是回去改 Phase 30 的文字。
- **README 同步修正**：把先前寫成「done／真實值已提供」語氣的幾處（與原型 HTML 差異表、v3 更新對照表、角色與分工表、`.env` 環境變數說明表、§12 測試表對照、待確認事項第 5 項、專案進度追蹤表）都加註 2026/08/06 稍晚更新的暫緩狀態，專案進度追蹤表的狀態欄從 `done` 改回 `open` 並註明原因；待確認事項新增第 6 項記錄「確認信寄件人」這項指示已核對符合、無需異動。

**驗證方式：** 全域搜尋確認 `GTM-M583KSV7`／`G-C2D5DC3DLS` 未出現在任何 `.ts`／`.tsx` 程式碼檔案裡（只存在於 README／devlog／已歸檔的 OpenSpec 文件說明文字）；檢查本機 `.env` 確認 `NEXT_PUBLIC_GTM_ID`／`NEXT_PUBLIC_GA4_ID` 皆為空值；檢查 `lib/integrations/email.ts` 與 `.env` 的 `EMAIL_FROM`，確認皆已是 `service@emergence.today`，符合主管指示，不需修改。

**同步更新：** 本則 Phase 32 devlog 記錄；README 多處狀態欄與待確認事項同步修正（見上）。這次沒有觸及 OpenSpec 規格（`tracking-integration` capability 描述的是「事件由誰負責推送／設定 Trigger」這個機制本身，機制沒有變，只是實際容器 ID 換代碼，屬於部署設定層級的暫緩，不構成 spec delta）。

## Phase 33 — 0806 下午版交接文件：GTM 容器代碼定案＋確認信文案更新＋權限釐清（2026-08-06）

**做了什麼：** 收到當天下午再度更新的交接文件（`Agatha_Seminar_報名系統與追蹤_CTO交接文件_0806.docx`），跟 Phase 32 記錄的「稍晚訊息、尚未拿到新代碼」正好銜接——這份文件就是那則訊息說的「稍晚會提供的新代碼」。同一天內文件已經是第三個版本（0804 → 0805 → 0806），沿用同一套 `unzip` + 抓 `<w:t>` 節點的純文字比對做法，逐字對照 0805／0806 兩版差異，避免漏看細節。

- **GTM 容器代碼再次更換，且歸屬方向整個反過來**：0805 版是「`GTM-M583KSV7`，公關公司提供，開放給 `marketing@emergence.today`」；0806 版變成「**`GTM-M6P5QTRM`，湧現內部（Lindy）自己開的**，開放 Editor 權限給鼎東」——不是公關給我方，是我方（Lindy）自己建、給外部技術團隊操作權限。明確角色分工：**Lindy（Admin）／鼎東（Editor）／CTO（安裝 Container Code）**。
- **埋設範圍從「全站」收斂成「Landing Page」**：0805 版寫「全站埋設 GTM 容器」，0806 版明確改成「Landing Page 埋設 GTM 容器」——範圍narrower，只需要在 `/seminar/0915` 系列頁面注入即可，不需要涵蓋 `/admin` 等其他路徑（現有 `GtmLoader` 掛在根 `layout.tsx`，之後若要嚴格對齊這條，可以評估是否要收斂到只在 seminar route group 注入；這次先只更新文件狀態，程式碼掛載位置暫不動，因為擴大範圍不會造成錯誤，只是比文件要求寬鬆）。
- **責任分工依「通路」拆得更細**：鼎東的範圍限定在 **Meta ＋ Digitimes** 兩個投放通路（Meta Pixel／Meta Pixel Tag／Meta Lead Event Trigger、對應的 GTM Preview 測試）；GTM Container 維護、GA4 Tag 建立、以及**湧現自營通路**（Benchmark 電子報、Agatha 自己的 FB／LinkedIn）的 GTM Preview 測試，則是 Lindy／湧現自己的工作。
- **確認信與感謝頁文案補上公司品牌名稱**：交接文件 §8.1／§8.2 官方文案更新，信件主旨加上「湧現智庫Agatha」（`【報名成功】湧現智庫Agatha・9/15 製造業 AI 商用實戰論壇`），感謝頁內文加上「湧現智庫Agatha · 」前綴。逐字比對後這是唯二真的動到程式碼的地方：`lib/integrations/email.ts` 的 `buildEmail()` 主旨字串、`app/seminar/0915/thanks/page.tsx` 的一行文案。
- **釐清一個看起來像衝突、實際上不衝突的 checklist 項目**：文件第 9 章上線前 checklist 有一條「不提供公關公司 CMS 權限」（0805、0806 皆同，不是這次新增），字面上似乎跟這個專案「PR 角色帳號可完整操作 CMS」的既有設計互相矛盾。直接把這個疑慮攤開來問你，你的回覆是：**「公關公司」（鼎東，外部代理商）跟「公司公關」（Lindy，湧現內部）是兩個不同對象**，checklist 講的是前者——鼎東本來就不該有、也沒有拿到本專案任何帳號；PR 角色帳號從一開始就只發給 Lindy。兩者對得起來，不需要改任何權限程式碼，純粹是命名容易混淆造成的誤會。
- **順手確認幾件事，維持現狀不動**：報名頁／感謝頁網址（`https://2026-forum.agatha-ai.com/seminar/0915`、`/seminar/0915/thanks`）與現有路由結構完全一致；GA4 conversion 機制（GTM Trigger 比對感謝頁網址、標記為 Key Event）與現有架構一致；後端「不需要另外推送 GA4 事件、只在啟用時補送 Meta CAPI」的分工，跟現有 `lib/integrations/meta-capi.ts` 的設計一致；「不串接 Ragic、不串接 Benchmark」這句在 0805 就已經寫著（不是這次新增），現有 `lib/integrations/ragic.ts` 的 no-op stub 維持原樣即可，不用真的動手串接。
- **Slack 截圖裡主管的提問，順帶解讀給你**：他問「感謝頁是不是一個獨立的 context path」，其實是要拿去給 Lindy 設定 GTM Trigger 用的——GTM 判斷「有沒有轉換」只看網址路徑（`/seminar/0915/thanks`），不會、也不需要知道「是誰」報名，「誰報名了什麼」的資料仍然只在我方資料庫／Excel 匯出裡，兩件事是分開的，已經在對話裡先幫你把這個界線講清楚，避免之後有人誤以為網址本身能拿來對到個人身份。

**驗證方式：** 兩處文案修改後 `npm run build` 通過；瀏覽器開 `/seminar/0915/thanks` 用 `get_page_text` 確認畫面文字正確顯示「感謝您報名「湧現智庫Agatha · 製造業 AI 商用實戰論壇」」。信件主旨的改動因為是純字串樣板、沒有條件邏輯分支，直接讀程式碼比對正確性，未另外觸發實際寄信驗證（延續本專案一貫「無憑證時 log-only、有邏輯分支才需要跑一次驗證」的判斷）。

**同步更新：** 本則 Phase 33 devlog；README 多處更新（與原型 HTML 差異表、v3 更新對照表引言與資料表、角色與分工表整個重寫——拆解「公司公關」vs「公關公司」的區別並新增一段說明、系統資料流圖 GTM 節點標籤、`.env` 環境變數說明表、待確認事項第 5 項改為「已定案」並新增第 7 項記錄權限釐清結果、專案進度追蹤表新增／更新三列）。這次沒有開新的 OpenSpec change——GTM 容器代碼與確認信品牌前綴都是**內容／憑證層級**的更新，沒有改變任何 capability spec 描述的機制或行為（跟 Phase 30 修正「Agentic」錯字、GTM ID 一度到位時的處理方式一致），純文件與文案層級異動不構成 spec delta。原始 `Agatha_Seminar_報名系統與追蹤_CTO交接文件_0806.docx` 已複製進專案根目錄，受 `.gitignore` 保護不進版控。

## Phase 34 — 講者照片／夥伴 Logo 檔案上傳＋夥伴主辦/協辦分類（`add-speaker-partner-upload` 落地）（2026-08-07）

**做了什麼：** Lindy 實際測試落地頁跟後台後，回報兩類問題：後台的講者、夥伴管理只能貼圖片網址，需要真正的檔案上傳；夥伴清單需要拆成「主辦單位」（今晧實業、湧現智庫）跟「協辦單位」兩類，落地頁對應要分開呈現。這次照這個專案一貫的流程走：先開 OpenSpec 提案（`openspec-propose` skill），design.md 列出 4 個待確認決策，用 `AskUserQuestion` 逐項跟你確認過（比照 Banner 那次的做法），才動手實作。

- **確認的 4 個決策**：講者照片 520×520 是**下限**（≥520×520 即可，不要求精確正方形，跟 Banner 的精確比對不同）；夥伴 Logo 只驗證**格式是 PNG＋寬度 ≥800px**，不檢查是否真的透明背景；「主辦單位」分類**可自由編輯**，不鎖定；換圖／換 Logo 一樣**立即刪除**舊檔，沿用 Banner 的做法。
- **資料模型**：`Partner` 新增 `PartnerCategory`（`HOST`／`COORGANIZER`）欄位。實作過程中發現一個規劃時沒注意到的地方——原本以為 `Speaker.photoUrl` 已是 nullable 不用改 schema，但 `Partner.logoUrl` 原本是必填欄位，若要比照講者「先建立資料、再上傳照片」的兩步驟流程，`logoUrl` 也得改成可留空，於是多加了一個 migration 把它改成 `String?`。
- **種子資料**：`prisma/seed-partners.ts` 從「資料庫裡已經有資料就整個跳過」改寫成「逐筆用名稱比對、找不到就新增、分類不同就更新」，這樣舊環境重新跑這個 seed 也能安全地把既有的今晧實業標記成主辦單位、補上湧現智庫這筆新資料，不會因為表已經有資料就整個跳過、也不會重複新增。
- **上傳基礎建設**：`app/api/admin/speakers/[id]/upload/route.ts`、`app/api/admin/partners/[id]/upload/route.ts` 兩支新路由，完全沿用 Banner 上傳的模式（`image-size` 驗尺寸、寫入 `public/uploads/`、換檔即刪舊檔）。兩者都額外加了一個小防呆：舊的圖片網址如果不是以 `/uploads/...` 開頭（代表是種子資料裡原本寫死的 `/images/asset-*.png` 靜態圖，不是使用者上傳的），換圖時**不會**把它刪掉——避免誤刪專案內建的靜態素材。
- **後台 UI**：講者、夥伴的「編輯」表單拿掉網址輸入框，改成每一列一個「上傳照片／Logo」的檔案輸入框，選檔案就立即上傳，跟 `BannerUploader` 的互動模式一致。夥伴管理畫面拆成「主辦單位管理」「協辦單位管理」兩個獨立表格，各自的拖曳排序互不影響（拖曳主辦單位只會動主辦單位的 `sortOrder`，協辦單位的數字完全不受影響）。
- **落地頁**：`PartnerWall` 元件的 `img` 型別改成可為 `null`（因為現在夥伴可能還沒上傳 Logo），沒 Logo 的夥伴直接跳過不渲染，不會顯示破圖。落地頁查一次 `Partner` 資料表，依 `category` 在記憶體裡拆成兩份陣列，各自餵給一個 `PartnerWall`，「主辦單位」區塊沿用同一個元件（含點擊彈出簡介的互動），沒有另外做一個新元件。

**過程中發現並修正的一個既有缺口（不是這次新增的功能，是驗證時才注意到）：** 講者、夥伴的刪除 API（`DELETE /api/admin/speakers/:id`、`DELETE /api/admin/partners/:id`）從第一天（Phase 17）就只刪資料庫那筆紀錄，從來沒有把對應上傳的圖片檔案一起從磁碟清掉——只是過去這兩個欄位都是貼網址，沒有檔案上傳這件事，這個缺口一直沒有機會浮現。這次因為有真正的上傳檔案了，順手在兩支 DELETE handler 補上同一套「刪除前先記下舊網址、資料庫刪除成功後再 `unlink()`」邏輯（跟上傳路由裡「換圖時刪舊檔」用的是同一個防呆：只刪 `/uploads/...` 開頭的檔案，種子資料的靜態圖不會被誤刪），避免刪除講者／夥伴之後留下永遠沒人清的孤兒檔案。

**驗證方式：**
1. `npm run build` 過，新路由（`speakers/[id]/upload`、`partners/[id]/upload`）正確編譯。
2. 瀏覽器登入後台，實際用 UI 建立一筆測試協辦夥伴（含分類下拉選單），確認建立後表格上出現「待提供」＋「上傳 Logo」按鈕，跟講者建立後的行為一致。
3. 因為 Browser pane 沒有檔案上傳能力（跟 Banner 那次遇到的限制一樣），改用 `sharp` 產生測試圖片＋Node `fetch` 帶 session cookie 直接測 API：講者照片 400×400（低於下限）→ 400 並列出需求尺寸；520×520（剛好達下限）→ 200；800×900（超過下限）→ 200，證實真的是下限而非精確比對。夥伴 Logo 用 JPEG 上傳 → 400「僅支援 PNG 格式」；PNG 但寬度只有 500px → 400「寬度過小」；PNG 且 800px 寬 → 200。
4. 換圖驗證：對同一個講者連續上傳兩次，確認 `public/uploads/speakers/` 底下只留最新那個檔案，舊檔案真的被刪除。
5. 瀏覽器開落地頁，用 `getElementById('hosts')`／`getElementById('partners')` 分別數卡片數量，確認主辦單位區塊剛好 2 張（今晧實業、湧現智庫）、合作夥伴區塊剛好 7 張（其餘），沒有重複也沒有遺漏。
6. 用 API 把兩個主辦單位的順序對調，確認協辦單位 7 筆的 `sortOrder` 在操作前後完全沒變，證實排序真的是分類內獨立的；操作完把主辦單位順序改回原狀。
7. 刪光所有測試資料（測試講者、測試夥伴×2）後，確認 `public/uploads/speakers/`、`public/uploads/partners/` 兩個資料夾都是空的——驗證上面提到的「刪除時一併清檔案」修正確實有效。
8. 未登入直接呼叫兩支新上傳路由，確認都被既有的全域 `middleware.ts` 攔截、307 導回 `/admin/login`；`grep -n "CTO"` 掃過兩支路由與兩個後台元件，確認都沒有角色限制，PR／CTO 權限對等。

**同步更新：** `openspec/changes/add-speaker-partner-upload/tasks.md` 全部項目勾選並補上驗證備註與過程中發現的兩個規劃外調整（`Partner.logoUrl` 改 nullable、DELETE 補檔案清除），`openspec validate --strict` 過後歸檔為 `2026-08-07-add-speaker-partner-upload`。README 多處更新：內容管理章節（講者／夥伴段落整段重寫，含上傳規格與分類說明）、v3 更新對照表新增一列、專案結構（新路由）、專案進度追蹤表新增一列。測試期間產生的 `.test-cookie`／`.test-speaker-id`／`.test-partner-id` 暫存檔已清除，不進版控。

## Phase 35 — 落地頁區塊改名＋確認信改走 Gmail SMTP 路徑（2026-08-07）

**做了什麼：** 兩件小事，都是當天稍早討論的延續。

- **「合作夥伴」改名「協辦單位」**：落地頁區塊標題跟後台已經在用的「協辦單位管理」分組名稱對齊，單純文案一致性調整，不涉及資料結構或行為。
- **確認信新增 Gmail SMTP 寄信路徑**：稍早討論到 `emergence.today` 不是本公司持有的網域，Resend 網域驗證需要的 DNS 權限有不確定性；但 `service@emergence.today` 本身已經是一個平常在用的 Gmail 帳號，於是改走「直接用 Gmail 自己的 SMTP 伺服器寄信」這條路——完全不用碰 DNS，因為 Google 自己的伺服器本來就已經是 `gmail.com` 這個網域的合法寄件者。新增 `nodemailer` 依賴，`lib/integrations/email.ts` 加了一個 `EMAIL_PROVIDER=gmail` 分支，用 `GMAIL_USER`／`GMAIL_APP_PASSWORD` 兩個新環境變數透過 `nodemailer.createTransport({service:"gmail",...})` 寄信，跟原本的 `resend` 分支並列，`none` 時的 log-only 行為不受影響。
- **格式把關，不經手實際密碼**：Lindy 先給的第一組密碼格式不對——Google 應用程式密碼固定是 16 碼小寫字母、4 碼一組（例如 `abcd efgh ijkl mnop`），第一組看起來是一般帳號登入密碼（有大寫、數字、13 碼），若信箱有開兩步驟驗證會直接寄信失敗，且拿主密碼給第三方系統本身也不是好的安全實踐。指出這點後 Lindy 重新提供了格式正確的一組。**這兩組密碼本身完全沒有寫進任何檔案、程式碼或 commit**——使用者直接在對話裡貼了兩次，但這類密碼屬於不能由我代為輸入到系統裡的東西（比照信用卡號、API Key 同一類的處理原則），程式碼準備好之後，實際的環境變數值需要使用者自己上 EC2 手動填入 `.env`，我這邊全程不觸碰真實憑證值，連歷史紀錄裡也不留字面值。

**驗證方式：** 落地頁改名後瀏覽器重新整理，`getElementById('partners').querySelector('h2').textContent` 確認顯示「協辦單位」（過程中又遇到一次 Next dev server 長時間執行後的 webpack module 錯誤，跟先前幾次一樣重啟 dev server 解決，不是程式碼問題）。Gmail SMTP 那段程式碼因為沒有真實憑證可測（刻意不經手密碼），只驗證到 `npm run build` 型別檢查通過，實際能不能寄出去要等使用者自己把值填進 EC2 `.env` 後才能確認——這點在 README 裡有明確標註為 `ongoing`，不宣稱已完整驗證。

**同步更新：** README（`.env` 環境變數說明表新增 `GMAIL_USER`／`GMAIL_APP_PASSWORD`、待確認事項第 4 項標記為已有替代路徑、專案進度追蹤表交易信憑證列改為 `ongoing`）、`.env.example`、`DEPLOYMENT.md`（環境變數建立指南與仍待補齊憑證表）皆已更新。沒有開新的 OpenSpec change——`transactional-email` capability 的既有需求本來就寫明「provider 透過設定值可替換（e.g. `EMAIL_PROVIDER`）」，新增 `gmail` 這個選項是既有需求範圍內的實作細節，不是新的或變更的行為契約。

## Phase 36 — 修正正式站上傳圖片全部 404 的關鍵 bug（2026-08-07）

**做了什麼：** Lindy 回報上傳新圖片後畫面顯示破圖。先排除了一個岔路——她同時也貼了 ChatGPT 針對 `GtmLoader.tsx` 給的建議（懷疑 `grantTrackingConsent()` 沒有送出 `agatha:consent-granted` 事件，導致 GTM 要重新整理才會載入）。實際核對 `components/ConsentBanner.tsx` 的原始碼，事件本來就有正確送出（`accept()` 裡 `grantTrackingConsent()` 之後緊接著 `window.dispatchEvent(new Event(CONSENT_GRANTED_EVENT))`），而且今天稍早我已經直接連正式站實測過同一頁不重整、按下同意後 GTM 立即載入——GPT 是因為只看到 `GtmLoader.tsx` 一個檔案、沒看到 `ConsentBanner.tsx`，才猜錯了根因。這部分沒有動任何程式碼，只是確認診斷是錯的。

- **真正的問題**：直接連正式站檢查 3 張新上傳圖片（2 張講者照片、1 張夥伴 Logo）的網址，全部回 404，但回應標頭裡有 `x-nextjs-cache: HIT`、`x-nextjs-prerender: 1` 這種 RSC／頁面渲染才會有的標頭——代表 Next.js 把這個請求當成「路由不存在」在處理並快取下來，不是單純的靜態檔案 404。
- **逐步排除**：先請你 SSH 上 EC2 確認檔案實際在不在硬碟上（`ls` 確認在，大小正常，不是壞檔）；再確認機器上只有一份專案目錄、pm2 的工作目錄也正確（排除「多目錄搞混」的可能）；再用 `curl` 直接打 `localhost:3003` 跳過所有可能的反向代理，結果一樣 404（排除「代理層設定漏掉 `/uploads/`」的可能）；查了 `next.config.mjs` 確認沒有設定 `output: "standalone"`（排除「standalone 模式複製了一份舊的 public 快照」的可能）。
- **關鍵測試釘死根因**：請你 `pm2 restart agatha-seminar` 後重新 `curl` 同一個檔案，結果變成 200。**這證實了 Next.js production 模式（`next start`）對 `public/` 資料夾的靜態檔案清單是在伺服器啟動當下建立的，執行期間才被寫入的新檔案不會被動態發現，會被當成「路由不存在」而 404，還被快取住**——這代表往後每次上傳新的講者照片／夥伴 Logo／Banner，在下一次重啟伺服器之前都會是破圖，是這個專案檔案上傳功能的一個結構性問題，不是這次上傳的個案，也不是我今天稍早在本機用 `npm run dev` 一直測不出來的原因——dev 模式本來就是即時讀硬碟，不會有這個問題，只有 production 模式才會踩到。

**修法：** 新增 `app/uploads/[...path]/route.ts`，用一支 Route Handler 直接讀硬碟回傳檔案內容，取代依賴 Next.js 內建的 `public/` 靜態伺服機制。這支路由每次請求都用 `readFile()` 即時讀取當下的硬碟內容，不會有「伺服器啟動時的快照」這個問題。有做路徑穿越防護（拒絕含 `..` 或空位元組的路徑片段，且解析後路徑必須仍在 `public/uploads/` 底下）與副檔名白名單（僅 jpg/jpeg/png/webp，其餘一律 400）。

**驗證方式：** 這個 bug 只有 production 模式才會重現，本機一直用 `npm run dev` 測試當然測不出來，所以這次刻意在本機跑一次**真正的 production build**（`npm run build && npm run start`，確保跟正式站一樣、`public/uploads/` 在 build 當下是空的）：伺服器啟動後，用 API 建一個測試講者、上傳一張照片，**不重啟伺服器**、立刻重新請求該圖片網址，確認回傳 200 且 `Content-Type: image/jpeg`（修正前這一步在 production 模式下會是 404，這正是 Lindy 回報的那個情境）。測試講者與圖片事後皆已刪除清理乾淨。正式站那 3 張破圖，程式碼部署＋重啟後應該會直接自動修好（檔案本來就好好躺在硬碟上，不需要重新上傳）——這點會在部署後另外請你確認一次。

**同步更新：** 本則 Phase 36 devlog。沒有開新的 OpenSpec change——`banner-cms`／`speakers-cms`／`partners-cms` 的既有規格本來就寫「上傳後圖片會出現在落地頁」，這次是修正一個讓這條既有規格失效的環境層級 bug，不是改變規格本身要求的行為。

## Phase 37 — 上傳按鈕樣式修正＋公關開放整批匯出 Excel 權限（`open-export-to-pr-role` 落地）（2026-08-07）

**做了什麼：** 兩件事，都是這次 session 一路做下來累積的小尾巴，趁今天一起收掉。

- **講者「更換照片」／夥伴「更換 Logo」按鈕樣式**：這兩個按鈕當初是用 `<label className="small">` 包一個隱藏的 `<input type="file">`，靠點擊 label 觸發檔案選取視窗。但 `globals.css` 裡對應的樣式規則是 `.admin button.small`，**只認 `<button>` 元素**，`<label>` 不會套到任何樣式，畫面上看起來就是一段純文字，不像可以點的按鈕。改成真正的 `<button type="button">`，透過 `useRef` 存每一列對應的 `<input type="file">`，按鈕的 `onClick` 呼叫 `fileInputRefs.current[item.id]?.click()` 觸發隱藏的檔案輸入框——`<input>` 還是隱藏著，只是現在由一個有正確樣式的按鈕去觸發它，而不是靠 `<label>` 的原生包裹行為。`SpeakerTable.tsx`、`PartnerTable.tsx` 兩個檔案都做了同樣的修正。

- **公關帳號開放整批匯出 Excel 權限**：你直接指示要放寬——公關需要能直接匯出名單給報名公司，不用每次都透過 CTO 轉交。這跟交接文件 v3 §6.9「全量含個資之名單匯出由我方控管後再提供」的字面要求剛好相反，先把這個衝突攤開來跟你確認過，你確認是刻意要反轉這個限制，不是我看漏了什麼，才動手做。照這個專案一貫的作法開了一個 OpenSpec change（`open-export-to-pr-role`），data-export／admin-console 兩個 capability 各自的相關 requirement 都寫了對應的 delta（`admin-console` 那條「不提供整批匯出」直接用 REMOVED，因為機制整個被撤銷，不是改個描述）。design.md 記錄了這個決定背後的權衡：個資風險是接受的 trade-off（使用者已明確確認），稽核紀錄本來就會記錄操作帳號，權限放寬不影響「事後查得到是誰做的」這件事。
  - 程式碼異動很單純：`app/api/admin/export/route.ts` 把 `me.role !== "CTO"` 那個判斷拿掉，只留「有沒有登入」；`app/admin/page.tsx` 把「匯出 Excel」連結從 `isCto &&` 的區塊裡搬出來，跟其他內容管理連結放一起，「帳號管理」則繼續留在 CTO 專屬區塊。CLI 用的 `/api/export?token=` 路徑完全沒動，那是另一組獨立的憑證（`EXPORT_TOKEN`），不受這次異動影響，依然只有握有這個 token 的人（CTO）能用。

**驗證過程中的插曲：** 第一輪驗證時發現 PR 帳號呼叫匯出還是回 403、還是舊的錯誤訊息「僅 CTO 可匯出」——但直接讀原始碼確認 `export/route.ts` 早就已經改對了。追查後發現是**本機 `.next` build cache 沒有正確反映最新的原始碼**，刪掉整個 `.next` 資料夾重新 `npm run build` 之後，錯誤訊息字串從編譯產物裡消失，問題排除。這不是程式碼的問題，是本機這次 build 流程本身卡到快取，跟今天 Phase 36 那個「production 模式不會動態發現新檔案」是兩個完全不同的問題，不要搞混。另外測試過程中還踩到一次：先前建立的 PR 測試帳號在某次 `Stop-Process -Force` 強制關閉伺服器行程時似乎連帶遺失了寫入（SQLite 沒來得及把交易寫進去），重新建一個測試帳號後正常。

**驗證方式：**
1. `npm run build` 過。
2. 在本機起一個真正的 production 伺服器（`next start`，這次特意避開本機另一個常駐服務占用的 3003 port，改用 3010 測試，跟正式環境用哪個 port 無關，純粹避免本機環境衝突），登入 CTO 帳號建立一個全新的 PR 測試帳號。
3. 用該 PR 帳號登入，呼叫 `/api/admin/export`，確認回傳 200 與正確的 `.xlsx` content-type（修正前是 403）。
4. 直接查詢 `AdminAuditLog`，確認這筆匯出正確記錄了操作帳號是那個 PR 測試帳號、角色 PR——證實「放寬權限」跟「維持可追溯性」兩件事同時成立。
5. 確認 PR 帳號呼叫 `/api/admin/accounts`（帳號管理）依然回 403，沒有被這次異動波及。
6. 確認未登入呼叫匯出依然被導回登入頁（既有 middleware 涵蓋範圍，跟角色無關）。
7. 測試用的 PR 帳號依「停用而非刪除」的既有慣例停用，不刪除。

**同步更新：** `openspec/changes/open-export-to-pr-role/tasks.md` 全部項目勾選並補上驗證備註（含上面提到的 build cache 插曲），`openspec validate --strict` 過後歸檔為 `2026-08-07-open-export-to-pr-role`。README 多處更新：與原型 HTML 差異表、v3 更新對照表新增一列、系統資料流圖匯出節點標籤、帳號管理章節文字（拿掉「PR 無整批匯出」的舊敘述，改記錄這次的放寬與原因）、名單匯出章節說明、專案結構註解、專案進度追蹤表新增兩列（這次的權限放寬＋按鈕樣式修正）。

## Phase 38 — CTO 專屬封存報名資料功能（`add-cto-archive-registrations` 落地）（2026-08-07）

**起因：** 你問能不能把資料庫裡現有的報名資料刪掉，因為那些都是測試期間累積的假資料。在動手之前，先把這個要求跟既有的一條 OpenSpec 硬性限制對照了一下：`admin-console` 的原始 spec 文字寫的是「The system SHALL NOT expose any control in `/admin` that deletes or modifies a registration's core submitted data」——這是不分角色的全面禁止，不是只針對 PR，字面上連 CTO 都涵蓋在內。把這段原文貼給你看過之後，用 `AskUserQuestion` 問清楚兩個真正懸而未決的設計決策，而不是自己拍板：（1）要真的從資料庫刪除，還是比照帳號管理「停用而非刪除」改成標記隱藏；（2）這只是這次要清一次測試資料，還是要做成以後隨時能用的永久功能。你的回覆都選了比較保守、可回復的那一邊：標記為無效／隱藏，而且要做成永久功能、CTO 專屬。

**做了什麼：** 開了一個新的 OpenSpec change（`add-cto-archive-registrations`），`admin-console` 那條「不提供刪除功能」的 requirement 用 MODIFIED（保留原本一字不差的標題）改寫成「不提供永久刪除，但 CTO 角色可逆向封存／取消封存」，`data-export` 也用 MODIFIED 補上「已封存的報名資料同樣要從兩條匯出路徑排除」。

- **資料庫**：`Registration` model 新增 `archived Boolean @default(false)`，跟 `AdminAccount.active` 用同一套「布林旗標，不是真的刪除」的既有慣例，沒有另外發明一套帶時間戳記的設計。新增索引 `@@index([archived])`。
- **後端**：新增 `PATCH /api/admin/registrations/:id/archive`（CTO-only，非 CTO 一律 403），只做 `prisma.registration.update` 切換 `archived` 這一個欄位，程式碼裡完全沒有出現任何 `.delete()` 呼叫。列表 API（`/api/admin/registrations`）預設只回傳 `archived: false` 的資料，帶 `?archived=true` 時（且僅限 CTO session，PR 帶這個參數會被直接忽略、不是回錯誤——刻意設計成「PR 不該知道這個篩選存在」）改回傳已封存清單。三條匯出路徑（`/admin` 內建按鈕、CLI `EXPORT_TOKEN`、`scripts/export-registrations.ts`）都加上 `where: { archived: false }`，跟這次新增的 CTO-only 限制完全獨立、互不影響——`EXPORT_TOKEN` 本來就是另一組跟 admin session 無關的憑證。
- **前端**：`AdminTable.tsx` 新增 `isCto` prop（`app/admin/page.tsx` 已有現成的 `isCto` 常數，直接往下傳），CTO 角色會多看到一顆篩選列的「顯示已封存」勾選框，跟每一列操作欄裡的「封存／取消封存」按鈕；PR 角色兩者都完全不會被渲染出來，不是用 CSS 隱藏，是 JSX 條件式直接不輸出這段節點。

**驗證方式：** 這次瀏覽器截圖工具本身沒有卡住，但為了跑得更快也更精確地覆蓋所有角色／狀態組合，改用直接打 API 的方式驗證（跟 UI 呼叫的是同一組 endpoint，等於在驗證同一段程式碼路徑，只是跳過滑鼠點擊那一層）：
1. `npm run build` 過，新路由 `/api/admin/registrations/[id]/archive` 正確編譯成 dynamic route。
2. 本機起一個真正的 production 伺服器（`next start -p 3010`，避開本機另一個常駐服務占用的 3003），建立一組全新的 CTO／PR 測試帳號與一筆測試報名資料。
3. 以 CTO 身份：確認測試資料一開始在預設列表裡 → 呼叫封存 API → 確認從預設列表消失 → 確認出現在 `?archived=true` 篩選結果裡 → 下載真正的 `.xlsx` 匯出並用 `exceljs` 解析，確認除了表頭之外沒有任何資料列（`rowCount: 1`）→ 呼叫取消封存 → 確認重新出現在預設列表。
4. 以 PR 身份：確認帶 `?archived=true` 依然拿到「一般未封存清單」而非錯誤或空清單（驗證「靜默忽略」而非「拒絕」的設計）；呼叫封存 API 回傳 403。
5. 未登入呼叫封存 API，確認被既有 `middleware.ts` 導回 `/admin/login`（這是全域既有的 session 檢查機制，這次異動沒有改到它）。
6. `grep -rn "registration.delete" app/ lib/ scripts/`，確認唯一命中的是新檔案裡解釋「這裡不會呼叫 delete」的註解本身，程式碼裡真的沒有任何刪除呼叫。
7. 驗證用的測試報名資料與測試帳號驗證完後清除／停用，沒有留在資料庫裡。

**正式站清理：** 你在功能實作到一半時插進來說「正式站資料，你幫我寫指令好了」，明確要一支可以直接跑的指令，而不是等這個 UI 功能部署上線後再手動點。寫了 `scripts/archive-test-registrations.ts`，跟 `export-registrations.ts` 同一種 `tsx` 腳本形式：不加任何參數是預覽模式，列出目前資料庫裡所有未封存的報名資料但不做任何變更；加 `--all --confirm` 才會真的全部封存，也支援 `--ids=<id1>,<id2> --confirm` 只封存特定幾筆。刻意做成預覽優先、需要明確 `--confirm` 才會寫入，避免在正式站資料庫上手滑；封存後的資料跟從 `/admin` 介面手動封存完全等價，之後隨時可以從「顯示已封存」畫面取消封存還原，不是不可逆的操作。這支腳本要等這次改動部署到 EC2、跑過 `npx prisma migrate deploy` 之後才能執行。

**同步更新：** `openspec/changes/add-cto-archive-registrations/tasks.md` 全部項目勾選並補上驗證備註，`openspec validate --strict` 過後歸檔為 `2026-08-07-add-cto-archive-registrations`。README 更新：與原型 HTML 差異表新增一列、「不提供刪除功能」的敘述補上這次的例外與原因、新增「封存報名資料」操作說明小節（含正式站清理指令的用法）、專案進度追蹤表新增一列。

## Phase 39 — 手機排版第二次調整＋確認信改用 Lindy 設計的 HTML 版型（2026-08-07）

**起因：** 這次 session 一口氣收到三個回報。第一個是手機排版：早上才做過一次 Hero 區塊間距微調（Phase 37 之前），你這次直接說「手機還是沒有 RWD，畫面看起來還是很擁擠」——先用 `getComputedStyle` 確認早上那次修正**確實已經部署在正式站**（`padding-top:56px` 等數值都在），不是沒生效，而是調整幅度太小、感覺不出差異。第二、三個是同一封信的兩件事：Lindy 想要確認信長得更好看，直接設計了一份 HTML 版型丟過來；你則指出信裡「框起來」的收件人姓名（範例圖裡是「吳韻萱」）不可以寫死，要依照實際報名人變化。

**手機排版第二次調整：** 這次不再是「每個區塊平均加一點間距」的小修小補，而是重新想清楚版面的分組邏輯。用瀏覽器量了 Hero 區塊裡每個子元素的 `top`／`height`／`margin-top`，發現問題不是總高度太高（整個 Hero 已經佔了手機螢幕約 66% 高度，這對一個活動主視覺來說不算誇張），而是六個堆疊的區塊（標語、標題、副標、時間地點、標籤、CTA 按鈕）彼此間距都差不多（18～36px），讀起來像一整面等距排列的文字牆，沒有分組感。改成：標題群組（標語＋標題＋副標）維持原本緊湊的間距不動；「時間地點」區塊前的間距從 26px 拉大到 38px，明確跟上面的標題群組分開；「CTA 按鈕」前的間距從 36px 拉大到 46px，作為最重要的行動呼籲需要最大的視覺呼吸空間；外層 `padding` 則從 56px/52px 收緊到 40px/40px 補回這些新增的高度，讓總高度跟調整前差不多，不會讓頁面變得更長。桌機版完全沒有動，用同樣的方式量測 1280px 寬度確認所有數值都是原本的桌機數字。

**確認信 HTML 版型：** Lindy 給的檔案是一份完整設計好的 email HTML（品牌配色、Hero 視覺、活動資訊卡片、Google 地圖連結，內嵌一張 base64 的背景裝飾圖），裡面收件人姓名那行寫死了範例名字「吳韻萱」。做法是把這份檔案原封不動複製進專案（`lib/integrations/email-templates/registration-confirmation.html`），只把姓名那一行換成 `{{REGISTRANT_NAME}}` 佔位字串，其餘版面、文案、內嵌圖片完全不動——這是 Lindy 設計的東西，工程端不應該重新排版或改動視覺，只做「讓姓名變成變數」這一件事。

`lib/integrations/email.ts` 新增 `buildHtmlEmail()`：讀取這份版型檔案（用 `fs.readFileSync` + `path.join(process.cwd(), ...)`，第一次讀取後快取在記憶體，不用每次寄信都重新讀硬碟)，把佔位字串換成該筆報名資料實際的 `name` 欄位。這裡特別做了 HTML escape（`&`、`<`、`>`、`"`、`'` 全部轉義）——報名姓名是使用者自己填的表單欄位，如果沒有做這一步，理論上有人可以在姓名欄位塞 `<script>` 之類的內容，讓後台管理者或收件人自己在信件裡跑出非預期的東西。Resend 與 Gmail SMTP 兩條寄信路徑都加上這個 `html` 欄位，同時保留原本的純文字 `text` 版本一起附上（多數信箱會優先顯示 HTML 版，純文字版留著純粹當作相容性 fallback，也有助於維持信件的垃圾郵件評分）。`EMAIL_PROVIDER=none` 的 no-op log-only 路徑完全沒改，行為不變。

**驗證方式：**
1. 寫了一段小腳本直接呼叫版型替換邏輯，用一個刻意包含 `<script>alert(1)</script>` 的假姓名去跑替換，確認輸出結果裡佔位字串已經完全消失、`<script>` 標籤變成逃脫後的文字（`&lt;script&gt;`），不是原始可執行的標籤。
2. 把替換後的結果放到瀏覽器裡實際打開（透過本機 dev server 暫時提供這個檔案），確認畫面上該行直接顯示成純文字「`<script>alert(1)</script>王小明 您好，`」，瀏覽器 console 沒有跳出 alert——證明真的被當成文字渲染，不是被當成程式碼執行。
3. `npm run build` 過。
4. 起一個真正的 production 伺服器（`next start`），實際呼叫 `/api/register` 送出一筆完整的測試報名（`EMAIL_PROVIDER` 未設定，走 no-op 路徑），確認資料庫裡這筆資料的 `emailStatus` 是 `SKIPPED` 而不是 `FAILED`——如果版型檔案路徑寫錯或讀取失敗，`buildHtmlEmail()` 會拋出例外，外層 `try/catch` 會把狀態標成 `FAILED`；狀態是 `SKIPPED` 證明版型讀取與姓名代入在**真正的 production 執行環境（`next start`，不是 `next dev`）下沒有出錯**，這點特別重要是因為今天稍早才踩過一次「`next start` 跟 `next dev` 對 `public/` 底下檔案的處理方式不一樣」的坑（見 Phase 36），這次特意用同樣的方式重新確認一次，不想在同一類問題上再摔一次跤。
5. 驗證用的測試報名資料、暫時放到 `public/` 底下方便瀏覽器預覽的暫存檔，驗證完都清除，沒有留在專案或資料庫裡。

**同步更新：** README「與原型 HTML 差異」表更新確認信那一列，`.env` 環境變數說明表下方新增「確認信版型：HTML 版」小節說明機制，專案進度追蹤表新增兩列（手機排版第二次調整＋確認信 HTML 版型）。這次沒有走完整 OpenSpec 流程（兩件事都是既有 `transactional-email`／`landing-page` capability 範圍內的實作調整，不是新增能力），比照今天稍早幾次同類型小修正的做法。

## Phase 40 — 確認信 HTML 版型寄出後破版：內嵌 base64 圖片是元凶（2026-08-07）

**起因：** Phase 39 的 HTML 版型改完、本機驗證過（`emailStatus` 是 `SKIPPED` 不是 `FAILED`，也用瀏覽器打開過渲染結果確認排版正確）之後，你實際收到信一看，畫面最上面的品牌列（Agatha 湧現智庫）有正常顯示，但緊接著整段變成一長串肉眼可見的 HTML 原始碼——`<td class="herobg" style="...background-image:url('data:image/png;base64,iVBORw0KGgo...`，一路到後面全部都是這種標籤文字，完全沒被當成信件內容渲染。

**為什麼本機驗證沒抓到：** 本機那次驗證做的是「把版型檔案讀出來、字串替換、丟到瀏覽器開」，這件事本身完全沒問題——瀏覽器直接讀本機的 HTML 檔案，不會經過任何 SMTP 傳輸，所以看起來完美無缺。真正出問題的環節是「這段 HTML 字串被塞進一封信、透過 SMTP protocol 實際送出去」這一步，本機驗證完全沒有覆蓋到，這是這次沒抓到問題的根本原因。

**根本原因：** 用 `awk` 量了一下版型檔案每一行的長度，發現全檔案 246 行裡，其中一行（那個內嵌 Hero 背景圖片的 `<td>` 標籤）長度是 **384,569 字元**，其餘每一行都在 350 字元以內——這行差距懸殊到不像巧合。這行之所以這麼長，是因為 Lindy 原始設計檔案把 Hero 背景裝飾圖直接用 `background-image:url('data:image/png;base64,...')` 的方式整張內嵌在 CSS 屬性值裡，沒有斷行。SMTP／MIME 傳輸對單行長度是有慣例限制的（RFC 5322 建議每行不超過 998 字元），超過這個長度的內容如果沒有被正確做「軟斷行」（quoted-printable／base64 轉碼時會自動在安全的位置插入可還原的換行符），有些中繼郵件伺服器或收件端會自己在不對的位置硬塞一個換行進去——如果剛好塞在 CSS `url('...')` 的單引號中間，就會打斷屬性值的引號配對，讓 HTML 解析器從那個位置開始「迷路」，接下來看到的標籤全部不會被當成標籤解析，而是當成純文字直接顯示在畫面上——這正好完全符合你截圖看到的現象：品牌列（在那個超長行之前）正常顯示，超長行之後全部破版。

**修正：** 把這張圖片從版型裡抽出來，寫一支一次性小腳本把 base64 字串解碼還原成真正的 PNG 二進位檔案，存到 `public/email-assets/hero-bg.png`（1040×860，288KB，跟落地頁其他靜態圖片一樣，透過部署網址公開存取，不是動態上傳產生的檔案，所以不會踩到 Phase 36 那個「`next start` 不會動態發現執行期間新寫入 `public/` 的檔案」的坑——這張圖是隨 git 一起部署上去的，伺服器啟動時就已經在硬碟上）。版型裡的內嵌 base64 換成 `url('{{ASSET_BASE_URL}}/email-assets/hero-bg.png')`，跟姓名一樣是個佔位字串，寄信時（`lib/integrations/email.ts`）代入實際網域——新增 `EMAIL_ASSET_BASE_URL` 環境變數可覆寫，未設定時預設用現行正式網域 `https://2026-forum.agatha-ai.com`。改完之後，版型檔案最長的一行從 384,569 字元降到 334 字元，整封信的大小從約 400KB 降到約 16KB。

**驗證方式：**
1. `npm run build` 過。
2. 寫腳本把兩個佔位字串都代入實際值，量測輸出結果：確認沒有任何一行超過 350 字元（遠低於容易觸發傳輸斷行問題的門檻）、沒有任何佔位字串殘留、圖片網址正確組出 `https://2026-forum.agatha-ai.com/email-assets/hero-bg.png`。
3. 起本機 dev server，直接用瀏覽器打開 `http://localhost:3000/email-assets/hero-bg.png` 確認回傳 200 且檔案大小吻合——證明這張圖片會被 Next.js 當成一般靜態資源正常提供，不需要額外設定路由。
4. 用瀏覽器打開替換後的完整信件 HTML，確認畫面上讀不到任何一段裸露的 HTML 標籤文字，姓名正確顯示。
5. 驗證用的暫存檔案（暫時放到 `public/` 底下方便瀏覽器打開的預覽檔、一次性解碼腳本）驗證完都刪除，沒有留在專案裡。

**注意：** 這次修正只解決「內嵌圖片導致信件破版」這個問題本身；真正的「收件人實際收到信、畫面正常」這件事，因為工程端沒有你的信箱收件權限，最終還是要請你這次重新測試一次確認。另外這也是一個值得記住的教訓：**HTML email 用內嵌 base64 圖片本來就是業界公認不建議的作法**（不只是這次遇到的傳輸斷行問題，Outlook 桌面版等多個信箱用戶端本來就不支援 data: URI 圖片，就算沒破版也會直接看不到圖），之後如果 Lindy 或其他人再提供新的信件版型設計檔，內嵌圖片這件事要在套用前就先處理掉，不要等寄出去才發現。

## Phase 41 — W2 8/10：Banner／Hero 重複顯示 bug 修復＋GTM 疑似安裝失敗查證（2026-08-10）

**起因：** 進入第二週，Lindy 這次一口氣帶了三件事：（1）她說「新的 banner 新增後希望可以把舊的覆蓋掉」；（2）附了一張截圖，紅框框住畫面上一大塊區域，說這是「舊的 banner 區塊」，希望刪掉；（3）轉發了她自己用瀏覽器 Console 排查 GTM 的完整記錄，判斷 GTM 容器沒有正確載入，要求盡快確認修復，避免報名轉換數據漏追。

**Banner／Hero 重複顯示——查出來其實是同一個 bug，不是兩個各別需求：** 一開始看到「希望覆蓋掉」跟「希望刪除某個區塊」兩句話，容易誤以為是要新增一個功能（例如「上傳新圖時提示是否覆蓋」之類的確認機制）。但實際打開 `app/seminar/0915/page.tsx` 對照 Lindy 附的截圖紅框位置，發現紅框框住的其實就是**專案裡本來就寫死在程式碼裡的 Hero 區塊**（標語、標題、副標、日期時間、標籤、兩顆按鈕）——而這個區塊，跟 8/6 做的 Banner 上傳功能（`/admin/banner`）是**完全獨立、各自渲染的兩塊東西**，沒有任何互斥邏輯。

回頭查 [`openspec/specs/banner-cms/spec.md`](openspec/specs/banner-cms/spec.md)（8/6 那次已核准歸檔的規格），第一條 Requirement 白紙黑字寫著：「The system SHALL render the landing page's hero section banner image from stored data ... **instead of** the current CSS-only hero visual」，Scenario 也寫「沒有上傳 banner 時才 fallback 回 CSS-only 視覺」——換句話說，**規格從一開始就是「上傳的圖片取代寫死的 Hero，不是兩者並存」**，但 `page.tsx` 的實際程式碼裡，那段寫死的 `<section className="hero">` 完全沒有依照 `banner` 是否有值去包一層條件式，不論有沒有上傳圖片都無條件渲染。這是一個**跟已核准規格對不上的實作缺口**，不是新的設計討論，所以不需要重新走一輪 proposal/design 的 OpenSpec 流程，直接當 bug 修（比照 Phase 36 上傳 404 那次的處理方式）。

直接連正式站用瀏覽器量了一下實際渲染結果，證實現在正式站上 `banner.desktopUrl`／`banner.mobileUrl` 兩個欄位其實都已經有值（Lindy 兩張圖都上傳完成了），畫面依序是：導覽列 → 上傳的 banner 圖片（711px 高）→ 緊接著寫死的 Hero 內容又重複一次（563px 高）→ 其餘頁面內容。跟截圖對得上。

**修正：** 在 `app/seminar/0915/page.tsx` 新增 `hasFullBanner = Boolean(banner?.desktopUrl && banner?.mobileUrl)`，把整段寫死的 `<section className="hero">...</section>` 包進 `{!hasFullBanner && (...)}`。這裡刻意用「兩張都要有」而不是「任一張有就好」——如果只用「任一張」判斷，遇到 Lindy只上傳完一半（例如先傳完桌機版、手機版還沒傳）的過渡狀態，會變成「只有其中一個裝置寬度看得到東西，另一個裝置寬度直接開天窗看到空白」，這比現在的「重複顯示」還要糟。用「兩張都要有」當作切換條件，未上傳完整之前維持現狀（可能還是會重複，但至少不會開天窗），兩張都補齊之後才整個切換成新版。

**驗證方式：**
1. `npm run build` 過。
2. 本機資料庫沒有 banner 資料（`null`），起 dev server 確認 Hero 區塊正常顯示、`.hero-banner` 不存在——fallback 情境沒有被這次改動破壞。
3. 寫一支一次性腳本把本機 `Banner.singleton` 兩個欄位都填上假路徑，重新整理頁面，確認 `.hero` 消失、`.hero-banner` 出現，同時確認導覽列的「立即申請報名」按鈕與右下角浮動的「立即報名」按鈕都還在、沒有被這次改動波及（這兩個是除了 Hero 區塊本身以外，頁面上僅剩的其他報名入口，確認拿掉 Hero 內容不會讓使用者找不到路徑報名）。
4. 把資料庫改成只填桌機欄位（模擬上傳到一半的過渡狀態），確認 `.hero` 跟 `.hero-banner` 同時存在——符合「兩張都要有才切換」的設計，這個過渡狀態下寧可維持現狀也不要讓手機版開天窗。
5. 測試用的假 banner 資料驗證完全部清除，本機資料庫恢復成 `null`（乾淨狀態）。

**GTM 疑似安裝失敗——實測後確認是預期行為，不是 bug：** Lindy 轉發的診斷記錄本身的排查方法完全正確（檢查 `dataLayer`、`google_tag_manager`、view-source 找 GTM 標籤、Network 分頁找 `gtm.js` 請求），但沒有提到她是在什麼狀態下做的這次檢查。直接到正式站重現：**開一個全新瀏覽器分頁（沒有任何 cookie）**，打開 Console 檢查，果然跟她描述的一模一樣——`dataLayer` 裡只有手動 push 的 `cta_click`、`google_tag_manager` 是 `undefined`。但這正是預期行為：`components/GtmLoader.tsx` 的設計是「使用者點擊落地頁同意橫幅的『我同意』之前，完全不注入 GTM 容器腳本」，這是 8/4 就定案、對照交接文件隱私規範刻意做的節流機制，不是這次新出現的問題。

接著在同一個分頁裡實際點下「我同意」按鈕，馬上重新檢查：`google_tag_manager` 變成一個正常物件、`dataLayer` 裡出現 `gtm.js`／`gtm.dom`／`gtm.load` 三個事件、頁面上也多了一個 Facebook Pixel 的 `noscript` 追蹤標籤（`_fbp` cookie 也正確寫入），容器 ID 確認是正確的 `GTM-M6P5QTRM`，沒有打錯字或誤植其他網站 ID。這證明 GTM 容器本身的安裝完全正常，Lindy 檢查時應該是還沒點過同意橫幅就直接開 Console 看，才會得到「沒有載入」的結果——這次沒有動任何程式碼，純粹是查證後確認現況符合設計。

**同步更新：** README「內容管理：Hero Banner／活動資訊」小節補充 Banner 取代 Hero 的機制說明、專案進度追蹤表新增一列，「待確認事項」新增一項記錄 GTM 查證結果（已確認非 bug，附上實測證據，方便你直接轉貼回覆 Lindy）。這次 Banner 修正是 bug fix，沒有走完整 OpenSpec 流程（規格本身沒有變，只是把實作補回去符合原本已核准的規格）；GTM 部分則完全沒有程式碼異動，純查證。

## Phase 42 — Banner 底下文字貼太緊，補回間距（2026-08-10）

**起因：** Phase 41 的 Banner／Hero 重複顯示修好、部署上線後，你截圖回報 banner 顯示正常了，但緊接在下面的介紹文字（「當 Agentic AI 進入應用爆發期...」那段）貼著 banner 下緣，希望能空一點。

**原因：** `.hero-banner{width:100%;line-height:0}` 這個圖片區塊本身沒有任何底部間距（`line-height:0` 是為了讓圖片緊貼、不留下瀏覽器預設的行內元素縫隙），下面緊接著的介紹文字區塊只有 `padding-top:8px`（這個 8px 是當初設計來搭配「寫死的 Hero 區塊」用的——舊版 Hero 本身 `padding-bottom` 就有將近 70px，8px 只是補一點點零頭湊到跟其他區塊一致的 80px 節奏）。Phase 41 把 Hero 換成 Banner 之後，那將近 70px 的間距來源就這樣憑空消失了，只剩下單薄的 8px，才會看起來整個貼在一起。

**修正：** 在 `app/globals.css` 幫 `.hero-banner` 補上 `margin-bottom:56px`，讓 banner 圖片下緣到下一段內容之間恢復有像樣的呼吸空間（實測 banner 底部到文字頂部總共約 82px，接近全站其他區塊間慣用的 80px 節奏）。因為這個間距是掛在 `.hero-banner` 這個 class 本身，不是掛在後面接的區塊上，所以不管 banner 後面接的是「純文字介紹段落」（兩張圖都上傳完成的情況）還是「重複顯示的 Hero」（只上傳一張圖的過渡狀態），都會自動套用，不需要另外判斷。沒上傳 banner 時 `.hero-banner` 這個區塊整個不會出現在畫面上，這個間距也就不會產生任何影響。

**驗證方式：** 本機資料庫填入假 banner 資料模擬「兩張都上傳完成」的狀態，量測 banner 下緣到下一段文字之間的實際距離，確認新的間距生效；`npm run build` 通過；驗證用的假資料驗證完清除。

**同步更新：** 這次是單一 CSS 屬性的小修正，沒有異動 README 或另外開 OpenSpec change。

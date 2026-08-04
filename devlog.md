# 開發 Log（從頭到尾，逐 phase 記錄）

這是完整的開發時間軸記錄，涵蓋從需求理解、規劃到實作、驗證的每一步。操作說明看 [README.md](README.md)；規格文件在 [openspec/changes/add-seminar-registration-system/](openspec/changes/add-seminar-registration-system/)。

---

## Phase 1 — 需求理解與規劃（Plan Mode）

**做了什麼：**
- 讀取兩份參考資料：
  - CTO 交接文件（`.docx`）：這是二進位檔，Read 工具無法直接讀。改用 PowerShell 把 `.docx` 當 zip 解壓縮，解析 `word/document.xml` 的 XML，抽出段落文字與表格內容，轉成純文字檔再讀取。
  - 已核准的靜態 HTML 設計稿（989KB，單檔內嵌大量 base64 圖片）：先用 Grep 找出 `<section>`/`<script>` 等結構關鍵字定位每個區塊的行號，再用 `sed` 切出小段分別 Read，避免一次讀進整份超大檔案觸發 token 上限。
- 確認交接文件核心要求：CTO/工程負責「報名頁＋自建後台、GTM、GA4／Meta 像素埋設、交易信 API 串接與網域驗證、感謝頁、UTM 落庫、開後台權限給公關」，§12 訂 8/5–8/7 為 staging 測試窗口。
- 用 AskUserQuestion 向使用者確認 4 個關鍵技術決策（因為現有專案資料夾裡完全沒有既有骨架，這些都是無法從程式碼推論、只能問人的決定）：
  1. 技術棧 → **Next.js 全端**
  2. 資料庫 → **託管 Postgres／Supabase**
  3. 後台範圍 → **V1 簡化版：單一共用密碼**
  4. 第三方憑證現況 → **都還沒有，先用預留環境變數**
- 使用者在規劃過程中插入兩則訊息：重申「這是主管指派的 CTO/工程業務，明天 8/5 前要做完」、以及「做完要有一版 README 把 material 寫清楚」。
- 把完整計畫寫進 plan 檔，內容包含 Context、OpenSpec 規格骨架步驟、系統架構圖、關鍵檔案清單、Registration 資料表欄位、事件字典對應、待確認事項、README 交付物規格、驗證方式。
- 呼叫 ExitPlanMode，使用者核准。

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
- `preview_start({name: "seminar-dev"})` 第一次執行時，實際啟動的是另一個專案（roommate-utility-calculator）殘留在主要工作目錄 `.claude/launch.json` 裡的 `streamlit-app`（port 8501），因為 `seminar_apply` 一開始沒有自己的 `launch.json`。發現後在 `seminar_apply/.claude/launch.json` 新增正確設定，但 `preview_start` 的 `name` 查找似乎仍固定指向主要工作目錄的設定檔，沒有改用新設定。改用替代方案：直接用 Bash 在背景執行 `npm run dev`，等它印出 `Ready` 之後，用 `preview_start({url: "http://localhost:3000/..."})` 開分頁連過去，成功繞過這個限制。
- `computer({action: "screenshot"})` 每次都逾時失敗，錯誤訊息是「Browser pane is not displayed, so the page is not compositing frames」——這個環境的瀏覽器分頁沒有被畫面顯示出來（可能使用者端沒開啟該面板），導致無法截圖做視覺比對。**因此本次沒有用截圖驗證過實際排版/RWD/動畫效果**，只驗證了 DOM 結構、文字內容、互動邏輯（點擊、表單送出、API 回應）。如果要嚴謹核對視覺呈現，需要在有畫面顯示的環境下重跑一次截圖驗收。

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
- 使用者事後傳來一則背景任務通知，顯示先前那個逾時被丟到背景執行的 `docker info` 指令「完成了（exit code 0）」，看起來像是 Docker 突然好了。
- 重新檢查該指令的實際輸出：內容只印到 Docker CLI 的 plugin 清單（`agent`/`ai`/`buildx`/`compose`/`debug`，這些都是 Client 端資訊），並沒有真正印出 Server 端狀態，代表當時其實還是沒有真正連上 daemon，只是指令本身不再無限期卡住而已。
- 為了確認，主動重新執行一次 `docker info`：得到跟一開始一模一樣的錯誤（`dockerDesktopLinuxEngine` pipe 連不上）。
- **結論：Docker 目前仍不可用，維持 SQLite 現況不強行切換**，避免在沒把握的狀態下改動已經驗證通過的資料庫層。等使用者在自己機器上確認 Docker Desktop 真的能正常啟動、或 Supabase 帳號到位，再照 README 的切換步驟處理。

---

## Phase 14 — 本開發 Log 建立

- 使用者要求把整個開發過程「by phase、step by step」完整記錄進一份開發 log。本檔案即為該紀錄，取代先前建立的簡版 `DEVLOG.md`（已刪除，內容整合進本檔並補齊 Phase 1 的規劃階段細節）。

---

## Phase 15 — README 補圖表與檔名調整

- 在 `npm install`／`npx prisma migrate dev` 的實際操作中，發現使用者打成 `npm prisma migrate dev`（漏了 `x`）——這不是專案的問題，是 npm/npx 指令混淆，已在對話中說明差異並提醒 `package.json` 裡有 `npm run db:migrate` 這個別名可以用。
- 使用者詢問「現在的網頁和 demo 原型 HTML 差在哪裡」，整理成一份對照表（送出邏輯、UTM、感謝頁、追蹤、確認信、Meta CAPI、後台、匯出），核心結論：畫面是同一套皮，差別都在「送出之後」的資料流與後台，追蹤／寄信這些第三方整合管線已經接好但因無憑證而是安全的 no-op。
- 依使用者要求，把上述對照表寫進 `README.md`（新增「跟原型 HTML 差在哪」一節，放在系統架構圖之前）。
- 依使用者要求把檔名 `開發log.md` 改成 `devlog.md`（改用純英文檔名），同步修正 `README.md` 裡的所有連結與專案結構樹裡的檔名引用，以及本檔內部提到自己檔名的地方。

---

## Phase 16 — README 視覺整理（比照 baby-project 範例，本次）

- 使用者貼了另一個專案（`baby-project/README.md`）的畫面截圖當範例，要求「README 一樣整齊好看」、「資料流像這樣做一個圖」。讀取該檔案的原始 Markdown，確認畫面的整齊感來自：頂部技術棧 badge、依負責人上色的 `mermaid flowchart`（用 `classDef` 上色而非預設灰底）、對齊整齊的 tree 區塊，而不是什麼特殊渲染器——都是標準 Markdown + Mermaid，換一個支援 Mermaid 的檢視器（GitHub／VS Code／Cursor 等）就能看到同樣效果。
- 對應改造 `README.md`：
  1. 頂部加技術棧 badge（Next.js／TypeScript／Prisma／SQLite／Supabase／狀態）。
  2. 新增「目錄」錨點連結（對照 baby-project 的目錄節）。
  3. 新增「角色與分工」一節，把交接文件 §0 的角色表（Lindy／CTO／公關／BD）轉成跟 baby-project 一樣的彩色圓點標示法（🔵 CTO・🟠 Lindy・🩷 公關・🟣 公司），這組顏色之後在資料流圖、`.env` 表、專案結構樹裡重複使用，維持一致。
  4. 把原本分開的「系統架構圖」（`graph TD`）與「資料流圖」（`sequenceDiagram`）**合併成一張**「系統資料流」`flowchart TD`（對照使用者原話「資料流像這樣做一個圖」是單數），用 `classDef` 依「憑證/操作由誰負責」上色，而不是依技術模組上色——這樣顏色才對應到「這格要等誰」，比純技術分層更有資訊量。
  5. `.env` 逐項說明表、專案結構樹也補上對應色點，讓「誰負責」這件事在全篇文件視覺上一致，不用每節重新說明一次。
  6. 「專案結構」保留先前已澄清的說明——**明確標注這不是 monorepo**（單一 Next.js App Router 專案），不是照抄使用者截圖的標題字面照搬成錯誤說法。
- 使用者接著要求新增「工作區紀錄」小節，用表格列 `open`／`ongoing`／`done` 三態。新增在 README 最後一節，把先前散落在各節的「已知偏離」「待確認事項」「下一步」等未完成項目，收斂成一張單一狀態表，並定義三態的判斷標準（`done`=已完成並驗證；`ongoing`=程式碼/管線就緒但等外部條件；`open`=還沒動工或卡在工程無法自己解決的外部依賴），避免跟既有段落內容重複又對不上。
- 無執行面問題，純文件排版與資訊架構調整，未動到任何程式碼。

---

## Phase 17 — README 用詞專業化（本次）

- 使用者指定 4 組標題改法（這是什麼→專案說明；跟原型HTML差在哪→與原型HTML差異；角色與分工→移除該節的 badge 圖片；怎麼跑起來→測試步驟），並要求「類似以上用詞，請盡量專業」，即整份 README 依同樣精神做用詞正式化，不只改這 4 處。
- 依此原則，將所有標題與跨節指稱同步改為正式書面語，並更新對應的「目錄」錨點連結（逐一手算 GitHub 風格 slug 規則核對過，未直接假設）：
  - `/admin` 怎麼用 → `/admin` 操作說明
  - `.env` 逐項說明（誰要提供，對照文件 §0／§11） → `.env` 環境變數說明（責任分工，對照文件 §0／§11）
  - 已知偏離計畫之處 → 已知偏離計畫事項
  - §12 測試表對照：今天測過 vs 卡在憑證 → §12 測試表對照：已完成測項與待驗證測項
  - 待確認事項（可直接轉發給 Lindy／公關） → 待確認事項（可轉知 Lindy／公關）
  - 下一步（對照文件 §10 關鍵時程） → 後續規劃（對照文件 §10 關鍵時程）
  - 工作區紀錄 → 專案進度追蹤
- 表格欄位標題也一併調整：「誰提供」→「負責提供」、「沒有時會怎樣」→「未設定時之行為」；內文用語如「這樣」「怎麼」「沒有」「跑起來」「打不開」等口語詞替換為「如此」「操作」「未設定」「執行」「無法存取」等書面語；「跟...差在哪」表格的欄位標題也同步改為「原型 HTML」／「本次 Next.js 實作」。
- 「角色與分工」一節依使用者指示移除原本 4 條 shields.io badge 圖片，僅保留文字說明與角色分工表格。
- 全篇改寫後重新檢查所有內部跨節引用文字（例如頂部狀態列提及「見下方」的段落名稱、`/admin 操作說明` 第 4 點提及「後續規劃」）確保與新標題一致，避免指稱對不上。
- 無執行面問題，純文件用詞調整，未動到任何程式碼；系統資料流的 mermaid 圖表僅微調節點標籤文字用詞，節點 ID 與結構未變動。

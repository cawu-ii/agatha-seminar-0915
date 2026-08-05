## Why

Agatha 9/15「製造業 Agentic AI 商用實戰論壇」目前只有一份已核准的靜態 HTML 設計稿（`agatha-seminar-landing-0803.html`），表單送出只是前端假成功，沒有後端、沒有資料落地、沒有 UTM 追蹤、沒有 GTM/GA4/Meta 像素、沒有交易信、沒有感謝頁、沒有給公關用的後台。CTO 交接文件（0729 版）§0 把「報名頁＋自建後台、GTM、GA4／Meta 像素埋設、交易信 API 串接與網域驗證、感謝頁、UTM 落庫、開後台權限給公關」全部指派給 CTO/工程，且 §12 訂出 8/5–8/7 為 staging 測試窗口、8/10 正式上線、8/11 開放報名＋投廣。必須現在把這些能力補齊，才有東西可以在 8/5 進 staging 測試。

## What Changes

- 新增 Next.js 全端專案，把既有靜態設計稿轉成可運作的頁面（文案/樣式不變）。
- 新增報名資料落庫：Postgres（本地 Docker，之後接 Supabase）+ Prisma schema，含 UTM 欄位與審核狀態欄位。
- 新增 `POST /api/register`：驗證 → 寫庫（=名單真相、觸發點）→ 非同步寄確認信 → 非同步送 Meta CAPI → 回傳 event_id，並用 idempotency key 防重複送出。
- 新增落地頁的 UTM 隱藏欄位擷取、同意橫幅（先同意才注入 GTM）、GTM/dataLayer 事件（`lp_view`、`cta_click`、`registration_submit`）。
- 新增獨立感謝頁 `/seminar/0915/thanks`（§8.2 官方文案 + 加入行事曆 + 返回活動頁），在此頁觸發 `registration_submit`（不含 PII）。
- 新增 `/admin`：單一共用密碼保護的後台，可查詢/篩選/標記/單筆重寄信，**不提供刪除、不提供整批匯出**。
- 新增交易信、Meta CAPI、Ragic 三個第三方整合點，皆用環境變數控制，未設定時安全 no-op + log，不影響報名主流程。
- 新增 CTO-only 匯出腳本（不掛在 admin UI），供之後彙整名單交給公關/Ragic。

## Capabilities

### New Capabilities
- `landing-page`: 報名落地頁 — 呈現活動資訊、擷取 UTM、同意橫幅、觸發 lp_view/cta_click、送出表單呼叫報名 API。
- `registration-api`: 報名寫入 API — 驗證表單、冪等寫庫、觸發後續非同步整合、回傳 event_id。
- `thank-you-page`: 感謝頁 — 官方文案、加入行事曆、觸發 registration_submit。
- `tracking-integration`: GTM/GA4/Meta 像素/同意橫幅 — 事件字典、無憑證時安全降級。
- `transactional-email`: 報名確認信 — 可插拔 provider，無憑證時 log-only。
- `admin-console`: 公關用後台 — 單密碼登入、查詢/篩選/標記/單筆寄信、禁止刪改與整批匯出。
- `data-export`: Ragic/名單匯出 — CTO-only 匯出路徑與 Ragic 串接 stub。

### Modified Capabilities
（無，本次為全新系統，沒有既有 spec 可修改）

## Impact

- 新增專案目錄 `seminar_apply/`（Next.js app、Prisma schema、`.env.example`、`README.md`）。
- 不修改也不刪除既有兩份參考檔（`agatha-seminar-landing-0803.html`、CTO 交接文件 docx），僅作為設計/內容來源。
- 新依賴：Next.js、Prisma、zod、(email provider SDK，預設 Resend)。本地開發需要 Docker（跑本地 Postgres）。
- 尚未動用的外部帳號/憑證（GA4、Meta 像素、交易信服務、Ragic、agatha-ai.com DNS/Vercel）— 全部走環境變數占位，待相關人員提供後即可上線，不需改程式碼。

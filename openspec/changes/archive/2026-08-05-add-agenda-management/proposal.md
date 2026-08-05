## Why

The CTO handoff doc was updated to v3 (0804 revision) with a new requirement from marketing/PR: **公關組可從後台新增會議議程並且 update 到前端** — PR needs to add/edit conference agenda items from the admin backend, with the change reflected on the public landing page immediately. Today the agenda section in `app/seminar/0915/page.tsx` is hardcoded JSX; every agenda change (a speaker swap, a time shift, a new panel slot — all realistic this close to a live event) currently requires an engineer to edit code and redeploy. That's the wrong turnaround time for content PR owns.

## v3 交接文件比對（0729 → 0804，完整差異）

逐項比對兩版交接文件的結果，供追溯依據。**本次 change 只針對「議程可由後台管理」這一項建規格**；其餘項目列在下方供記錄與後續排程，不在本次 capability 範圍內。

| # | 項目 | 0729 版 | 0804 版（v3） | 對本專案的影響 | 本次是否處理 |
|---|---|---|---|---|---|
| 1 | **議程管理** | 完全靜態，寫死在落地頁 JSX | 公關可從後台新增／編輯議程，即時反映到前台 | 需要新的資料模型＋後台 CRUD＋落地頁改為動態渲染 | ✅ 本次 change 的主體 |
| 2 | 報名頁網址 | `agatha-ai.com/seminar/0915` | `2026-forum.agatha-ai.com/seminar/0915`（新子網域） | 純部署/DNS 層級，路由本身是相對路徑，程式碼不受影響 | 否，記錄於下方待辦 |
| 3 | GA4 評估 ID | 尚未開通 | 已開通：`G-L8NZJXKM3J`，可直接交付 | GTM 容器 ID（`NEXT_PUBLIC_GTM_ID`）仍未提供，此項本身不影響程式碼 | 否，僅供知悉 |
| 4 | UTM 來源 | 4 來源＋波次區分（`utm_content=wave1/wave2/wave3`、`edm1/edm2`） | 6 來源（新增「合作夥伴」`utm_medium=referral`），**不分波段** | `lib/registration-schema.ts` 的 `utm_source`/`utm_content` 本就是自由字串，非 enum 限制，**新來源無需改程式碼** | 否，本就相容 |
| 5 | 報名名單匯出 | CSV，CTO-only 腳本／`/api/export`（`EXPORT_TOKEN`） | 要求 Excel（`.xlsx`），且需「走權限控管並記錄 log」 | `data-export` capability 之 REQUIRED 格式與稽核紀錄有變動，需求級變化 | 否，記錄於下方待辦（獨立 change） |
| 6 | 後台 CMS 範圍 | 無 | 議程、講者、合作夥伴、Banner、活動亮點、活動資訊、**報名表單欄** 皆可後台編輯 | 議程以外的區塊屬於同一類「內容可後台管理」需求，但範圍遠大於本次 | 否，議程為第一階段，其餘見下方待辦 |
| 7 | 公關帳號 | 單一共用密碼（V1，本專案既有決策） | 「給公關個別帳號（勿共用一組）」＋「權限只綁本場活動，結束即回收」 | 與既有 `admin-console` capability 的「單一共用密碼」設計衝突，屬需求級變化 | 否，記錄於下方待辦（既有 tasks.md 已列為 Phase B） |
| 8 | 後台通知功能 | 僅「重寄確認信」（單筆） | 「在後台內發送行前／會後通知」 | 可能指批次通知寄送，非單純重寄，需求不明確需再確認 | 否，記錄於下方待辦 |
| 9 | Meta Pixel 追蹤細節 | 簡述 | §6.7 明列 4 項追蹤重點（轉換數／UTM 來源／產業屬性／優化依據） | 現有 `tracking-integration`／Meta CAPI 實作已涵蓋（event_id 去重、非個資參數、雜湊 email/phone），**無需改動** | 否，已相容 |
| 10 | 投廣週報 | 每週一，8/11 起 | 每週三，8/19 起；欄位大幅擴充（CTR／CPC／Saves／Shares／LP流量／CR／優化建議） | 純內部報表流程，不涉及本系統程式碼 | 否，非工程範圍 |
| 11 | 測試計畫（§12） | 10 項，含波次區分測試 | 10 項，新增「CMS 編輯」「名單匯出」測項，移除波次測項 | 呼應第 1、5 項；「CMS 編輯」測項即對應本次 change | ✅／否（詳見上）|

## What Changes

- 新增 `agenda-management` capability：後台可新增／編輯／刪除／排序議程項目（時間、標題、講者、是否為休息時段），落地頁議程區塊改為從資料庫讀取並依序渲染，取代現有寫死的 JSX。
- 落地頁議程區塊的視覺／HTML 結構（`.ag`／`.ag__row`／`.ag__time`／`.ag__t`／`.ag__spk`／`.ag__row--break`）維持不變，只把資料來源從硬編碼換成資料庫查詢——沿用「畫面不變、資料流換掉」的既有原則（與整個報名系統移植同一套做法）。
- 首次上線時以既有 8 筆議程內容做種子資料（seed），避免資料庫清空後前台議程區塊放空白。

## Capabilities

### New Capabilities
- `agenda-management`: 後台議程 CRUD（新增／編輯／刪除／排序）＋落地頁議程區塊改為資料驅動渲染。

### Modified Capabilities
（無。議程管理不改動 `landing-page`／`admin-console`／`registration-api` 等既有 capability 的既有 requirement——`admin-console` 現有「不能刪除／不能整批匯出」限制明文只針對「報名資料」，議程項目是不同實體，不受影響；落地頁的既有 requirement 未描述議程資料來源，純粹新增行為。）

## Impact

- 新增 Prisma model（`AgendaItem`）與對應 migration。
- 新增 `/admin` 議程管理畫面與對應 API routes（沿用既有單一共用密碼保護機制，議程管理視為 PR 日常操作範圍，不同於報名資料保護層級）。
- 修改 `app/seminar/0915/page.tsx` 的議程區塊渲染邏輯（server component 直接查詢資料庫）。
- 不影響：報名 API、追蹤事件、確認信、UTM 落庫、匯出腳本等既有能力。
- 本提案未涵蓋之項目（見上方比對表第 2、5、6、7、8 項）如需推進，建議另開獨立 change proposal，避免單一 change 混雜過多不相關 capability。

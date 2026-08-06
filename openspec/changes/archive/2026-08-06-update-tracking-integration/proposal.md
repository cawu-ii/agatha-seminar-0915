## Why

交接文件更新至 0805/0806 修訂版（`Agatha_Seminar_報名系統與追蹤_CTO交接文件_0805.docx`），由 Lindy 於 2026/08/06 轉發。與既有 `tracking-integration`／`thank-you-page` capability 直接相關的變化，逐項比對兩版文件原文如下：

1. **GTM／GA4 憑證已到位，且擁有者變成鼎東（公關技術團隊）**：GA4 評估 ID `G-C2D5DC3DLS` 已開通、GTM 容器 `GTM-M583KSV7` 已開通並「可直接交 CTO 埋設」。§5.1／§6.9 明確把「GTM Container 維護、GA4 Tag 建立、Meta Pixel／Meta Pixel Tag 建立、Trigger 設定、GTM Preview 與測試」全部劃給鼎東；湧現（CTO）只負責「Landing Page、CMS、Database、報名資料、Excel 匯出」。這跟 0804 版本「CTO 自己埋 GTM／GA4／Meta」的預設分工不一樣——這次是公關公司自己有技術團隊，把追蹤層的維運責任接走了，CTO 只需要把公關給的 GTM 容器 ID 掛進網站即可。
2. **GA4 主轉換事件（Key Event）改成 GTM 端設定，不是我方程式碼推送事件**：0805 版明文寫「本次不另外建立 `registration_submit` 事件；GA4 以 `generate_lead` 作為正式報名完成事件」，且 `generate_lead` 的觸發條件是「Trigger: `page_view`；Page Location contains: `/seminar/0915/thanks`」——這是鼎東在 GTM／GA4 後台設定的 Trigger，比對網址字串，不是我方前端程式碼推 dataLayer 事件。Meta 的 Lead 事件同理，建議「以 Thanks Page 作為完成事件，避免使用 Submit Button Trigger」。
3. **確認信寄件網域需完成 SPF／DKIM／DMARC**：§6.8 明確列出這三項為必須完成項目，屬於 DNS／網域層級設定，非工程程式碼可自行決定，需與網域管理者（主管方）確認。
4. **事件字典重新定義**：§6.6 的事件字典僅列 `page_view`（GTM 自動，非我方推送）、`cta_click`（我方推送，維持不變）、`generate_lead`（GTM Trigger，非我方推送）、`Meta Lead`（GTM/Meta 端，非我方推送）。`lp_view` 未被提及、也未被禁止，維持既有實作不動——這份文件沒有理由要求移除它，貿然拔掉屬於超出範圍的改動。

比對過程中，另外發現一個**既有、非本次文件更新引起、但值得順手修正的文案錯誤**：確認信主旨/內文、感謝頁、加入行事曆檔案這三處的活動名稱寫成「製造業 **Agentic** AI 商用實戰論壇」，但 0804／0805 兩版文件的官方文案（§8.1／§8.2）皆一致寫「製造業 AI 商用實戰論壇」（無「Agentic」字樣）——與網站標題列（`app/layout.tsx`）、落地頁頁尾已經正確不含「Agentic」的版本不一致。這是三選一的複製貼上落差，不是本次交接文件的新需求，但既然這次要逐字核對確認信文案，一併修正。

## What Changes

- `tracking-integration` capability：事件字典的 MODIFIED 需求，從「`lp_view`／`cta_click`／`registration_submit` 三個事件」改為「`lp_view`／`cta_click` 兩個由前端推送的事件，GA4 Key Event（`generate_lead`）與 Meta Lead 由鼎東於 GTM／GA4 後台設定 Trigger（比對 Thanks Page 網址），不由前端程式碼推送」。
- `thank-you-page` capability：移除「頁面載入時推送 `registration_submit` 事件」這條需求（REMOVED），新增「Thanks Page 網址本身即為轉換量測依據，交由外部 GTM／GA4 設定」的說明性需求（ADDED），釐清這件事現在是設定問題，不是程式碼問題，但程式碼仍必須保證 Thanks Page 網址維持 `/seminar/0915/thanks` 不變（本就如此，未變動）。
- 移除已無用途的 `ThanksTracker` 元件與 `registration_submit` 事件型別（程式碼清理，不是需求本身要求「移除程式碼」，而是這段程式碼推送的事件已經沒有任何 GTM Trigger 會去監聽，留著只會讓人誤以為它還有作用）。
- 修正確認信／感謝頁／加入行事曆檔案裡多出來的「Agentic」字樣，改回與官方文案一致的「製造業 AI 商用實戰論壇」。

## Capabilities

### Modified Capabilities
- `tracking-integration`
- `thank-you-page`

### New Capabilities
（無）

## Impact

- `lib/gtm.ts`：`DataLayerEvent` 型別移除 `registration_submit` 變體。
- `components/ThanksTracker.tsx`：刪除（不再有任何呼叫端）。
- `app/seminar/0915/thanks/page.tsx`：移除 `ThanksTracker` 的 import 與使用；修正文案「Agentic」字樣。
- `components/AddToCalendar.tsx`、`lib/integrations/email.ts`：修正文案「Agentic」字樣。
- 不影響：`landing-page`（`lp_view`／`cta_click` 維持不動）、`registration-api`、`admin-console`、`data-export`、`agenda-management`、講者/夥伴/亮點/表單選項 CMS。
- 部署面：`.env` 的 `NEXT_PUBLIC_GTM_ID`（`GTM-M583KSV7`）、`NEXT_PUBLIC_GA4_ID`（`G-C2D5DC3DLS`，僅供備忘，程式碼不直接讀取）已有真實值可填，屬於部署設定動作，記錄於 README，不在本次 change 的程式碼範圍內。
- SPF／DKIM／DMARC：DNS 層級設定，記錄於 README「待確認事項」，非本次 change 的程式碼範圍。

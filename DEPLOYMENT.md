# EC2 部署注意事項

本檔案給即將把本專案拉到公司 EC2 工作機上執行的人使用。範圍限定在**工程端**：把應用程式在 EC2 上正確跑起來、資料庫正確初始化、程式以正式模式常駐執行。**網域與 DNS 綁定由主管方處理**，不在本檔案範圍內，僅在「與主管方需要對齊的事」一節列出工程端需要提供／確認的資訊。

---

## 目錄

- [部署前必須確認的 EC2 條件](#部署前必須確認的-ec2-條件)
- [環境變數：從零開始建立](#環境變數從零開始建立)
- [部署步驟（全新機器，第一次上線）](#部署步驟全新機器第一次上線)
- [讓程式常駐執行（pm2 或 systemd）](#讓程式常駐執行pm2-或-systemd)
- [與主管方需要對齊的事（網域／反向代理）](#與主管方需要對齊的事網域反向代理)
- [上線前自我檢查清單](#上線前自我檢查清單)
- [資料庫是單一檔案：備份與規模限制](#資料庫是單一檔案備份與規模限制)
- [之後要更新版本時（redeploy）](#之後要更新版本時redeploy)
- [仍待補齊的第三方憑證](#仍待補齊的第三方憑證)

---

## 部署前必須確認的 EC2 條件

這幾項如果搞錯，輕則程式起不來，重則報名資料在某次重啟後直接消失，務必在動手前逐項確認：

1. **硬碟必須是 EBS（持久化），不能是 Instance Store**。資料庫是本機檔案（SQLite），寫入的資料就存在這台機器的硬碟上。Instance Store 型態的儲存空間在機器停止（stop，非 reboot）時會被清空，屆時所有報名資料會直接消失且無法復原。開機前務必確認這台 EC2 掛載的是 EBS volume。
2. **只能有一台常駐的應用程式行程**，不能做水平擴展（多台 EC2 各自跑一份）。SQLite 檔案不是共用資料庫，兩個行程各自寫入會導致資料分歧、甚至檔案損毀。如果之後真的需要多台機器分攤流量，要先評估切回 Postgres 或啟用專案裡已經預留的 Turso（雲端託管 SQLite）路徑，不能直接疊加一台新機器了事。
3. **Node.js 版本 18.18 以上**（建議直接用 20 LTS），這是 Next.js 15 的最低需求。用 `node -v` 確認。
4. **Security Group 只開必要的 port**：對外只需要 443（及可能的 80 用於轉址到 443），應用程式本身監聽的 port（預設 3000）不應該直接對外開放，應該透過反向代理（見下方「與主管方需要對齊的事」）。SSH（22）建議限制來源 IP，不要對全網開放。
5. **確認這台機器不是別的服務也在用的共用機器**，或至少確認 port 3000（或你們決定使用的 port）沒有被佔用。

---

## 環境變數：從零開始建立

`.env` 是被 `.gitignore` 排除的檔案，`git pull` / `git clone` 下來的 EC2 機器上**不會有這個檔案**，必須手動建立：

```bash
cp .env.example .env
```

打開 `.env`，逐項確認：

| 變數 | 正式環境該怎麼填 |
|---|---|
| `DATABASE_URL` | 保留預設 `file:./dev.db` 即可（或改成 `file:./prod.db` 之類名稱，路徑一致就好），Prisma CLI 用這個連線字串執行 migrate |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | **留空**。目前用純 SQLite，這兩個是選用的雲端託管路徑，不需要 |
| `SESSION_SECRET` | **不要沿用本機開發用的值**，正式環境要重新產生一組：`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `EXPORT_TOKEN` | 同上，正式環境重新產生一組隨機字串，跟 `SESSION_SECRET` 用不同的值。這組只給你自己（CTO）保管，不會交給公關 |
| `INITIAL_CTO_EMAIL` / `INITIAL_CTO_PASSWORD` | 填你要用來登入的 email 與一組**正式強度**的密碼（不要用 `.env.example` 裡的 `change-me-then-forget-it` 佔位字串）。這兩個變數只在 `npm run seed:admin` 執行的當下被讀取一次，建立完第一個 CTO 帳號後就不再被程式讀取，但建議帳號建立成功、確認能登入後，把 `.env` 裡這兩行刪掉或清空，避免密碼明文長期留在檔案裡 |
| `NEXT_PUBLIC_GTM_ID` / `NEXT_PUBLIC_GA4_ID` | **已定案（2026/08/06）**：`NEXT_PUBLIC_GTM_ID` 填 `GTM-M6P5QTRM`（湧現／Lindy 自建容器）；`NEXT_PUBLIC_GA4_ID` 填 `G-C2D5DC3DLS`（僅供備忘，程式碼不直接讀取，實際由 GTM 容器內的 Tag 管理）。若部署當下這兩個值又變動，以最新交接文件為準，留空也安全（不影響運作，只是不注入追蹤腳本） |
| `META_CAPI_TOKEN` / `META_PIXEL_ID` | 同上，留空即為安全的 no-op |
| `EMAIL_PROVIDER` / `RESEND_API_KEY` / `EMAIL_FROM` | 若交易信帳號還沒到位，`EMAIL_PROVIDER` 留 `none`，程式只會 log 不會寄信、也不會報錯 |
| `RAGIC_API_TOKEN` / `RAGIC_BASE_URL` | 目前是 no-op stub，留空即可 |

**檢查方式**：`.env` 建好之後，`cat .env`（或用編輯器打開）逐行核對，尤其確認 `SESSION_SECRET` 和 `EXPORT_TOKEN` 不是空字串、不是 `.env.example` 裡的預設佔位字串——這兩個一旦用預設值上線，等於誰都能偽造登入 session 或匯出權杖。

---

## 部署步驟（全新機器，第一次上線）

依序執行，**中間任何一步失敗都先解決再往下走**，不要跳過：

```bash
# 0) 取得程式碼
git clone https://github.com/cawu-ii/agatha-seminar-0915.git
cd agatha-seminar-0915

# 1) 安裝依賴 —— 必須在 EC2 這台機器上直接跑，不要把本機（Windows）
#    的 node_modules 複製過來。@libsql/client 等套件含平台相關的原生
#    綁定，Windows 裝的跟 Linux 上要跑的不是同一份檔案。
npm install

# 2) 建立 .env（見上一節，務必填好 SESSION_SECRET / EXPORT_TOKEN / INITIAL_CTO_*）
cp .env.example .env
# ...編輯 .env...

# 3) 產生 Prisma Client
npx prisma generate

# 4) 建立資料庫結構 —— 正式環境用 migrate deploy，不要用 migrate dev
#    （migrate dev 是互動式的開發指令，正式環境不該用，且可能在無資料庫
#    歷史的機器上要求額外確認）
npx prisma migrate deploy

# 5) 建立第一個 CTO 帳號（讀取 .env 裡的 INITIAL_CTO_EMAIL / INITIAL_CTO_PASSWORD）
#    ***這一步務必要跑，不要跳過*** —— 沒跑這步，/admin 會顯示「帳號或密碼錯誤」，
#    看起來像密碼設錯了，其實是資料庫裡根本沒有任何帳號可以比對。
npm run seed:admin

# 6) 灌入內容初始資料（議程／講者／合作夥伴／活動亮點／報名表單選項清單／活動資訊）
#    ***這六行也務必都要跑，不要跳過*** —— 前四行沒跑，對應區塊在落地頁上會是
#    空白（不是壞掉，是還沒有資料）；***seed:form-options 沒跑則更嚴重***：
#    報名表單會沒有選項可選，且 POST /api/register 會直接 500，等於報名功能整個
#    壞掉，不只是某個區塊空白而已。seed:event-info 沒跑，落地頁「活動資訊」四張
#    卡片會直接不顯示對應卡片（不會報錯，元件逐筆檢查資料是否存在）
npm run seed:agenda
npm run seed:speakers
npm run seed:partners
npm run seed:highlights
npm run seed:form-options
npm run seed:event-info
# 注意：Banner 沒有對應的 seed 指令，全新環境本就是「尚未上傳」狀態，
# 需要有人登入 /admin/banner 實際上傳桌機（2560×1440）與手機（1080×1350）
# 圖片，Hero Banner 區塊才會顯示；上線前檢查清單有把這步列進去

# 7) build 正式版本
npm run build

# 8) 先用前景模式試跑一次，確認沒有立即報錯
npm run start
# 另開一個終端機或用 curl 確認能連上：
#   curl -I http://localhost:3000/seminar/0915
# 確認回應是 200 之後，Ctrl+C 停掉這個前景行程，改用下一節的常駐方式執行
```

第 8 步若 `curl` 沒有回應或報資料庫錯誤（`no such table`），代表第 4 步的 migrate 沒有成功套用，回去檢查 `DATABASE_URL` 指到的路徑是否有寫入權限。

**第 5、6 步是最容易漏跑的兩步**（先前部署時就各漏過一次）：`migrate deploy` 只會建表結構，不會塞資料進去；表是空的，`/admin` 登不進去、落地頁對應區塊沒內容，但都不會報錯讓你注意到——`npm run build` 跟 `curl` 健康檢查都會正常通過。上線前務必照著「[上線前自我檢查清單](#上線前自我檢查清單)」實際登入一次、看一次落地頁每個區塊，而不是只看 build 有沒有過。

---

## 讓程式常駐執行（pm2 或 systemd）

`npm run start` 只是前景執行，SSH 斷線就會跟著死掉，且機器重開機不會自動復活。正式環境要用行程管理工具接管，這裡示範 `pm2`（也可以改用 `systemd`，效果相同，看你們機器上比較習慣哪一種）：

```bash
npm install -g pm2

# 啟動，取個好辨識的名字
pm2 start npm --name agatha-seminar -- run start

# 確認狀態
pm2 status
pm2 logs agatha-seminar

# 設定開機自動啟動（依指示執行它印出來的那行 sudo 指令）
pm2 startup
pm2 save
```

之後要重啟／看 log／停止，都是 `pm2 restart agatha-seminar` / `pm2 logs agatha-seminar` / `pm2 stop agatha-seminar`，不需要重新執行整套部署步驟。

---

## 與主管方需要對齊的事（網域／反向代理）

這部分工程端不用自己決定，但**需要主動提供以下資訊**給負責網域的人，避免對方猜測或來回確認：

1. **這台 EC2 應用程式監聽的 port**：預設是 `3000`（`next start` 的預設值），如果要改成別的 port，`package.json` 的 `start` 指令要加上 `-p <port>`，並同步告知對方改成了幾號。
2. **TLS（HTTPS）由誰處理**：常見兩種做法——(a) 這台 EC2 上額外裝一個 Nginx／Caddy 做反向代理並掛憑證（例如 Let's Encrypt），對外只開 443；或 (b) 前面掛 ALB（Application Load Balancer）在 ALB 層做 TLS termination，EC2 只需要對 ALB 開放 3000。**這件事要先問清楚採哪一種**，因為會決定 Security Group 要開放的來源與 port 不一樣。
3. **最終網域名稱**：確認之後，如果之後要啟用交易信（Resend）寄信功能，寄件網域的 SPF/DKIM 驗證要對到這個正式網域，不是 EC2 的預設 DNS 名稱。
4. **健康檢查路徑**（如果對方用的是 ALB 或類似機制）：可以用 `/seminar/0915`，會回 200。

---

## 上線前自我檢查清單

在告知主管方「可以掛網域了」之前，先在 EC2 本機（或透過 SSH port-forward：`ssh -L 3000:localhost:3000 <你的 EC2>`，再用自己電腦瀏覽器連 `http://localhost:3000`）走過一次：

- [ ] `/seminar/0915` 落地頁能正常開啟，議程／講者／合作夥伴／活動亮點／活動資訊五個區塊都有內容（不是空白）——這五個各對應一個 seed 指令，任一個忘記跑就會有一區是空的
- [ ] 登入 `/admin/banner` 上傳桌機（2560×1440）與手機（1080×1350）Hero Banner 圖片，回落地頁確認依裝置寬度正確切換顯示（未上傳前 Hero Banner 區塊不顯示是正常狀態，不是壞掉）
- [ ] 報名表單每個欄位（部門/職稱/產業/規模/議程興趣/導入階段/諮詢議題）都看得到選項，不是空的下拉/清單——對應 `seed:form-options`，這步沒跑報名功能會直接故障，不只是畫面好看與否的問題
- [ ] 實際填一筆測試報名並送出成功（不是只看表單畫面）——這一步同時驗證了 `seed:form-options` 有跑，以及動態驗證 schema 跟表單畫面的選項是同步的
- [ ] 填一筆測試報名資料送出，能正常導向 `/seminar/0915/thanks`
- [ ] 用 `INITIAL_CTO_EMAIL` / `INITIAL_CTO_PASSWORD` 登入 `/admin`，能看到剛剛那筆測試資料
- [ ] `/admin` 頁面看得到「帳號管理」「匯出 Excel」兩個按鈕（代表登入的是 CTO 角色，不是誤植成 PR）
- [ ] 從「帳號管理」建立一個測試用的 PR 帳號，登出後用它登入，確認看不到「帳號管理」「匯出 Excel」這兩個按鈕
- [ ] 清掉上面兩步產生的測試報名資料與測試帳號（測試帳號用停用即可，不用刪除，刪除會因稽核紀錄外鍵失敗，這是預期行為）
- [ ] `pm2 status` 確認行程是 `online` 狀態，`pm2 logs` 沒有持續報錯
- [ ] 重開機一次（或至少確認 `pm2 startup` 有正確設定），驗證程式會自動復活，不需要人工介入

---

## 資料庫是單一檔案：備份與規模限制

`prisma/dev.db`（或你在 `DATABASE_URL` 裡取的檔名）是這個系統唯一的資料真相，一旦上線開放報名，這個檔案裡就是**真實個資**。務必：

- 排一個定期備份（例如 cron 每天把這個檔案複製一份到 S3，或直接對這顆 EBS volume 排 EBS snapshot），現在專案本身沒有內建備份機制。
- 不要依賴 `npm run export:registrations` 產生的 `.xlsx` 當備份——那是給 Lindy／Ragic 用的名單匯出，不是資料庫備份，格式跟欄位範圍不保證跟資料庫結構一致。
- `public/uploads/`（Banner 上傳圖片）跟 `prisma/dev.db` 一樣是這顆 EBS volume 上的真實檔案，不在 git 版控裡（`.gitignore`）。上面的備份排程一旦排定，請把這個資料夾一併納入，不要只備份資料庫檔案——否則還原時資料庫裡的 `Banner.desktopUrl`/`mobileUrl` 會指向不存在的檔案。
- 再次提醒：**不能為了分攤流量而多開一台 EC2 各自跑一份**，會導致兩份資料庫各自累積、互相看不到對方的資料。真的有這個需求要提前跟我說，需要換架構（Turso 或 Postgres）。

---

## 之後要更新版本時（redeploy）

之後我這邊有新功能要上線時，在 EC2 上執行：

```bash
git pull
npm install
npx prisma generate
npx prisma migrate deploy   # 如果這次更新沒有新增資料庫欄位，這行不會做任何事，安全可重複執行
npm run build
pm2 restart agatha-seminar
```

`migrate deploy` 是冪等的（已套用過的 migration 不會重複套用），每次更新都可以照這個順序跑一遍，不需要另外判斷這次有沒有動到資料庫結構。

---

## 仍待補齊的第三方憑證

以下憑證除 `NEXT_PUBLIC_GTM_ID`／`NEXT_PUBLIC_GA4_ID`（已於 2026/08/06 定案，見上方環境變數表）外，其餘皆為留空、安全 no-op 狀態，不影響上線與報名流程，待對應窗口提供後填入 `.env` 並 `pm2 restart agatha-seminar` 即可啟用，不需要改程式碼：

| 憑證 | 提供窗口 |
|---|---|
| `NEXT_PUBLIC_GTM_ID` / `NEXT_PUBLIC_GA4_ID` | ✅ 已提供（`GTM-M6P5QTRM` / `G-C2D5DC3DLS`），部署時直接填入即可 |
| `META_CAPI_TOKEN` / `META_PIXEL_ID` | 鼎東（公關公司技術團隊） |
| `RESEND_API_KEY`（含寄件網域 SPF/DKIM/DMARC 設定） | 公司（BD／財務申辦交易信帳號） |
| `RAGIC_API_TOKEN` / `RAGIC_BASE_URL` | 不需要——交接文件明確「不串接 Ragic」，這組留空即可，永久 no-op |

詳細對照見 [README.md](README.md) 的「`.env` 環境變數說明」一節。

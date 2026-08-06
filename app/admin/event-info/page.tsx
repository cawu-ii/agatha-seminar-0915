import { EventInfoTable } from "@/components/EventInfoTable";
import { LogoutButton } from "@/components/LogoutButton";

export default function AdminEventInfoPage() {
  return (
    <div className="admin">
      <div className="admin__head">
        <div>
          <h1 style={{ color: "#14231b", fontSize: 24 }}>活動資訊管理</h1>
          <p style={{ color: "#5f7268", fontSize: 13 }}>
            編輯落地頁「活動資訊」區塊的日期／時間／地點／費用四張卡片內容，儲存後下次載入落地頁即會反映。固定 4 張卡片，無法新增或刪除。
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a className="btn btn--ghost" href="/admin">
            回報名後台
          </a>
          <LogoutButton />
        </div>
      </div>
      <EventInfoTable />
    </div>
  );
}

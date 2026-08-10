import { IntroCopyTable } from "@/components/IntroCopyTable";
import { LogoutButton } from "@/components/LogoutButton";

export default function AdminIntroCopyPage() {
  return (
    <div className="admin">
      <div className="admin__head">
        <div>
          <h1 style={{ color: "#14231b", fontSize: 24 }}>內文管理</h1>
          <p style={{ color: "#5f7268", fontSize: 13 }}>
            編輯落地頁 Hero 下方的介紹段落與「適合對象」區塊內文，儲存後下次載入落地頁即會反映。固定 2 個區塊，無法新增或刪除。
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a className="btn btn--ghost" href="/admin">
            回報名後台
          </a>
          <LogoutButton />
        </div>
      </div>
      <IntroCopyTable />
    </div>
  );
}

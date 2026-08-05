import { AgendaTable } from "@/components/AgendaTable";
import { LogoutButton } from "@/components/LogoutButton";

export default function AdminAgendaPage() {
  return (
    <div className="admin">
      <div className="admin__head">
        <div>
          <h1 style={{ color: "#14231b", fontSize: 24 }}>議程管理</h1>
          <p style={{ color: "#5f7268", fontSize: 13 }}>
            新增／編輯／刪除／排序落地頁的議程項目，儲存後下次載入落地頁即會反映。
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a className="btn btn--ghost" href="/admin">
            回報名後台
          </a>
          <LogoutButton />
        </div>
      </div>
      <AgendaTable />
    </div>
  );
}

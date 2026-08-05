import { PartnerTable } from "@/components/PartnerTable";
import { LogoutButton } from "@/components/LogoutButton";

export default function AdminPartnersPage() {
  return (
    <div className="admin">
      <div className="admin__head">
        <div>
          <h1 style={{ color: "#14231b", fontSize: 24 }}>合作夥伴管理</h1>
          <p style={{ color: "#5f7268", fontSize: 13 }}>
            新增／編輯／刪除／排序落地頁的合作夥伴牆，儲存後下次載入落地頁即會反映。
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a className="btn btn--ghost" href="/admin">
            回報名後台
          </a>
          <LogoutButton />
        </div>
      </div>
      <PartnerTable />
    </div>
  );
}

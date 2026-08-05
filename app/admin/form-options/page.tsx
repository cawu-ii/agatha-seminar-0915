import { FormOptionsTable } from "@/components/FormOptionsTable";
import { LogoutButton } from "@/components/LogoutButton";

export default function AdminFormOptionsPage() {
  return (
    <div className="admin">
      <div className="admin__head">
        <div>
          <h1 style={{ color: "#14231b", fontSize: 24 }}>表單選項管理</h1>
          <p style={{ color: "#5f7268", fontSize: 13 }}>
            新增／編輯／刪除／排序報名表單各欄位的選項內容，儲存後下次載入落地頁即會反映。欄位本身（種類、順序、是單選或複選）不在此調整。
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a className="btn btn--ghost" href="/admin">
            回報名後台
          </a>
          <LogoutButton />
        </div>
      </div>
      <FormOptionsTable />
    </div>
  );
}

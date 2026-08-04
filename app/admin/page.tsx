import { AdminTable } from "@/components/AdminTable";
import { LogoutButton } from "@/components/LogoutButton";

export default function AdminPage() {
  return (
    <div className="admin">
      <div className="admin__head">
        <div>
          <h1 style={{ color: "#14231b", fontSize: 24 }}>報名後台</h1>
          <p style={{ color: "#5f7268", fontSize: 13 }}>
            可查看、搜尋、篩選、標記處理狀態、重寄確認信。無刪除、無整批匯出（名單匯出請洽 CTO）。
          </p>
        </div>
        <LogoutButton />
      </div>
      <AdminTable />
    </div>
  );
}

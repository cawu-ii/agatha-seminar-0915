import { getCurrentAccount } from "@/lib/auth";
import { AdminTable } from "@/components/AdminTable";
import { LogoutButton } from "@/components/LogoutButton";

export default async function AdminPage() {
  const me = await getCurrentAccount();
  const isCto = me?.role === "CTO";

  return (
    <div className="admin">
      <div className="admin__head">
        <div>
          <h1 style={{ color: "#14231b", fontSize: 24 }}>報名後台</h1>
          <p style={{ color: "#5f7268", fontSize: 13 }}>可查看、搜尋、篩選、標記處理狀態、重寄確認信。無刪除功能。</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <a className="btn btn--ghost" href="/admin/agenda">
            管理議程
          </a>
          <a className="btn btn--ghost" href="/admin/speakers">
            管理講者
          </a>
          <a className="btn btn--ghost" href="/admin/partners">
            管理夥伴
          </a>
          <a className="btn btn--ghost" href="/admin/highlights">
            管理亮點
          </a>
          <a className="btn btn--ghost" href="/admin/form-options">
            管理表單選項
          </a>
          <a className="btn btn--ghost" href="/admin/banner">
            管理 Banner
          </a>
          <a className="btn btn--ghost" href="/admin/event-info">
            管理活動資訊
          </a>
          <a className="btn btn--primary" href="/api/admin/export">
            匯出 Excel
          </a>
          {isCto && (
            <a className="btn btn--ghost" href="/admin/accounts">
              帳號管理
            </a>
          )}
          <LogoutButton />
        </div>
      </div>
      <AdminTable isCto={isCto} />
    </div>
  );
}

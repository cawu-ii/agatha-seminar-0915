import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth";
import { AccountsTable } from "@/components/AccountsTable";
import { LogoutButton } from "@/components/LogoutButton";

export default async function AdminAccountsPage() {
  const me = await getCurrentAccount();
  if (!me || me.role !== "CTO") {
    redirect("/admin");
  }

  return (
    <div className="admin">
      <div className="admin__head">
        <div>
          <h1 style={{ color: "#14231b", fontSize: 24 }}>帳號管理</h1>
          <p style={{ color: "#5f7268", fontSize: 13 }}>
            僅 CTO 可見。個別建立公關帳號，活動結束後停用即可回收權限，不需刪除紀錄。
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a className="btn btn--ghost" href="/admin">
            回報名後台
          </a>
          <LogoutButton />
        </div>
      </div>
      <AccountsTable />
    </div>
  );
}

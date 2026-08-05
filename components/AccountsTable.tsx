"use client";

import { useCallback, useEffect, useState } from "react";

interface Account {
  id: string;
  email: string;
  name: string;
  role: "CTO" | "PR";
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

const EMPTY_FORM = { email: "", name: "", password: "", role: "PR" as "CTO" | "PR" };

export function AccountsTable() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newForm, setNewForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [resetPasswordFor, setResetPasswordFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/accounts");
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? "載入失敗，請稍後再試。");
        setAccounts([]);
        return;
      }
      setAccounts(data.accounts ?? []);
    } catch {
      setLoadError("連線失敗，請確認網路連線後重試。");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!newForm.email.trim() || !newForm.name.trim() || !newForm.password) {
      setFormError("Email、姓名、密碼為必填欄位");
      return;
    }
    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    const data = await res.json();
    if (!res.ok) {
      setFormError(data.error ?? "新增失敗");
      return;
    }
    setNewForm(EMPTY_FORM);
    await load();
  }

  async function toggleActive(id: string, current: boolean) {
    setBusyId(id);
    await fetch(`/api/admin/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !current }),
    });
    await load();
    setBusyId(null);
  }

  async function submitResetPassword(id: string) {
    if (newPassword.length < 8) {
      setFormError("密碼至少 8 個字元");
      return;
    }
    setBusyId(id);
    const res = await fetch(`/api/admin/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
    setBusyId(null);
    if (res.ok) {
      setResetPasswordFor(null);
      setNewPassword("");
      setFormError(null);
    } else {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error ?? "重設密碼失敗");
    }
  }

  return (
    <div>
      {loadError && <p className="admin__error">{loadError}</p>}

      {loading ? (
        <p style={{ color: "#5f7268" }}>載入中…</p>
      ) : loadError ? null : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>Email</th>
                <th>角色</th>
                <th>狀態</th>
                <th>最後登入</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.email}</td>
                  <td>{a.role === "CTO" ? "CTO" : "公關"}</td>
                  <td>
                    <span className={`admin__pill ${a.active ? "admin__pill--sent" : "admin__pill--failed"}`}>
                      {a.active ? "啟用中" : "已停用"}
                    </span>
                  </td>
                  <td>{a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString("zh-TW") : "尚未登入"}</td>
                  <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button type="button" className="small" disabled={busyId === a.id} onClick={() => toggleActive(a.id, a.active)}>
                      {a.active ? "停用" : "啟用"}
                    </button>
                    {resetPasswordFor === a.id ? (
                      <>
                        <input
                          type="password"
                          className="finput"
                          placeholder="新密碼"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          style={{ width: 140 }}
                        />
                        <button type="button" className="small" disabled={busyId === a.id} onClick={() => submitResetPassword(a.id)}>
                          確認
                        </button>
                        <button type="button" className="small" onClick={() => { setResetPasswordFor(null); setNewPassword(""); }}>
                          取消
                        </button>
                      </>
                    ) : (
                      <button type="button" className="small" onClick={() => setResetPasswordFor(a.id)}>
                        重設密碼
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {accounts.length === 0 && <p style={{ color: "#5f7268", marginTop: 16 }}>目前沒有帳號。</p>}
        </div>
      )}

      <div className="glass" style={{ padding: 20, marginTop: 24, maxWidth: 560 }}>
        <h3 style={{ color: "#14231b", fontSize: 16, marginBottom: 12 }}>新增帳號</h3>
        <form onSubmit={createAccount} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            className="finput"
            value={newForm.name}
            onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
            placeholder="姓名"
          />
          <input
            type="email"
            className="finput"
            value={newForm.email}
            onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
            placeholder="Email"
          />
          <input
            type="password"
            className="finput"
            value={newForm.password}
            onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
            placeholder="初始密碼（至少 8 碼）"
          />
          <select
            className="finput fselect"
            value={newForm.role}
            onChange={(e) => setNewForm({ ...newForm, role: e.target.value as "CTO" | "PR" })}
          >
            <option value="PR">公關（PR）</option>
            <option value="CTO">CTO</option>
          </select>
          {formError && <p className="admin__error">{formError}</p>}
          <button type="submit" className="btn btn--primary" style={{ width: "fit-content" }}>
            新增帳號
          </button>
        </form>
      </div>
    </div>
  );
}

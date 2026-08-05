"use client";

import { useCallback, useEffect, useState } from "react";

interface Partner {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  sortOrder: number;
}

const EMPTY_FORM = { name: "", description: "", logoUrl: "" };

export function PartnerTable() {
  const [items, setItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [newForm, setNewForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/partners");
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? "載入失敗，請稍後再試。");
        setItems([]);
        return;
      }
      setItems(data.partners ?? []);
    } catch {
      setLoadError("連線失敗，請確認網路連線後重試。");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createItem(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!newForm.name.trim() || !newForm.logoUrl.trim()) {
      setFormError("名稱與 Logo 網址為必填欄位");
      return;
    }
    const res = await fetch("/api/admin/partners", {
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

  function startEdit(item: Partner) {
    setEditingId(item.id);
    setEditForm({ name: item.name, description: item.description, logoUrl: item.logoUrl });
    setFormError(null);
  }

  async function saveEdit(id: string) {
    setFormError(null);
    if (!editForm.name.trim() || !editForm.logoUrl.trim()) {
      setFormError("名稱與 Logo 網址為必填欄位");
      return;
    }
    setBusyId(id);
    const res = await fetch(`/api/admin/partners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    setBusyId(null);
    if (!res.ok) {
      setFormError(data.error ?? "更新失敗");
      return;
    }
    setEditingId(null);
    await load();
  }

  async function deleteItem(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/partners/${id}`, { method: "DELETE" });
    await load();
    setBusyId(null);
  }

  async function move(id: string, direction: "up" | "down") {
    setBusyId(id);
    await fetch(`/api/admin/partners/${id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    await load();
    setBusyId(null);
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
                <th>順序</th>
                <th>名稱</th>
                <th>Logo 網址</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) =>
                editingId === item.id ? (
                  <tr key={item.id}>
                    <td colSpan={4}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "8px 0" }}>
                        <input
                          className="finput"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="名稱"
                          style={{ width: 200 }}
                        />
                        <input
                          className="finput"
                          value={editForm.logoUrl}
                          onChange={(e) => setEditForm({ ...editForm, logoUrl: e.target.value })}
                          placeholder="Logo 網址"
                          style={{ flex: 1, minWidth: 220 }}
                        />
                        <textarea
                          className="finput"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder="介紹文字（點擊 Logo 後彈出的內容）"
                          style={{ width: "100%", minHeight: 60 }}
                        />
                        <button type="button" className="small" disabled={busyId === item.id} onClick={() => saveEdit(item.id)}>
                          儲存
                        </button>
                        <button type="button" className="small" onClick={() => setEditingId(null)}>
                          取消
                        </button>
                      </div>
                      {formError && <p className="admin__error">{formError}</p>}
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          type="button"
                          className="small"
                          disabled={busyId === item.id || idx === 0}
                          onClick={() => move(item.id, "up")}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="small"
                          disabled={busyId === item.id || idx === items.length - 1}
                          onClick={() => move(item.id, "down")}
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                    <td>{item.name}</td>
                    <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.logoUrl}
                    </td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button type="button" className="small" disabled={busyId === item.id} onClick={() => startEdit(item)}>
                        編輯
                      </button>
                      <button type="button" className="small" disabled={busyId === item.id} onClick={() => deleteItem(item.id)}>
                        刪除
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
          {items.length === 0 && <p style={{ color: "#5f7268", marginTop: 16 }}>目前沒有合作夥伴。</p>}
        </div>
      )}

      <div className="glass" style={{ padding: 20, marginTop: 24, maxWidth: 640 }}>
        <h3 style={{ color: "#14231b", fontSize: 16, marginBottom: 12 }}>新增合作夥伴</h3>
        <form onSubmit={createItem} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            className="finput"
            value={newForm.name}
            onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
            placeholder="名稱"
          />
          <input
            className="finput"
            value={newForm.logoUrl}
            onChange={(e) => setNewForm({ ...newForm, logoUrl: e.target.value })}
            placeholder="Logo 網址"
          />
          <textarea
            className="finput"
            value={newForm.description}
            onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
            placeholder="介紹文字（點擊 Logo 後彈出的內容）"
            style={{ minHeight: 60 }}
          />
          {formError && !editingId && <p className="admin__error">{formError}</p>}
          <button type="submit" className="btn btn--primary" style={{ width: "fit-content" }}>
            新增至最後
          </button>
        </form>
      </div>
    </div>
  );
}

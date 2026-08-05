"use client";

import { useCallback, useEffect, useState } from "react";

interface Highlight {
  id: string;
  title: string;
  body: string;
  sortOrder: number;
}

const EMPTY_FORM = { title: "", body: "" };

export function HighlightTable() {
  const [items, setItems] = useState<Highlight[]>([]);
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
      const res = await fetch("/api/admin/highlights");
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? "載入失敗，請稍後再試。");
        setItems([]);
        return;
      }
      setItems(data.highlights ?? []);
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
    if (!newForm.title.trim() || !newForm.body.trim()) {
      setFormError("標題與內容為必填欄位");
      return;
    }
    const res = await fetch("/api/admin/highlights", {
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

  function startEdit(item: Highlight) {
    setEditingId(item.id);
    setEditForm({ title: item.title, body: item.body });
    setFormError(null);
  }

  async function saveEdit(id: string) {
    setFormError(null);
    if (!editForm.title.trim() || !editForm.body.trim()) {
      setFormError("標題與內容為必填欄位");
      return;
    }
    setBusyId(id);
    const res = await fetch(`/api/admin/highlights/${id}`, {
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
    await fetch(`/api/admin/highlights/${id}`, { method: "DELETE" });
    await load();
    setBusyId(null);
  }

  async function move(id: string, direction: "up" | "down") {
    setBusyId(id);
    await fetch(`/api/admin/highlights/${id}/move`, {
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
                <th>標題</th>
                <th>內容</th>
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
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          placeholder="標題"
                          style={{ flex: 1, minWidth: 220 }}
                        />
                        <textarea
                          value={editForm.body}
                          onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                          placeholder="內容"
                          style={{ width: "100%", minHeight: 80 }}
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
                    <td>{item.title}</td>
                    <td style={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.body}
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
          {items.length === 0 && <p style={{ color: "#5f7268", marginTop: 16 }}>目前沒有活動亮點。</p>}
        </div>
      )}

      <div className="glass" style={{ padding: 20, marginTop: 24, maxWidth: 640 }}>
        <h3 style={{ color: "#14231b", fontSize: 16, marginBottom: 12 }}>新增活動亮點</h3>
        <form onSubmit={createItem} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            value={newForm.title}
            onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
            placeholder="標題"
          />
          <textarea
            value={newForm.body}
            onChange={(e) => setNewForm({ ...newForm, body: e.target.value })}
            placeholder="內容"
            style={{ minHeight: 80 }}
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

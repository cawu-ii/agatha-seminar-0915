"use client";

import { useCallback, useEffect, useState } from "react";

interface Speaker {
  id: string;
  name: string;
  title: string;
  bio: string;
  photoUrl: string | null;
  confirmed: boolean;
  sortOrder: number;
}

const EMPTY_FORM = { name: "", title: "", bio: "", photoUrl: "", confirmed: true };

export function SpeakerTable() {
  const [items, setItems] = useState<Speaker[]>([]);
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
      const res = await fetch("/api/admin/speakers");
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? "載入失敗，請稍後再試。");
        setItems([]);
        return;
      }
      setItems(data.speakers ?? []);
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
    if (!newForm.name.trim() || !newForm.title.trim()) {
      setFormError("姓名與職稱為必填欄位");
      return;
    }
    const res = await fetch("/api/admin/speakers", {
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

  function startEdit(item: Speaker) {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      title: item.title,
      bio: item.bio,
      photoUrl: item.photoUrl ?? "",
      confirmed: item.confirmed,
    });
    setFormError(null);
  }

  async function saveEdit(id: string) {
    setFormError(null);
    if (!editForm.name.trim() || !editForm.title.trim()) {
      setFormError("姓名與職稱為必填欄位");
      return;
    }
    setBusyId(id);
    const res = await fetch(`/api/admin/speakers/${id}`, {
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
    await fetch(`/api/admin/speakers/${id}`, { method: "DELETE" });
    await load();
    setBusyId(null);
  }

  async function move(id: string, direction: "up" | "down") {
    setBusyId(id);
    await fetch(`/api/admin/speakers/${id}/move`, {
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
                <th>姓名</th>
                <th>職稱</th>
                <th>照片</th>
                <th>已確認</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) =>
                editingId === item.id ? (
                  <tr key={item.id}>
                    <td colSpan={6}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "8px 0" }}>
                        <input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="姓名"
                          style={{ width: 160 }}
                        />
                        <input
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          placeholder="職稱"
                          style={{ width: 220 }}
                        />
                        <input
                          value={editForm.photoUrl}
                          onChange={(e) => setEditForm({ ...editForm, photoUrl: e.target.value })}
                          placeholder="照片網址（留空顯示待提供）"
                          style={{ flex: 1, minWidth: 220 }}
                        />
                        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={editForm.confirmed}
                            onChange={(e) => setEditForm({ ...editForm, confirmed: e.target.checked })}
                          />
                          已確認
                        </label>
                        <textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                          placeholder="簡介"
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
                    <td>{item.title}</td>
                    <td>{item.photoUrl ? "有" : "待提供"}</td>
                    <td>{item.confirmed ? "是" : "待確認"}</td>
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
          {items.length === 0 && <p style={{ color: "#5f7268", marginTop: 16 }}>目前沒有講者。</p>}
        </div>
      )}

      <div className="glass" style={{ padding: 20, marginTop: 24, maxWidth: 640 }}>
        <h3 style={{ color: "#14231b", fontSize: 16, marginBottom: 12 }}>新增講者</h3>
        <form onSubmit={createItem} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            value={newForm.name}
            onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
            placeholder="姓名"
          />
          <input
            value={newForm.title}
            onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
            placeholder="職稱"
          />
          <input
            value={newForm.photoUrl}
            onChange={(e) => setNewForm({ ...newForm, photoUrl: e.target.value })}
            placeholder="照片網址（留空顯示待提供）"
          />
          <textarea
            value={newForm.bio}
            onChange={(e) => setNewForm({ ...newForm, bio: e.target.value })}
            placeholder="簡介"
            style={{ minHeight: 60 }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={newForm.confirmed}
              onChange={(e) => setNewForm({ ...newForm, confirmed: e.target.checked })}
            />
            已確認（取消勾選則顯示「待確認」）
          </label>
          {formError && !editingId && <p className="admin__error">{formError}</p>}
          <button type="submit" className="btn btn--primary" style={{ width: "fit-content" }}>
            新增至最後
          </button>
        </form>
      </div>
    </div>
  );
}

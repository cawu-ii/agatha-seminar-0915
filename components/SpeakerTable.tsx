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

const EMPTY_FORM = { name: "", title: "", bio: "", confirmed: true };

export function SpeakerTable() {
  const [items, setItems] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadErrorId, setUploadErrorId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [newForm, setNewForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // silent=true skips the loading flash (used after create/edit/delete/reorder,
  // where we already have data on screen and don't want the table to blank out).
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
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
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persistReorder = useCallback(
    async (fromId: string, toId: string) => {
      const fromIdx = items.findIndex((i) => i.id === fromId);
      const toIdx = items.findIndex((i) => i.id === toId);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
      const next = [...items];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      setItems(next);
      setBusyId(fromId);
      await fetch("/api/admin/speakers/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((i) => i.id) }),
      });
      await load(true);
      setBusyId(null);
    },
    [items, load]
  );

  useEffect(() => {
    if (!dragId) return;
    function onUp() {
      if (dragId && overId && dragId !== overId) {
        persistReorder(dragId, overId);
      }
      setDragId(null);
      setOverId(null);
    }
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragId, overId]);

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
    await load(true);
  }

  function startEdit(item: Speaker) {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      title: item.title,
      bio: item.bio,
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
    await load(true);
  }

  async function deleteItem(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/speakers/${id}`, { method: "DELETE" });
    await load(true);
    setBusyId(null);
  }

  async function uploadPhoto(id: string, file: File) {
    setUploadingId(id);
    setUploadErrorId(null);
    setUploadError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/admin/speakers/${id}/upload`, { method: "POST", body: form });
    const data = await res.json();
    setUploadingId(null);
    if (!res.ok) {
      setUploadErrorId(id);
      setUploadError(data.error ?? "上傳失敗");
      return;
    }
    await load(true);
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
                <th></th>
                <th>姓名</th>
                <th>職稱</th>
                <th>照片</th>
                <th>已確認</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) =>
                editingId === item.id ? (
                  <tr key={item.id}>
                    <td colSpan={6}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "8px 0" }}>
                        <input
                          className="finput"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="姓名"
                          style={{ width: 160 }}
                        />
                        <input
                          className="finput"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          placeholder="職稱"
                          style={{ width: 220 }}
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
                          className="finput"
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
                  <tr
                    key={item.id}
                    className={`${dragId === item.id ? "dragrow--dragging" : ""} ${
                      overId === item.id && dragId && dragId !== item.id ? "dragrow--over" : ""
                    }`}
                    onMouseEnter={() => dragId && setOverId(item.id)}
                  >
                    <td>
                      <span className="draghandle" title="拖曳排序" onMouseDown={() => setDragId(item.id)}>
                        ☰
                      </span>
                    </td>
                    <td>{item.name}</td>
                    <td>{item.title}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span>
                          {item.photoUrl ? (
                            <a href={item.photoUrl} target="_blank" rel="noreferrer">
                              已上傳
                            </a>
                          ) : (
                            "待提供"
                          )}
                        </span>
                        <label className="small" style={{ cursor: "pointer", width: "fit-content" }}>
                          {uploadingId === item.id ? "上傳中…" : item.photoUrl ? "更換照片" : "上傳照片"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: "none" }}
                            disabled={uploadingId === item.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              if (file) uploadPhoto(item.id, file);
                            }}
                          />
                        </label>
                        {uploadErrorId === item.id && <p className="admin__error">{uploadError}</p>}
                      </div>
                    </td>
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
        <p style={{ color: "#5f7268", fontSize: 13, marginBottom: 10 }}>
          先填基本資料建立講者，建立後可在上方列表為該講者上傳照片（需至少 520×520px）。
        </p>
        <form onSubmit={createItem} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            value={newForm.name}
            className="finput"
            onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
            placeholder="姓名"
          />
          <input
            className="finput"
            value={newForm.title}
            onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
            placeholder="職稱"
          />
          <textarea
            className="finput"
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

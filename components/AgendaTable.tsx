"use client";

import { useCallback, useEffect, useState } from "react";

interface AgendaItem {
  id: string;
  timeLabel: string;
  title: string;
  speaker: string | null;
  isBreak: boolean;
  sortOrder: number;
}

const EMPTY_FORM = { timeLabel: "", title: "", speaker: "", isBreak: false };

export function AgendaTable() {
  const [items, setItems] = useState<AgendaItem[]>([]);
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
      const res = await fetch("/api/admin/agenda");
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? "載入失敗，請稍後再試。");
        setItems([]);
        return;
      }
      setItems(data.items ?? []);
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
    if (!newForm.timeLabel.trim() || !newForm.title.trim()) {
      setFormError("時間與標題為必填欄位");
      return;
    }
    const res = await fetch("/api/admin/agenda", {
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

  function startEdit(item: AgendaItem) {
    setEditingId(item.id);
    setEditForm({ timeLabel: item.timeLabel, title: item.title, speaker: item.speaker ?? "", isBreak: item.isBreak });
    setFormError(null);
  }

  async function saveEdit(id: string) {
    setFormError(null);
    if (!editForm.timeLabel.trim() || !editForm.title.trim()) {
      setFormError("時間與標題為必填欄位");
      return;
    }
    setBusyId(id);
    const res = await fetch(`/api/admin/agenda/${id}`, {
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
    await fetch(`/api/admin/agenda/${id}`, { method: "DELETE" });
    await load();
    setBusyId(null);
  }

  async function move(id: string, direction: "up" | "down") {
    setBusyId(id);
    await fetch(`/api/admin/agenda/${id}/move`, {
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
                <th>時間</th>
                <th>標題</th>
                <th>講者</th>
                <th>休息時段</th>
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
                          className="finput"
                          value={editForm.timeLabel}
                          onChange={(e) => setEditForm({ ...editForm, timeLabel: e.target.value })}
                          placeholder="時間，例：13:30–13:35"
                          style={{ width: 140 }}
                        />
                        <input
                          className="finput"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          placeholder="標題"
                          style={{ flex: 1, minWidth: 200 }}
                        />
                        <input
                          className="finput"
                          value={editForm.speaker}
                          onChange={(e) => setEditForm({ ...editForm, speaker: e.target.value })}
                          placeholder="講者（休息時段可留空）"
                          style={{ width: 220 }}
                        />
                        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={editForm.isBreak}
                            onChange={(e) => setEditForm({ ...editForm, isBreak: e.target.checked })}
                          />
                          休息時段
                        </label>
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
                    <td>{item.timeLabel}</td>
                    <td>{item.title}</td>
                    <td>{item.speaker || "—"}</td>
                    <td>{item.isBreak ? "是" : ""}</td>
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
          {items.length === 0 && <p style={{ color: "#5f7268", marginTop: 16 }}>目前沒有議程項目。</p>}
        </div>
      )}

      <div className="glass" style={{ padding: 20, marginTop: 24, maxWidth: 640 }}>
        <h3 style={{ color: "#14231b", fontSize: 16, marginBottom: 12 }}>新增議程項目</h3>
        <form onSubmit={createItem} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            className="finput"
            value={newForm.timeLabel}
            onChange={(e) => setNewForm({ ...newForm, timeLabel: e.target.value })}
            placeholder="時間，例：13:30–13:35"
          />
          <input
            className="finput"
            value={newForm.title}
            onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
            placeholder="標題"
          />
          <input
            className="finput"
            value={newForm.speaker}
            onChange={(e) => setNewForm({ ...newForm, speaker: e.target.value })}
            placeholder="講者（休息時段可留空）"
          />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={newForm.isBreak}
              onChange={(e) => setNewForm({ ...newForm, isBreak: e.target.checked })}
            />
            休息時段
          </label>
          {formError && !editingId && <p className="admin__error">{formError}</p>}
          <button type="submit" className="btn btn--primary" style={{ width: "fit-content" }}>
            新增至議程最後
          </button>
        </form>
      </div>
    </div>
  );
}

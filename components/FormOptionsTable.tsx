"use client";

import { useCallback, useEffect, useState } from "react";

interface FormOption {
  id: string;
  field: string;
  value: string;
  sortOrder: number;
}

const FIELDS: Array<{ key: string; label: string }> = [
  { key: "DEPT", label: "所屬部門" },
  { key: "TITLE", label: "職稱" },
  { key: "INDUSTRY", label: "所屬產業" },
  { key: "SIZE", label: "公司規模" },
  { key: "SESSIONS", label: "論壇議程興趣（可複選）" },
  { key: "STAGE", label: "AI 導入階段" },
  { key: "CONSULT", label: "現場諮詢議題（可複選）" },
];

export function FormOptionsTable() {
  const [options, setOptions] = useState<FormOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newValueByField, setNewValueByField] = useState<Record<string, string>>({});
  const [errorByField, setErrorByField] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/form-options");
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? "載入失敗，請稍後再試。");
        setOptions([]);
        return;
      }
      setOptions(data.options ?? []);
    } catch {
      setLoadError("連線失敗，請確認網路連線後重試。");
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createOption(field: string, e: React.FormEvent) {
    e.preventDefault();
    const value = (newValueByField[field] ?? "").trim();
    setErrorByField((prev) => ({ ...prev, [field]: "" }));
    if (!value) {
      setErrorByField((prev) => ({ ...prev, [field]: "選項內容不可為空" }));
      return;
    }
    const res = await fetch(`/api/admin/form-options/${field}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorByField((prev) => ({ ...prev, [field]: data.error ?? "新增失敗" }));
      return;
    }
    setNewValueByField((prev) => ({ ...prev, [field]: "" }));
    await load();
  }

  function startEdit(option: FormOption) {
    setEditingId(option.id);
    setEditValue(option.value);
  }

  async function saveEdit(field: string, id: string) {
    if (!editValue.trim()) {
      setErrorByField((prev) => ({ ...prev, [field]: "選項內容不可為空" }));
      return;
    }
    setBusyId(id);
    const res = await fetch(`/api/admin/form-options/${field}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: editValue.trim() }),
    });
    const data = await res.json();
    setBusyId(null);
    if (!res.ok) {
      setErrorByField((prev) => ({ ...prev, [field]: data.error ?? "更新失敗" }));
      return;
    }
    setEditingId(null);
    await load();
  }

  async function deleteOption(field: string, id: string) {
    setBusyId(id);
    const res = await fetch(`/api/admin/form-options/${field}/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setErrorByField((prev) => ({ ...prev, [field]: data.error ?? "刪除失敗" }));
      return;
    }
    await load();
  }

  async function move(field: string, id: string, direction: "up" | "down") {
    setBusyId(id);
    await fetch(`/api/admin/form-options/${field}/${id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    await load();
    setBusyId(null);
  }

  if (loading) return <p style={{ color: "#5f7268" }}>載入中…</p>;
  if (loadError) return <p className="admin__error">{loadError}</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {FIELDS.map(({ key, label }) => {
        const items = options.filter((o) => o.field === key).sort((a, b) => a.sortOrder - b.sortOrder);
        const fieldError = errorByField[key];
        return (
          <div className="glass" style={{ padding: 20 }} key={key}>
            <h3 style={{ color: "#14231b", fontSize: 16, marginBottom: 12 }}>{label}</h3>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>順序</th>
                    <th>選項內容</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) =>
                    editingId === item.id ? (
                      <tr key={item.id}>
                        <td colSpan={3}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0" }}>
                            <input
                              className="finput"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              style={{ flex: 1, minWidth: 200 }}
                            />
                            <button type="button" className="small" disabled={busyId === item.id} onClick={() => saveEdit(key, item.id)}>
                              儲存
                            </button>
                            <button type="button" className="small" onClick={() => setEditingId(null)}>
                              取消
                            </button>
                          </div>
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
                              onClick={() => move(key, item.id, "up")}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="small"
                              disabled={busyId === item.id || idx === items.length - 1}
                              onClick={() => move(key, item.id, "down")}
                            >
                              ↓
                            </button>
                          </div>
                        </td>
                        <td>{item.value}</td>
                        <td style={{ display: "flex", gap: 6 }}>
                          <button type="button" className="small" disabled={busyId === item.id} onClick={() => startEdit(item)}>
                            編輯
                          </button>
                          <button
                            type="button"
                            className="small"
                            disabled={busyId === item.id}
                            onClick={() => deleteOption(key, item.id)}
                          >
                            刪除
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
              {items.length === 0 && <p style={{ color: "#5f7268", marginTop: 8 }}>目前沒有選項。</p>}
            </div>

            <form
              onSubmit={(e) => createOption(key, e)}
              style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}
            >
              <input
                className="finput"
                value={newValueByField[key] ?? ""}
                onChange={(e) => setNewValueByField((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder="新增選項內容"
                style={{ flex: 1, minWidth: 200 }}
              />
              <button type="submit" className="btn btn--primary small" style={{ width: "fit-content" }}>
                新增
              </button>
            </form>
            {fieldError && <p className="admin__error">{fieldError}</p>}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

interface Fact {
  field: string;
  line1: string;
  line2: string | null;
  subText: string | null;
}

const FIELDS: Array<{ key: string; label: string }> = [
  { key: "DATE", label: "日期（Date）" },
  { key: "TIME", label: "時間（Time）" },
  { key: "VENUE", label: "地點（Venue）" },
  { key: "ACCESS", label: "費用／資格（Access）" },
];

const EMPTY_FORM = { line1: "", line2: "", subText: "" };

export function EventInfoTable() {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [busyField, setBusyField] = useState<string | null>(null);
  const [errorByField, setErrorByField] = useState<Record<string, string>>({});

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/event-info");
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? "載入失敗，請稍後再試。");
        setFacts([]);
        return;
      }
      setFacts(data.facts ?? []);
    } catch {
      setLoadError("連線失敗，請確認網路連線後重試。");
      setFacts([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(fact: Fact) {
    setEditingField(fact.field);
    setEditForm({ line1: fact.line1, line2: fact.line2 ?? "", subText: fact.subText ?? "" });
    setErrorByField((prev) => ({ ...prev, [fact.field]: "" }));
  }

  async function saveEdit(field: string) {
    if (!editForm.line1.trim()) {
      setErrorByField((prev) => ({ ...prev, [field]: "主要內容不可為空" }));
      return;
    }
    setBusyField(field);
    const res = await fetch(`/api/admin/event-info/${field}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    setBusyField(null);
    if (!res.ok) {
      setErrorByField((prev) => ({ ...prev, [field]: data.error ?? "更新失敗" }));
      return;
    }
    setEditingField(null);
    await load(true);
  }

  if (loading) return <p style={{ color: "#5f7268" }}>載入中…</p>;
  if (loadError) return <p className="admin__error">{loadError}</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {FIELDS.map(({ key, label }) => {
        const fact = facts.find((f) => f.field === key);
        const isEditing = editingField === key;
        return (
          <div className="glass" style={{ padding: 20, maxWidth: 640 }} key={key}>
            <h3 style={{ color: "#14231b", fontSize: 16, marginBottom: 12 }}>{label}</h3>
            {isEditing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  className="finput"
                  value={editForm.line1}
                  onChange={(e) => setEditForm({ ...editForm, line1: e.target.value })}
                  placeholder="主要內容，例：2026.09.15"
                />
                <input
                  className="finput"
                  value={editForm.line2}
                  onChange={(e) => setEditForm({ ...editForm, line2: e.target.value })}
                  placeholder="第二行（可留空，目前僅地點使用）"
                />
                <input
                  className="finput"
                  value={editForm.subText}
                  onChange={(e) => setEditForm({ ...editForm, subText: e.target.value })}
                  placeholder="小字內容（可留空），例：星期二"
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" className="small" disabled={busyField === key} onClick={() => saveEdit(key)}>
                    儲存
                  </button>
                  <button type="button" className="small" onClick={() => setEditingField(null)}>
                    取消
                  </button>
                </div>
                {errorByField[key] && <p className="admin__error">{errorByField[key]}</p>}
              </div>
            ) : fact ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: 13, color: "#22302a" }}>
                  {fact.line1}
                  {fact.line2 ? ` ／ ${fact.line2}` : ""}
                  {fact.subText ? `（${fact.subText}）` : ""}
                </p>
                <button type="button" className="small" onClick={() => startEdit(fact)}>
                  編輯
                </button>
              </div>
            ) : (
              <p style={{ color: "#5f7268", fontSize: 13 }}>尚無資料，請先執行 `npm run seed:event-info`。</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

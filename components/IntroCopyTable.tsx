"use client";

import { useCallback, useEffect, useState } from "react";

interface Block {
  field: string;
  body: string;
}

const FIELDS: Array<{ key: string; label: string; help?: string }> = [
  { key: "LEAD", label: "介紹段落（Hero 下方的說明文字）" },
  {
    key: "ATTENDEE",
    label: "適合對象（Who should attend，標籤本身固定不可編輯）",
    help: "用 **文字** 讓文字變粗體，其他符號不會被特殊處理",
  },
];

export function IntroCopyTable() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [busyField, setBusyField] = useState<string | null>(null);
  const [errorByField, setErrorByField] = useState<Record<string, string>>({});

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/intro-copy");
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? "載入失敗，請稍後再試。");
        setBlocks([]);
        return;
      }
      setBlocks(data.blocks ?? []);
    } catch {
      setLoadError("連線失敗，請確認網路連線後重試。");
      setBlocks([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(block: Block) {
    setEditingField(block.field);
    setEditBody(block.body);
    setErrorByField((prev) => ({ ...prev, [block.field]: "" }));
  }

  async function saveEdit(field: string) {
    if (!editBody.trim()) {
      setErrorByField((prev) => ({ ...prev, [field]: "內文不可為空" }));
      return;
    }
    setBusyField(field);
    const res = await fetch(`/api/admin/intro-copy/${field}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: editBody }),
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
      {FIELDS.map(({ key, label, help }) => {
        const block = blocks.find((b) => b.field === key);
        const isEditing = editingField === key;
        return (
          <div className="glass" style={{ padding: 20, maxWidth: 640 }} key={key}>
            <h3 style={{ color: "#14231b", fontSize: 16, marginBottom: 12 }}>{label}</h3>
            {isEditing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <textarea
                  className="finput"
                  rows={5}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                />
                {help && <p style={{ fontSize: 12, color: "#5f7268" }}>{help}</p>}
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
            ) : block ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <p style={{ fontSize: 13, color: "#22302a", whiteSpace: "pre-wrap" }}>{block.body}</p>
                <button type="button" className="small" onClick={() => startEdit(block)}>
                  編輯
                </button>
              </div>
            ) : (
              <p style={{ color: "#5f7268", fontSize: 13 }}>尚無資料，請先執行 `npm run seed:intro-copy`。</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

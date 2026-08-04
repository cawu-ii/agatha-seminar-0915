"use client";

import { useCallback, useEffect, useState } from "react";

interface Registration {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  dept: string;
  industry: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  emailStatus: "PENDING" | "SENT" | "FAILED" | "SKIPPED";
  reviewed: boolean;
  reviewerNote: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<Registration["emailStatus"], string> = {
  PENDING: "待寄送",
  SENT: "已寄送",
  FAILED: "寄送失敗",
  SKIPPED: "略過（無憑證）",
};
const STATUS_CLASS: Record<Registration["emailStatus"], string> = {
  PENDING: "admin__pill--pending",
  SENT: "admin__pill--sent",
  FAILED: "admin__pill--failed",
  SKIPPED: "admin__pill--skipped",
};

export function AdminTable() {
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [reviewedFilter, setReviewedFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (utmSource) params.set("utm_source", utmSource);
    if (utmContent) params.set("utm_content", utmContent);
    if (reviewedFilter) params.set("reviewed", reviewedFilter);
    try {
      const res = await fetch(`/api/admin/registrations?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? "載入失敗，請稍後再試。");
        setRows([]);
        return;
      }
      setRows(data.registrations ?? []);
    } catch {
      setLoadError("連線失敗，請確認網路連線後重試。");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [q, utmSource, utmContent, reviewedFilter]);

  useEffect(() => {
    const t = setTimeout(load, 250); // light debounce for the search box
    return () => clearTimeout(t);
  }, [load]);

  async function toggleReviewed(id: string, current: boolean) {
    setBusyId(id);
    await fetch(`/api/admin/registrations/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewed: !current }),
    });
    await load();
    setBusyId(null);
  }

  async function resend(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/registrations/${id}/resend`, { method: "POST" });
    await load();
    setBusyId(null);
  }

  return (
    <div>
      <div className="admin__filters">
        <input placeholder="搜尋姓名／公司／Email" value={q} onChange={(e) => setQ(e.target.value)} />
        <input placeholder="utm_source（例：meta）" value={utmSource} onChange={(e) => setUtmSource(e.target.value)} />
        <input placeholder="utm_content（例：wave1）" value={utmContent} onChange={(e) => setUtmContent(e.target.value)} />
        <select value={reviewedFilter} onChange={(e) => setReviewedFilter(e.target.value)}>
          <option value="">全部狀態</option>
          <option value="false">未處理</option>
          <option value="true">已處理</option>
        </select>
      </div>

      {loadError && <p className="admin__error">{loadError}</p>}

      {loading ? (
        <p style={{ color: "#5f7268" }}>載入中…</p>
      ) : loadError ? null : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>時間</th>
                <th>姓名</th>
                <th>公司</th>
                <th>Email</th>
                <th>電話</th>
                <th>部門</th>
                <th>來源</th>
                <th>波次</th>
                <th>確認信</th>
                <th>處理狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.createdAt).toLocaleString("zh-TW")}</td>
                  <td>{r.name}</td>
                  <td>{r.company}</td>
                  <td>{r.email}</td>
                  <td>{r.phone}</td>
                  <td>{r.dept}</td>
                  <td>{r.utmSource || "—"}</td>
                  <td>{r.utmContent || "—"}</td>
                  <td>
                    <span className={`admin__pill ${STATUS_CLASS[r.emailStatus]}`}>{STATUS_LABEL[r.emailStatus]}</span>
                  </td>
                  <td>{r.reviewed ? "已處理" : "未處理"}</td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="small"
                      disabled={busyId === r.id}
                      onClick={() => toggleReviewed(r.id, r.reviewed)}
                    >
                      {r.reviewed ? "標記未處理" : "標記已處理"}
                    </button>
                    <button type="button" className="small" disabled={busyId === r.id} onClick={() => resend(r.id)}>
                      重寄確認信
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p style={{ color: "#5f7268", marginTop: 16 }}>沒有符合條件的報名資料。</p>}
        </div>
      )}
    </div>
  );
}

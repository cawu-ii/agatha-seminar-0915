"use client";

import { useCallback, useEffect, useState } from "react";

interface Banner {
  desktopUrl: string | null;
  mobileUrl: string | null;
  updatedAt: string;
}

const SLOTS: Array<{ key: "desktop" | "mobile"; label: string; spec: string; urlField: "desktopUrl" | "mobileUrl" }> = [
  { key: "desktop", label: "桌機版 Banner", spec: "2560 × 1440（16:9）", urlField: "desktopUrl" },
  { key: "mobile", label: "手機版 Banner", spec: "1080 × 1350（4:5）", urlField: "mobileUrl" },
];

export function BannerUploader() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [errorBySlot, setErrorBySlot] = useState<Record<string, string>>({});

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/banner");
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error ?? "載入失敗，請稍後再試。");
        return;
      }
      setBanner(data.banner);
    } catch {
      setLoadError("連線失敗，請確認網路連線後重試。");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(slot: "desktop" | "mobile", file: File) {
    setErrorBySlot((prev) => ({ ...prev, [slot]: "" }));
    setBusySlot(slot);
    const formData = new FormData();
    formData.set("slot", slot);
    formData.set("file", file);
    const res = await fetch("/api/admin/banner", { method: "POST", body: formData });
    const data = await res.json();
    setBusySlot(null);
    if (!res.ok) {
      setErrorBySlot((prev) => ({ ...prev, [slot]: data.error ?? "上傳失敗" }));
      return;
    }
    await load(true);
  }

  if (loading) return <p style={{ color: "#5f7268" }}>載入中…</p>;
  if (loadError) return <p className="admin__error">{loadError}</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {SLOTS.map(({ key, label, spec, urlField }) => {
        const currentUrl = banner?.[urlField];
        return (
          <div className="glass" style={{ padding: 20, maxWidth: 640 }} key={key}>
            <h3 style={{ color: "#14231b", fontSize: 16, marginBottom: 4 }}>{label}</h3>
            <p style={{ color: "#5f7268", fontSize: 13, marginBottom: 12 }}>
              尺寸須精確為 {spec}，尺寸不符會直接拒絕上傳。
            </p>
            <p style={{ fontSize: 13, marginBottom: 12 }}>
              目前狀態：
              {currentUrl ? (
                <>
                  已上傳（
                  <a href={currentUrl} target="_blank" rel="noreferrer">
                    查看目前圖片
                  </a>
                  ）
                </>
              ) : (
                "尚未上傳"
              )}
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busySlot === key}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(key, file);
                e.target.value = "";
              }}
            />
            {busySlot === key && <p style={{ color: "#5f7268", fontSize: 13, marginTop: 8 }}>上傳中…</p>}
            {errorBySlot[key] && <p className="admin__error">{errorBySlot[key]}</p>}
          </div>
        );
      })}
    </div>
  );
}

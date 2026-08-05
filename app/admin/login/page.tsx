"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "登入失敗，請再試一次。");
      setSubmitting(false);
    }
  }

  return (
    <div className="glass admin__login">
      <h2 style={{ color: "#14231b", fontSize: 22, marginBottom: 6 }}>後台登入</h2>
      <p style={{ color: "#5f7268", fontSize: 13 }}>Agatha 9/15 論壇報名後台</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        <input
          type="password"
          placeholder="密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="admin__error">{error}</p>}
        <button type="submit" className="btn btn--primary" style={{ width: "100%" }} disabled={submitting}>
          {submitting ? "登入中…" : "登入"}
        </button>
      </form>
    </div>
  );
}

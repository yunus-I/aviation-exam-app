"use client";

import { useEffect } from "react";

export default function EntryPage() {
  useEffect(() => {
    const target = "/home" + (window.location.search || "") + (window.location.hash || "");
    try {
      window.location.replace(target);
    } catch {
      window.location.href = target;
    }
  }, []);

  return (
    <div
      className="loading-center"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div className="spinner" />
      <span style={{ fontWeight: 600, fontSize: 16 }}>Loading portal…</span>
      <noscript>
        <meta httpEquiv="refresh" content="0;url=/home" />
      </noscript>
    </div>
  );
}




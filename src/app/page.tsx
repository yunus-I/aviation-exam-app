"use client";

import { useEffect } from "react";

/**
 * Root entry page — redirects to /home while preserving the full
 * URL (including the hash fragment that Telegram appends as
 * tgWebAppData / tgWebAppVersion / etc.).
 *
 * IMPORTANT: Do NOT use Next.js server-side redirect() here.
 * Server-side redirects strip the URL hash fragment before the
 * browser ever sees it, so Telegram's initData passed via the
 * hash is permanently lost, breaking session verification.
 */
export default function EntryPage() {
  useEffect(() => {
    try {
      const search = window.location.search || "";
      const hash = window.location.hash || "";
      const target = "/home" + search + hash;
      window.location.replace(target);
    } catch {
      window.location.href = "/home";
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        textAlign: "center",
        background: "#F7F8FC",
      }}
    >
      <div
        className="spinner"
        style={{
          width: 36,
          height: 36,
          border: "3px solid #E4E8F0",
          borderTop: "3px solid #003580",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <span style={{ fontWeight: 600, fontSize: 16, color: "#1A202C" }}>
        Loading…
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <noscript>
        <meta httpEquiv="refresh" content="0;url=/home" />
      </noscript>
    </div>
  );
}

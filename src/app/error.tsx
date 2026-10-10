"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary caught:", error);
  }, [error]);

  function handleRetry() {
    try {
      // Clear potentially corrupted transient session data if needed
      reset();
    } catch {
      window.location.reload();
    }
  }

  function handleFullReload() {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.clear();
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "var(--background, #F7F8FC)",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: "#ffffff",
          borderRadius: 20,
          border: "1px solid #E4E8F0",
          padding: "32px 24px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "#EFF6FF",
            color: "#003580",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            marginBottom: 16,
          }}
        >
          ✈️
        </div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "#1A202C",
            marginBottom: 8,
          }}
        >
          Something Went Wrong
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "#64748B",
            lineHeight: 1.5,
            marginBottom: 24,
          }}
        >
          The portal encountered a temporary issue while loading. Please tap below to reload.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={handleRetry}
            style={{
              width: "100%",
              padding: "12px 20px",
              background: "#003580",
              color: "#ffffff",
              border: "none",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
          <button
            onClick={handleFullReload}
            style={{
              width: "100%",
              padding: "10px 20px",
              background: "#F1F5F9",
              color: "#475569",
              border: "none",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Refresh Portal
          </button>
        </div>
      </div>
    </div>
  );
}

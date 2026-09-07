"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { syncTelegramSession } from "@/lib/telegram-session";

export default function EntryPage() {
  const router = useRouter();
  const [showSlowNotice, setShowSlowNotice] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let redirected = false;

    function navigateHome() {
      if (redirected) return;
      redirected = true;
      try {
        router.replace("/home");
      } catch {
        if (typeof window !== "undefined") {
          window.location.replace("/home");
        }
      }
    }

    // Notice timer if slow connection/device (after 3.5s)
    const slowTimer = setTimeout(() => {
      if (isMounted && !redirected) {
        setShowSlowNotice(true);
      }
    }, 3500);

    // Hard fallback: force redirect after 5.5s regardless of network delays
    const hardFallbackTimer = setTimeout(() => {
      if (isMounted && !redirected) {
        navigateHome();
      }
    }, 5500);

    async function init() {
      try {
        await syncTelegramSession();
      } catch (err) {
        console.error("Session sync failed, continuing to portal", err);
      } finally {
        if (isMounted) {
          navigateHome();
        }
      }
    }

    init();

    return () => {
      isMounted = false;
      clearTimeout(slowTimer);
      clearTimeout(hardFallbackTimer);
    };
  }, [router]);

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

      {showSlowNotice && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            maxWidth: 320,
            animation: "fadeIn 0.3s ease",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--text-muted, #64748b)", margin: 0 }}>
            Taking longer than expected on your connection.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.replace("/home");
                }
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                background: "var(--brand, #003580)",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Open Portal
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.reload();
                }
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                background: "var(--surface-hover, #e2e8f0)",
                color: "var(--text, #1e293b)",
                border: "none",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



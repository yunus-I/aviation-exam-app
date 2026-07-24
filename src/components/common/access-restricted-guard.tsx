"use client";

import { useState } from "react";
import { clearSession, saveSession, loadSession } from "@/lib/session";

export function AccessRestrictedGuard({
  status,
  name,
}: {
  status?: string;
  name?: string;
}) {
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState<string | null>(null);

  const statusLabel =
    status === "pending_review"
      ? "⏳ Registration Under Review"
      : status === "rejected"
      ? "❌ Registration Rejected"
      : "🔒 Registration Required";

  const statusColor =
    status === "pending_review"
      ? "#d97706"
      : status === "rejected"
      ? "#dc2626"
      : "var(--brand, #003580)";

  const botUsername =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace("@", "") ||
    "ETaviation_bot";
  const botUrl = `https://t.me/${botUsername}`;

  function handleOpenBot() {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.openTelegramLink) {
      (window as any).Telegram.WebApp.openTelegramLink(botUrl);
    } else {
      window.open(botUrl, "_blank", "noopener,noreferrer");
    }
  }

  async function handleRecheckStatus() {
    setChecking(true);
    setCheckMsg(null);
    try {
      const webApp = (typeof window !== "undefined" && (window as any).Telegram?.WebApp) || null;
      const initDataRaw = webApp?.initData?.trim();

      if (!initDataRaw) {
        setCheckMsg("Please open this app from inside Telegram to verify your account.");
        setChecking(false);
        return;
      }

      const res = await fetch("/api/mini-app/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initDataRaw }),
      });

      const payload = await res.json();

      if (
        payload.ok &&
        payload.session &&
        (payload.session.registrationStatus === "approved" || payload.session.isAdmin)
      ) {
        const ts = payload.session;
        const newSession = {
          id: ts.candidateId,
          name: ts.fullName || payload.telegramUser?.first_name || name || "Student",
          studentId: `TG-${payload.telegramUser?.id}`,
          department: ts.departmentName || "General",
          avatarInitials: (ts.fullName || payload.telegramUser?.first_name || "S")[0].toUpperCase(),
          loginAt: Date.now(),
          isApproved: true,
          isAdmin: Boolean(ts.isAdmin),
          registrationStatus: "approved",
        };
        saveSession(newSession);
        window.location.reload();
      } else {
        const currentStatus = payload.session?.registrationStatus || "unregistered";
        setCheckMsg(
          currentStatus === "pending_review"
            ? "Your registration is still under review. Please check back in a few minutes."
            : currentStatus === "rejected"
            ? "Your registration was rejected. Please resubmit your payment receipt in the bot."
            : "Your account is not approved yet. Please complete registration in the bot."
        );
      }
    } catch {
      setCheckMsg("Unable to recheck status right now. Please try again.");
    } finally {
      setChecking(false);
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
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          background: "var(--surface, #ffffff)",
          border: "1px solid var(--border, #E4E8F0)",
          borderRadius: "var(--radius-xl, 20px)",
          padding: "36px 28px",
          boxShadow: "var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.05))",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(0, 53, 128, 0.08)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            marginBottom: 20,
          }}
        >
          🔒
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "var(--brand, #003580)",
            marginBottom: 10,
            letterSpacing: "-0.5px",
          }}
        >
          Access Restricted
        </h1>

        <div
          style={{
            display: "inline-block",
            padding: "6px 14px",
            borderRadius: "20px",
            background: `${statusColor}15`,
            color: statusColor,
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          {statusLabel}
        </div>

        <p
          style={{
            fontSize: 14,
            color: "var(--text, #334155)",
            lineHeight: 1.65,
            marginBottom: 24,
          }}
        >
          Welcome{name ? `, ${name}` : ""}! Access to exam preparation questions, practice sets, and study notes is restricted to approved users only.
        </p>

        <div
          style={{
            background: "rgba(0, 53, 128, 0.03)",
            border: "1px solid rgba(0, 53, 128, 0.1)",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: 28,
            fontSize: 13,
            color: "var(--text-muted, #64748B)",
            textAlign: "left",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "var(--text, #1E293B)", display: "block", marginBottom: 4 }}>
            How to get access:
          </strong>
          1. Open our Telegram Bot <strong>@{botUsername}</strong><br />
          2. Complete your registration and upload payment receipt<br />
          3. Once an admin approves your submission, you will receive full access!
        </div>

        {checkMsg && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: statusColor,
              marginBottom: 18,
              padding: "10px 14px",
              borderRadius: "8px",
              background: `${statusColor}10`,
            }}
          >
            {checkMsg}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={handleOpenBot}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              background: "var(--brand, #003580)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0, 53, 128, 0.25)",
              transition: "transform 0.15s ease",
            }}
          >
            💬 Open @{botUsername} to Register
          </button>

          <button
            onClick={handleRecheckStatus}
            disabled={checking}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              background: "transparent",
              color: "var(--brand, #003580)",
              fontWeight: 600,
              fontSize: 14,
              border: "1px solid var(--border, #E4E8F0)",
              cursor: "pointer",
              opacity: checking ? 0.6 : 1,
            }}
          >
            {checking ? "Checking approval status…" : "🔄 Re-check Approval Status"}
          </button>
        </div>
      </div>
    </div>
  );
}

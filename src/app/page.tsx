"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mockLogin, saveSession, loadSession } from "@/lib/session";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        ready: () => void;
        expand: () => void;
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const session = loadSession();
    if (session) {
      router.replace("/home");
      return;
    }

    const webApp = window.Telegram?.WebApp;
    const initDataRaw = webApp?.initData?.trim();

    if (webApp && initDataRaw) {
      webApp.ready();
      webApp.expand();

      fetch("/api/mini-app/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initDataRaw }),
      })
        .then(async (res) => {
          const payload = await res.json();
          if (payload.ok && payload.session?.registrationStatus === "approved") {
            const ts = payload.session;
            const newSession = {
              id: ts.candidateId,
              name: ts.fullName || payload.telegramUser?.first_name || "Telegram User",
              studentId: `TG-${payload.telegramUser?.id}`,
              department: ts.departmentName || "General",
              avatarInitials: (ts.fullName || payload.telegramUser?.first_name || "T")[0].toUpperCase(),
              loginAt: Date.now(),
            };
            saveSession(newSession);
            router.replace("/home");
          } else {
            setCheckingSession(false);
          }
        })
        .catch(() => setCheckingSession(false));
      return;
    }

    setCheckingSession(false);
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!studentId.trim() || !password.trim()) {
      setError("Please enter your Student ID and password.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const session = mockLogin(studentId.trim(), password);
      if (!session) {
        setError("Invalid Student ID or password. Try: EAU-2024-001 / student1 or demo / demo");
        setLoading(false);
        return;
      }
      saveSession(session);
      router.push("/home");
    }, 800);
  }

  if (checkingSession) {
    return (
      <div className="loading-center" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
        <span>Loading…</span>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-sky-bg">
        <div className="login-sky-plane">✈️</div>
        <div className="login-sky-cloud" />
        <div className="login-sky-cloud" />
        <div className="login-sky-cloud" />
      </div>

      <div className="login-card">
        <div className="login-logo-wrap">
          <div className="login-logo">EAU</div>
          <div>
            <div className="login-logo-name">Ethiopian Aviation University</div>
            <div className="login-logo-sub">Addis Ababa, Ethiopia ✈️</div>
          </div>
        </div>

        <h1 className="login-title">Exam Practice Portal</h1>
        <p className="login-desc">
          Sign in with your student credentials to access practice exams for your department.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="studentId">Student ID</label>
            <input
              id="studentId"
              className="form-input"
              type="text"
              placeholder="e.g. EAU-2024-001"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="form-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            id="signin-btn"
            className="btn btn--primary btn--full btn--lg"
            type="submit"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <a
            href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace('@', '') || 'ETaviation_bot'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 18px",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              color: "var(--brand)",
              background: "rgba(0,53,128,0.08)",
              border: "1px solid rgba(0,53,128,0.15)",
              borderRadius: 8,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2L2 10.5l6.5 2.5L20 4 10.5 13.5v6l4.5-4 4.5 4L21.5 2z" />
            </svg>
            Register via Telegram
          </a>
        </div>

        <div className="login-footer">
          © {new Date().getFullYear()} Ethiopian Aviation University. All rights reserved.
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mockLogin, saveSession, loadSession } from "@/lib/session";

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
    } else {
      setCheckingSession(false);
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!studentId.trim() || !password.trim()) {
      setError("Please enter your Student ID and password.");
      return;
    }
    setLoading(true);
    // Simulate network delay for realism
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
      {/* Subtle aviation background */}
      <div className="login-sky-bg">
        <div className="login-sky-plane">✈️</div>
        <div className="login-sky-cloud" />
        <div className="login-sky-cloud" />
        <div className="login-sky-cloud" />
      </div>

      <div className="login-card">
        {/* Logo */}
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

        {/* Registration hint */}
        <div
          style={{
            marginTop: 20,
            padding: "16px",
            background: "rgba(0,53,128,0.02)",
            border: "1px solid rgba(0,53,128,0.1)",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, color: "var(--text)" }}>
            Don't have an account?
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.5 }}>
            New students must register via our official Telegram bot to receive their Student ID.
          </p>
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
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              color: "var(--brand)",
              background: "rgba(0,53,128,0.05)",
              border: "1px solid rgba(0,53,128,0.1)",
              borderRadius: 6,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2L2 10.5l6.5 2.5L20 4 10.5 13.5v6l4.5-4 4.5 4L21.5 2z" />
            </svg>
            Register via Telegram
          </a>
        </div>

        {/* Demo hint */}
        <div
          style={{
            marginTop: 20,
            padding: "12px 14px",
            background: "rgba(0,53,128,0.05)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "var(--brand)" }}>Demo access:</strong> Use{" "}
          <code style={{ background: "var(--bg)", padding: "1px 6px", borderRadius: 4 }}>demo</code>{" "}
          /{" "}
          <code style={{ background: "var(--bg)", padding: "1px 6px", borderRadius: 4 }}>demo</code>{" "}
          to explore the app.
        </div>

        <div className="login-footer">
          © {new Date().getFullYear()} Ethiopian Aviation University. All rights reserved.
        </div>
      </div>
    </div>
  );
}

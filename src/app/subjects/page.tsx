"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadSession, clearSession } from "@/lib/session";
import type { StudentSession } from "@/lib/session";
import { getDepartment, DEPARTMENTS } from "@/features/exam/departments";
import type { Department } from "@/features/exam/departments";

type ExamMode = "practice" | "exam";

function Navbar({ session, onLogout }: { session: StudentSession; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="navbar" style={{ position: "relative" }}>
      <div className="navbar__brand">
        <div className="navbar__logo">EAU</div>
        <div className="navbar__appname">
          Exam Portal<span>Ethiopian Aviation University</span>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div className="navbar__right" ref={dropdownRef}>
        <button
          id="profile-avatar-btn"
          className="navbar__avatar"
          onClick={() => setOpen(!open)}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "var(--brand)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            fontWeight: 700,
            border: "2px solid var(--border)",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {session.avatarInitials}
        </button>

        {open && (
          <div
            className="profile-dropdown"
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: 8,
              width: 280,
              background: "var(--surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
              padding: "20px",
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "var(--brand)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 700,
                border: "3px solid var(--border)",
              }}
            >
              {session.avatarInitials}
            </div>

            <div style={{ textAlign: "center", width: "100%" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>{session.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🔑 {session.studentId}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--brand)",
                  background: "var(--brand-light)",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-sm)",
                  display: "inline-block",
                  marginTop: 8,
                  fontWeight: 600,
                }}
              >
                {session.department || "General Candidate"}
              </div>
            </div>

            <hr style={{ width: "100%", border: 0, borderTop: "1px solid var(--border)", margin: "4px 0" }} />

            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 8 }}>
              <button
                className="btn btn--secondary btn--full btn--sm"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 600,
                }}
                onClick={() => {
                  setOpen(false);
                  const url = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace('@', '') || 'ETaviation_bot'}`;
                  if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.openLink) {
                    (window as any).Telegram.WebApp.openLink(url);
                  } else {
                    window.open(url, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                💬 Get Help / Support
              </button>

              <button
                id="logout-btn"
                className="btn btn--primary btn--full btn--sm"
                onClick={onLogout}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  background: "var(--error)",
                  borderColor: "var(--error)",
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function Sidebar({ active }: { active: string }) {
  const router = useRouter();
  const items = [
    { id: "home", label: "Departments", icon: "🏠", path: "/home" },
    { id: "dashboard", label: "My Progress", icon: "📈", path: "/dashboard" },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar__section-label">Navigation</div>
      {items.map((item) => (
        <button
          key={item.id}
          className={`sidebar__item ${active === item.id ? "sidebar__item--active" : ""}`}
          onClick={() => router.push(item.path)}
        >
          <span className="sidebar__item-icon">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </aside>
  );
}

function SubjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deptId = searchParams.get("dept") ?? "amt";

  const [session, setSession] = useState<StudentSession | null>(null);
  const [dept, setDept] = useState<Department | null>(null);
  const [mode, setMode] = useState<ExamMode>("practice");

  useEffect(() => {
    const s = loadSession();
    if (!s) { router.replace("/"); return; }
    setSession(s);
    const d = getDepartment(deptId) ?? DEPARTMENTS[0];
    setDept(d ?? null);
  }, [router, deptId]);

  function handleLogout() {
    clearSession();
    router.push("/");
  }

  function handleStart(examSetId: string, subjectName: string) {
    router.push(
      `/exam?set=${encodeURIComponent(examSetId)}&mode=${mode}&dept=${deptId}&subject=${encodeURIComponent(subjectName)}`
    );
  }

  if (!session || !dept) {
    return (
      <div className="loading-center" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
        <span>Loading…</span>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar session={session} onLogout={handleLogout} />
      <div className="sidebar-layout">
        <Sidebar active="home" />
        <main className="main-content">
          <div className="main-content--centered" style={{ maxWidth: 800 }}>

            {/* Breadcrumb */}
            <div className="breadcrumb">
              <span
                className="breadcrumb__link"
                onClick={() => router.push("/home")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && router.push("/home")}
              >
                Departments
              </span>
              <span className="breadcrumb__sep">›</span>
              <span>{dept.name}</span>
            </div>

            {/* Page Header */}
            <div className="page-header">
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
                <span style={{ fontSize: 36 }}>{dept.icon}</span>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--brand)", margin: 0 }}>
                  {dept.name}
                </h1>
              </div>
              <p className="page-subtitle">{dept.description}</p>
            </div>

            {/* Mode Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                  Select exam mode:
                </div>
                <div className="mode-toggle">
                  <button
                    id="mode-practice"
                    className={`mode-toggle__btn ${mode === "practice" ? "mode-toggle__btn--active" : ""}`}
                    onClick={() => setMode("practice")}
                  >
                    Practice Mode
                  </button>
                  <button
                    id="mode-exam"
                    className={`mode-toggle__btn ${mode === "exam" ? "mode-toggle__btn--active" : ""}`}
                    onClick={() => setMode("exam")}
                  >
                    Exam Mode
                  </button>
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  maxWidth: 280,
                  lineHeight: 1.6,
                }}
              >
                {mode === "practice"
                  ? "💡 Practice Mode: See answer explanations immediately after each question."
                  : "📝 Exam Mode: No feedback until you submit — simulates the real exam."}
              </div>
            </div>

            {/* Subject List */}
            <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
              {dept.subjects.length} Subject{dept.subjects.length !== 1 ? "s" : ""} Available
            </div>
            <div className="subject-list">
              {dept.subjects.map((sub) => (
                <div key={sub.id} className="subject-row" id={`subject-${sub.id}`}>
                  <div className="subject-row__info">
                    <div className="subject-row__name">{sub.name}</div>
                    <div className="subject-row__meta">
                      <span>{sub.questionCount} questions</span>
                      <span>·</span>
                      <span>{sub.durationMinutes} min</span>
                    </div>
                  </div>
                  <div className="subject-row__actions">
                    <button
                      id={`start-${sub.id}`}
                      className="btn btn--primary btn--sm"
                      onClick={() => handleStart(sub.examSetId, sub.name)}
                    >
                      Start ›
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

export default function SubjectsPage() {
  return (
    <Suspense fallback={
      <div className="loading-center" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
        <span>Loading…</span>
      </div>
    }>
      <SubjectsContent />
    </Suspense>
  );
}

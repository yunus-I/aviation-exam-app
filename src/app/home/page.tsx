"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { loadSession, clearSession, loadHistory, getAllowedDepartmentId } from "@/lib/session";
import type { StudentSession, ExamHistoryEntry } from "@/lib/session";
import { DEPARTMENTS } from "@/features/exam/departments";

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
          Exam Portal
          <span>Ethiopian Aviation University</span>
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
                id="my-progress-btn"
                className="btn btn--neutral btn--full btn--sm"
                onClick={() => {
                  setOpen(false);
                  if (typeof window !== "undefined") window.location.href = "/dashboard";
                }}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                📈 My Progress
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
          id={`nav-${item.id}`}
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

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<StudentSession | null>(null);
  const [history, setHistory] = useState<ExamHistoryEntry[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s) { router.replace("/"); return; }
    setSession(s);
    const allowedDeptId = getAllowedDepartmentId(s.department);
    if (allowedDeptId) {
      router.replace(`/subjects?dept=${allowedDeptId}`);
      return;
    }
    setSelectedDeptId(null);
    setHistory(loadHistory().slice(0, 3));
  }, [router]);

  function handleLogout() {
    clearSession();
    router.push("/");
  }

  function handlePractice(deptId: string) {
    router.push(`/subjects?dept=${deptId}`);
  }

  if (!session) {
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
          <div className="main-content--centered">

            {/* Page Header */}
            <div className="page-header">
              <h1 className="page-greeting">Welcome back, {session.name.split(" ")[0]} ✈️</h1>
              <p className="page-subtitle">
                Select your department to start preparing. Choose from {DEPARTMENTS.length} departments with practice sets and full exam simulations.
              </p>
            </div>

            {/* Department Grid */}
            <div className="dept-grid">
              {DEPARTMENTS.map((dept) => {
                const isActive = selectedDeptId === dept.id;
                return (
                  <div
                    key={dept.id}
                    id={`dept-card-${dept.id}`}
                    className={`dept-card ${isActive ? "dept-card--active" : ""}`}
                    onClick={() => setSelectedDeptId(dept.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedDeptId(dept.id)}
                    aria-pressed={isActive}
                  >
                    <div className="dept-card__icon">{dept.icon}</div>
                    <div className="dept-card__name">{dept.name}</div>
                    <div className="dept-card__desc">{dept.description}</div>
                    <div className="dept-card__footer">
                      <span className="dept-card__count">
                        4 practice · 3 exams
                      </span>
                      <button
                        id={`practice-btn-${dept.id}`}
                        className="btn btn--primary btn--sm"
                        onClick={(e) => { e.stopPropagation(); handlePractice(dept.id); }}
                      >
                        Start Preparing
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Sessions */}
            {history.length > 0 && (
              <div>
                <div className="section-title">
                  <span>🕐</span> My Recent Sessions
                </div>
                <div className="recent-sessions">
                  {history.map((entry) => {
                    const date = new Date(entry.completedAt);
                    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                    const mins = Math.round(entry.durationSeconds / 60);
                    return (
                      <div key={entry.id} className="recent-card">
                        <div className="recent-card__subject">{entry.subject}</div>
                        <div className="recent-card__meta">
                          <span className={`badge badge--${entry.mode === "practice" ? "navy" : "gold"}`}>
                            {entry.mode === "practice" ? "Practice" : "Exam"}
                          </span>
                          <span>{dateStr}</span>
                          <span>{mins} min</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {history.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 24px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  color: "var(--text-muted)",
                  fontSize: 14,
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--text)" }}>No sessions yet</div>
                <div>Select a department above and start your first practice session!</div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

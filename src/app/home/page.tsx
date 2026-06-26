"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadSession, clearSession, loadHistory } from "@/lib/session";
import type { StudentSession, ExamHistoryEntry } from "@/lib/session";
import { DEPARTMENTS } from "@/features/exam/departments";

function Navbar({ session, onLogout }: { session: StudentSession; onLogout: () => void }) {
  return (
    <header className="navbar">
      <div className="navbar__brand">
        <div className="navbar__logo">EAU</div>
        <div className="navbar__appname">
          Exam Portal
          <span>Ethiopian Aviation University</span>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div className="navbar__right">
        <div className="navbar__student">
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{session.name}</span>
          <div className="navbar__avatar">{session.avatarInitials}</div>
        </div>
        <button
          id="logout-btn"
          className="btn btn--ghost btn--sm"
          onClick={onLogout}
        >
          Sign Out
        </button>
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
    setSelectedDeptId(s.department
      ? (DEPARTMENTS.find((d) =>
          d.name.toLowerCase() === s.department.toLowerCase()
        )?.id ?? null)
      : null);
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
                Select your department to start practicing. Choose from {DEPARTMENTS.length} departments and hundreds of practice questions.
              </p>
            </div>

            {/* Department Grid */}
            <div className="dept-grid">
              {DEPARTMENTS.map((dept) => {
                const isActive = selectedDeptId === dept.id;
                const totalQ = dept.subjects.reduce((s, sub) => s + sub.questionCount, 0);
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
                        {dept.subjects.length} subjects · {totalQ} questions
                      </span>
                      <button
                        id={`practice-btn-${dept.id}`}
                        className="btn btn--primary btn--sm"
                        onClick={(e) => { e.stopPropagation(); handlePractice(dept.id); }}
                      >
                        Practice Now
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

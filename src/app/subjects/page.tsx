"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadSession, clearSession } from "@/lib/session";
import type { StudentSession } from "@/lib/session";
import { getDepartment, DEPARTMENTS } from "@/features/exam/departments";
import type { Department } from "@/features/exam/departments";

type ExamMode = "practice" | "exam";

function Navbar({ session, onLogout }: { session: StudentSession; onLogout: () => void }) {
  return (
    <header className="navbar">
      <div className="navbar__brand">
        <div className="navbar__logo">EAU</div>
        <div className="navbar__appname">
          Exam Portal<span>Ethiopian Aviation University</span>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div className="navbar__right">
        <div className="navbar__student">
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{session.name}</span>
          <div className="navbar__avatar">{session.avatarInitials}</div>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={onLogout}>Sign Out</button>
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

  const difficultyOrder: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };

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
                      <span>·</span>
                      <span
                        className={`badge badge--${
                          sub.difficulty === "Easy" ? "easy" :
                          sub.difficulty === "Medium" ? "medium" : "hard"
                        }`}
                      >
                        {sub.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="subject-row__actions">
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        border: "2px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: difficultyOrder[sub.difficulty] === 0 ? "var(--success)" :
                               difficultyOrder[sub.difficulty] === 1 ? "#B45309" : "var(--error)",
                      }}
                    >
                      {sub.difficulty[0]}
                    </div>
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

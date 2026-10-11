"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { loadSession, clearSession } from "@/lib/session";
import type { StudentSession } from "@/lib/session";
import { getDepartment, DEPARTMENTS } from "@/features/exam/departments";
import type { Department } from "@/features/exam/departments";

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ session, onLogout }: { session: StudentSession; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

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
            width: 38, height: 38, borderRadius: "50%",
            background: "var(--brand)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 700,
            border: "2px solid var(--border)", cursor: "pointer",
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
              position: "absolute", top: "100%", right: 0, marginTop: 8,
              width: 280, background: "var(--surface)",
              borderRadius: "var(--radius-lg)", border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)", padding: "20px", zIndex: 1000,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
            }}
          >
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, border: "3px solid var(--border)" }}>
              {session.avatarInitials}
            </div>
            <div style={{ textAlign: "center", width: "100%" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>{session.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🔑 {session.studentId}
              </div>
              <div style={{ fontSize: 13, color: "var(--brand)", background: "var(--brand-light)", padding: "4px 10px", borderRadius: "var(--radius-sm)", display: "inline-block", marginTop: 8, fontWeight: 600 }}>
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
                  const url = "https://t.me/airlinegatewayy";
                  if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.openTelegramLink) {
                    (window as any).Telegram.WebApp.openTelegramLink(url);
                  } else if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.openLink) {
                    (window as any).Telegram.WebApp.openLink(url);
                  } else if (typeof window !== "undefined") {
                    window.open(url, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                💬 Get Help / Support
              </button>

              {(() => {
                const isOnDashboard = pathname?.startsWith("/dashboard");
                const isOnDepartments = pathname?.startsWith("/home") || pathname?.startsWith("/subjects");
                const label = isOnDashboard ? "🏠 Departments" : "📈 My Progress";
                const target = isOnDashboard ? "/home" : "/dashboard";
                return (
                  <button
                    id="my-progress-btn"
                    className="btn btn--neutral btn--full btn--sm"
                    onClick={() => {
                      setOpen(false);
                      if (typeof window !== "undefined") window.location.href = target;
                    }}
                    style={{ fontSize: 13, fontWeight: 600 }}
                  >
                    {label}
                  </button>
                );
              })()}

              <button
                id="logout-btn"
                className="btn btn--primary btn--full btn--sm"
                onClick={onLogout}
                style={{ fontSize: 13, fontWeight: 600, background: "var(--error)", borderColor: "var(--error)" }}
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

// ─── Sidebar ──────────────────────────────────────────────────────────────────

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

// ─── Set Card ─────────────────────────────────────────────────────────────────

function SetCard({
  id,
  label,
  questionCount,
  durationMinutes,
  mode,
  onStart,
}: {
  id: string;
  label: string;
  questionCount: number;
  durationMinutes: number;
  mode: "practice" | "exam" | "notes";
  onStart: () => void;
}) {
  const isPractice = mode === "practice";
  return (
    <div
      className="subject-row"
      id={`set-card-${id}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderRadius: "var(--radius-lg)",
        background: "var(--surface)",
        border: `1px solid var(--border)`,
        transition: "box-shadow 0.15s ease, border-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--brand)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 20 }}>{mode === "notes" ? "📓" : isPractice ? "💡" : "📝"}</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{label}</span>
        </div>
        {mode === "notes" ? (
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Read study materials
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", gap: 12 }}>
            <span>{questionCount} questions</span>
            {!isPractice && (
              <>
                <span>·</span>
                <span>{durationMinutes} min</span>
              </>
            )}
            {isPractice && (
              <>
                <span>·</span>
                <span style={{ color: "var(--success, #16a34a)", fontWeight: 600 }}>Instant feedback</span>
              </>
            )}
          </div>
        )}
      </div>
      <button
        id={`start-${id}`}
        className="btn btn--primary btn--sm"
        onClick={onStart}
        style={{ flexShrink: 0 }}
      >
        {mode === "notes" ? "Read ›" : "Start ›"}
      </button>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

import { getAllowedDepartmentId } from "@/lib/session";
import { AccessRestrictedGuard } from "@/components/common/access-restricted-guard";

import { syncTelegramSession } from "@/lib/telegram-session";

import { prefetchExamSet } from "@/lib/exam-cache";

function SubjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deptId = searchParams.get("dept") ?? "amt";

  const [session, setSession] = useState<StudentSession | null>(() => loadSession());
  const [dept, setDept] = useState<Department | null>(() => getDepartment(deptId) ?? DEPARTMENTS[0]);
  const [activeMode, setActiveMode] = useState<"practice" | "exam" | "notes">("practice");
  const [modelExamInfo, setModelExamInfo] = useState<{ hasModelExam: boolean; count: number }>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(`eau_model_exam_${deptId}`);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return { hasModelExam: false, count: 0 };
  });
  const [showSlowNotice, setShowSlowNotice] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSlowNotice(true), 3500);
    const hardTimer = setTimeout(() => {
      setDept((prev) => prev || (getDepartment(deptId) ?? DEPARTMENTS[0]));
      setSession((prev) => {
        if (prev) return prev;
        const existing = loadSession();
        if (existing) return existing;
        return {
          id: "fallback-timeout",
          name: "Student",
          studentId: "unapproved",
          department: "",
          avatarInitials: "S",
          loginAt: Date.now(),
          isApproved: false,
          isAdmin: false,
          registrationStatus: "unregistered",
        };
      });
    }, 5000);
    return () => {
      clearTimeout(timer);
      clearTimeout(hardTimer);
    };
  }, [deptId]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const s = await syncTelegramSession();
        if (!isMounted) return;

        if (!s) {
          const existing = loadSession();
          if (existing) {
            setSession(existing);
            return;
          }
          setSession({
            id: "fallback",
            name: "Student",
            studentId: "unapproved",
            department: "",
            avatarInitials: "S",
            loginAt: Date.now(),
            isApproved: false,
            isAdmin: false,
            registrationStatus: "unregistered",
          });
          return;
        }

        setSession(s);

        if (!s.isApproved && !s.isAdmin) {
          return;
        }

        if (!s.isAdmin) {
          const allowedDeptId = getAllowedDepartmentId(s.department);
          if (allowedDeptId && allowedDeptId !== deptId.toLowerCase()) {
            router.replace(`/subjects?dept=${allowedDeptId}`);
            return;
          }
        }

        const d = getDepartment(deptId) ?? DEPARTMENTS[0];
        setDept(d ?? null);

        // Check if Model Exam 1 questions exist for this department
        try {
          const res = await fetch(`/api/exams/check-model-exam?dept=${encodeURIComponent(deptId)}`);
          const data = await res.json();
          if (isMounted && data.ok) {
            const info = { hasModelExam: Boolean(data.hasModelExam), count: data.questionCount || 0 };
            setModelExamInfo(info);
            try {
              sessionStorage.setItem(`eau_model_exam_${deptId}`, JSON.stringify(info));
            } catch {}
          }
        } catch {
          // Keep existing or cached value
        }
      } catch (err) {
        console.error("Subjects init error:", err);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [router, deptId]);

  // Background prefetch practice and exam sets so starting any exam is instant (0ms)
  useEffect(() => {
    if (!dept) return;
    const sets = [
      ...(dept.practiceSets || []).slice(0, 2),
      ...(dept.examSets || []).slice(0, 2),
    ];
    sets.forEach((s, idx) => {
      setTimeout(() => {
        prefetchExamSet(dept.id, s.examSetId, s.label);
      }, (idx + 1) * 800);
    });
  }, [dept]);

  function handleStartNotes(setLabel: string) {
    if (!dept) return;
    router.push(`/notes?dept=${dept.id}&set=${encodeURIComponent(setLabel)}`);
  }

  function handleLogout() {
    clearSession();
    router.push("/");
  }

  function handleStartPractice(examSetId: string, label: string) {
    router.push(
      `/exam?set=${encodeURIComponent(examSetId)}&mode=practice&dept=${deptId}&subject=${encodeURIComponent(label)}`
    );
  }

  function handleStartExam(examSetId: string, label: string) {
    router.push(
      `/exam?set=${encodeURIComponent(examSetId)}&mode=exam&dept=${deptId}&subject=${encodeURIComponent(label)}`
    );
  }

  function handleNotes() {
    router.push(`/notes?dept=${deptId}`);
  }

  if (!session) {
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
            }}
          >
            <p style={{ fontSize: 13, color: "var(--text-muted, #64748b)", margin: 0 }}>
              Connection is slower than usual.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  setSession({
                    id: "fallback-manual",
                    name: "Student",
                    studentId: "unapproved",
                    department: "",
                    avatarInitials: "S",
                    loginAt: Date.now(),
                    isApproved: false,
                    isAdmin: false,
                    registrationStatus: "unregistered",
                  });
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
                Continue
              </button>
              <button
                onClick={() => window.location.reload()}
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

  if (!session.isApproved && !session.isAdmin) {
    return <AccessRestrictedGuard status={session.registrationStatus} name={session.name} />;
  }

  if (!dept) {
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
        <span style={{ fontWeight: 600, fontSize: 16 }}>Loading department…</span>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar session={session} onLogout={handleLogout} />
      <div className="sidebar-layout">
        <Sidebar active="home" />
        <main className="main-content">
          <div className="main-content--centered" style={{ maxWidth: 820 }}>

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

            {/* Three mode cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 14,
                marginBottom: 36,
              }}
            >
              {/* Practice Mode */}
              <div
                id="mode-card-practice"
                onClick={() => setActiveMode("practice")}
                style={{
                  borderRadius: "var(--radius-lg)",
                  background: activeMode === "practice" ? "linear-gradient(135deg, #003580 0%, #0052cc 100%)" : "var(--surface)",
                  color: activeMode === "practice" ? "#fff" : "var(--text)",
                  border: activeMode === "practice" ? "none" : "1px solid var(--border)",
                  padding: "20px 18px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  transform: activeMode === "practice" ? "translateY(-2px)" : "none",
                  boxShadow: activeMode === "practice" ? "0 4px 12px rgba(0, 53, 128, 0.2)" : "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>💡</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Practice Mode</div>
              </div>

              {/* Exam Mode */}
              <div
                id="mode-card-exam"
                onClick={() => setActiveMode("exam")}
                style={{
                  borderRadius: "var(--radius-lg)",
                  background: activeMode === "exam" ? "linear-gradient(135deg, #b45309 0%, #d97706 100%)" : "var(--surface)",
                  color: activeMode === "exam" ? "#fff" : "var(--text)",
                  border: activeMode === "exam" ? "none" : "1px solid var(--border)",
                  padding: "20px 18px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  transform: activeMode === "exam" ? "translateY(-2px)" : "none",
                  boxShadow: activeMode === "exam" ? "0 4px 12px rgba(180, 83, 9, 0.2)" : "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>📝</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Exam Mode</div>
              </div>

              {/* Notes */}
              <div
                id="mode-card-notes"
                onClick={() => setActiveMode("notes")}
                style={{
                  borderRadius: "var(--radius-lg)",
                  background: activeMode === "notes" ? "linear-gradient(135deg, #059669 0%, #10b981 100%)" : "var(--surface)",
                  color: activeMode === "notes" ? "#fff" : "var(--text)",
                  border: activeMode === "notes" ? "none" : "1px solid var(--border)",
                  padding: "20px 18px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  transform: activeMode === "notes" ? "translateY(-2px)" : "none",
                  boxShadow: activeMode === "notes" ? "0 4px 12px rgba(5, 150, 105, 0.2)" : "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>📓</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Notes</div>
              </div>
            </div>

            {/* Practice Sets */}
            {activeMode === "practice" && (
              <>
                <div
                  style={{ marginBottom: 8, fontSize: 13, fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.6px", display: "flex", alignItems: "center", gap: 8 }}
                >
                  <span>💡</span> Practice Sets
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
                  {dept.practiceSets.map((set) => (
                    <SetCard
                      key={set.id}
                      id={set.id}
                      label={set.label}
                      questionCount={set.questionCount}
                      durationMinutes={set.durationMinutes}
                      mode="practice"
                      onStart={() => handleStartPractice(set.examSetId, set.label)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Exam Sets */}
            {activeMode === "exam" && (
              <>
                <div
                  style={{ marginBottom: 8, fontSize: 13, fontWeight: 700, color: "var(--accent, #b45309)", textTransform: "uppercase", letterSpacing: "0.6px", display: "flex", alignItems: "center", gap: 8 }}
                >
                  <span>📝</span> Exam Sets
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    ...dept.examSets,
                    ...(modelExamInfo.hasModelExam
                      ? [
                          {
                            id: `${dept.id}-model-exam-1`,
                            label: "Model Exam 1",
                            questionCount: modelExamInfo.count || 60,
                            durationMinutes: 90,
                            examSetId: `${dept.id}-model-exam-1`,
                          },
                        ]
                      : []),
                  ].map((set) => (
                    <SetCard
                      key={set.id}
                      id={set.id}
                      label={set.label}
                      questionCount={set.questionCount}
                      durationMinutes={set.durationMinutes}
                      mode="exam"
                      onStart={() => handleStartExam(set.examSetId, set.label)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Note Sets */}
            {activeMode === "notes" && (
              <>
                <div
                  style={{ marginBottom: 8, fontSize: 13, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.6px", display: "flex", alignItems: "center", gap: 8 }}
                >
                  <span>📓</span> Notes
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {dept.noteSets.map((set) => (
                    <SetCard
                      key={set.id}
                      id={set.id}
                      label={set.label}
                      questionCount={0}
                      durationMinutes={0}
                      mode="notes"
                      onStart={() => handleStartNotes(set.label)}
                    />
                  ))}
                </div>
              </>
            )}

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

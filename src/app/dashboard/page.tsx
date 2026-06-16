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

// Simple inline SVG line chart
function ScoreChart({ entries }: { entries: ExamHistoryEntry[] }) {
  const recent = [...entries].reverse().slice(-10);
  if (recent.length < 2) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 14 }}>
        Complete at least 2 sessions to see your trend chart.
      </div>
    );
  }

  const W = 600;
  const H = 120;
  const padX = 40;
  const padY = 16;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;

  const max = 100;
  const min = 0;

  const pts = recent.map((e, i) => ({
    x: padX + (i / (recent.length - 1)) * chartW,
    y: padY + chartH - ((e.percentage - min) / (max - min)) * chartH,
    pct: e.percentage,
  }));

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  // Area fill
  const areaPath = `M ${pts[0].x},${pts[0].y} ` +
    pts.slice(1).map((p) => `L ${p.x},${p.y}`).join(" ") +
    ` L ${pts[pts.length - 1].x},${padY + chartH} L ${pts[0].x},${padY + chartH} Z`;

  // Y-axis labels
  const yLabels = [0, 25, 50, 75, 100];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="chart-svg"
      aria-label="Score trend chart"
      style={{ overflow: "visible" }}
    >
      {/* Grid lines */}
      {yLabels.map((v) => {
        const y = padY + chartH - ((v - min) / (max - min)) * chartH;
        return (
          <g key={v}>
            <line x1={padX} x2={W - padX} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} />
            <text x={padX - 6} y={y + 4} textAnchor="end" fontSize={9} fill="var(--text-subtle)">{v}%</text>
          </g>
        );
      })}

      {/* Area */}
      <path d={areaPath} fill="rgba(0,53,128,0.06)" />

      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke="var(--brand)"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dots */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="var(--brand)" />
          <circle cx={p.x} cy={p.y} r={2} fill="#fff" />
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={9} fill="var(--text-muted)" fontWeight="600">
            {p.pct}%
          </text>
        </g>
      ))}
    </svg>
  );
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<StudentSession | null>(null);
  const [history, setHistory] = useState<ExamHistoryEntry[]>([]);

  useEffect(() => {
    const s = loadSession();
    if (!s) { router.replace("/"); return; }
    setSession(s);
    setHistory(loadHistory());
  }, [router]);

  function handleLogout() {
    clearSession();
    router.push("/");
  }

  if (!session) {
    return (
      <div className="loading-center" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
        <span>Loading…</span>
      </div>
    );
  }

  // Compute stats
  const totalSessions = history.length;
  const avgScore = totalSessions > 0
    ? Math.round(history.reduce((s, e) => s + e.percentage, 0) / totalSessions)
    : 0;
  const bestScore = totalSessions > 0
    ? Math.max(...history.map((e) => e.percentage))
    : 0;

  // Streak: consecutive days with at least one session (from most recent backwards)
  let streak = 0;
  if (history.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayMs = 86400000;
    const days = [...new Set(history.map((e) => {
      const d = new Date(e.completedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))].sort((a, b) => b - a);

    let current = today.getTime();
    for (const day of days) {
      if (day === current || day === current - dayMs) {
        streak++;
        current = day;
      } else break;
    }
  }

  // Dept map for display
  const deptMap: Record<string, string> = {};
  DEPARTMENTS.forEach((d) => { deptMap[d.id] = d.name; });

  const emptyState = totalSessions === 0;

  return (
    <div className="app-shell">
      <Navbar session={session} onLogout={handleLogout} />
      <div className="sidebar-layout">
        <Sidebar active="dashboard" />
        <main className="main-content">
          <div className="main-content--centered">

            {/* Header */}
            <div className="page-header">
              <h1 className="page-greeting">My Progress 📈</h1>
              <p className="page-subtitle">
                Track your practice sessions, scores, and improvements over time.
              </p>
            </div>

            {/* Stat cards */}
            <div className="dashboard-stats">
              {[
                { label: "Total Sessions", val: totalSessions, sub: "practice sessions", icon: "📋" },
                { label: "Average Score", val: `${avgScore}%`, sub: "across all sessions", icon: "🎯" },
                { label: "Best Score", val: `${bestScore}%`, sub: "personal record", icon: "🏆" },
                { label: "Day Streak", val: streak, sub: "consecutive days", icon: "🔥" },
              ].map((card) => (
                <div className="stat-card" key={card.label}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
                  <div className="stat-card__label">{card.label}</div>
                  <div className="stat-card__val">{card.val}</div>
                  <div className="stat-card__sub">{card.sub}</div>
                </div>
              ))}
            </div>

            {/* Score trend chart */}
            <div className="score-chart">
              <div className="score-chart__title">Score Trend (Last {Math.min(history.length, 10)} Sessions)</div>
              <div className="chart-area">
                <ScoreChart entries={history} />
              </div>
            </div>

            {/* History table */}
            <div>
              <div className="section-title" style={{ marginBottom: 14 }}>
                <span>📅</span> Session History
              </div>

              {emptyState ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 24px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    color: "var(--text-muted)",
                    fontSize: 14,
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                  <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 16, marginBottom: 8 }}>
                    No sessions yet
                  </div>
                  <p style={{ lineHeight: 1.7, maxWidth: 320, margin: "0 auto 20px" }}>
                    Complete a practice session to start tracking your progress here.
                  </p>
                  <button
                    className="btn btn--primary"
                    onClick={() => router.push("/home")}
                  >
                    Start Practicing ✈️
                  </button>
                </div>
              ) : (
                <div className="history-table-wrap">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Subject</th>
                        <th>Mode</th>
                        <th>Score</th>
                        <th>Correct / Wrong / Skip</th>
                        <th>Duration</th>
                        <th>Date</th>
                        <th>Review</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((entry, idx) => {
                        const scoreClass =
                          entry.percentage >= 70 ? "history-score--good" :
                          entry.percentage >= 50 ? "history-score--ok" : "history-score--low";
                        return (
                          <tr key={entry.id} id={`history-row-${idx}`}>
                            <td style={{ color: "var(--text-subtle)", fontWeight: 600 }}>{idx + 1}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{entry.subject}</div>
                              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                {deptMap[entry.department] ?? entry.department}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${entry.mode === "practice" ? "badge--navy" : "badge--gold"}`}>
                                {entry.mode === "practice" ? "Practice" : "Exam"}
                              </span>
                            </td>
                            <td>
                              <span className={`history-score ${scoreClass}`}>{entry.percentage}%</span>
                            </td>
                            <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                              <span style={{ color: "var(--success)", fontWeight: 600 }}>{entry.correctCount}✓</span>
                              {" · "}
                              <span style={{ color: "var(--error)", fontWeight: 600 }}>{entry.incorrectCount}✗</span>
                              {" · "}
                              <span style={{ fontWeight: 600 }}>{entry.unansweredCount}–</span>
                            </td>
                            <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                              {formatDuration(entry.durationSeconds)}
                            </td>
                            <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                              {formatDate(entry.completedAt)}
                            </td>
                            <td>
                              <button
                                id={`retry-${idx}`}
                                className="btn btn--ghost btn--sm"
                                onClick={() =>
                                  router.push(
                                    `/exam?set=${encodeURIComponent(entry.examSetId)}&mode=${entry.mode}&dept=${entry.department}&subject=${encodeURIComponent(entry.subject)}`
                                  )
                                }
                              >
                                Retry
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { loadSession, clearSession } from "@/lib/session";
import type { StudentSession } from "@/lib/session";
import { getDepartment, DEPARTMENTS } from "@/features/exam/departments";

type Note = {
  id: string;
  dept: string;
  title: string;
  content: string;
  created_at: string;
};

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
              width: 240, background: "var(--surface)",
              borderRadius: "var(--radius-lg)", border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)", padding: "16px", zIndex: 1000,
              display: "flex", flexDirection: "column", gap: 10,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{session.name}</div>
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
        )}
      </div>
    </header>
  );
}

// ─── Notes Content ────────────────────────────────────────────────────────────

import { getAllowedDepartmentId } from "@/lib/session";
import { AccessRestrictedGuard } from "@/components/common/access-restricted-guard";

function NotesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deptId = searchParams.get("dept") ?? "amt";
  const noteSet = searchParams.get("set");
  const noteTitle = searchParams.get("title");

  const [session, setSession] = useState<StudentSession | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dept = getDepartment(deptId) ?? DEPARTMENTS[0];

  useEffect(() => {
    const s = loadSession();
    if (!s) { router.replace("/"); return; }
    setSession(s);

    if (!s.isApproved && !s.isAdmin) {
      return;
    }

    if (!s.isAdmin) {
      const allowedDeptId = getAllowedDepartmentId(s.department);
      if (allowedDeptId && allowedDeptId !== deptId.toLowerCase()) {
        router.replace(`/notes?dept=${allowedDeptId}`);
        return;
      }
    }
  }, [router, deptId]);

  useEffect(() => {
    const s = loadSession();
    if (s && !s.isApproved && !s.isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`/api/notes?dept=${encodeURIComponent(deptId)}`)
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok || !payload.ok) throw new Error(payload.error ?? "Failed to load notes.");
        let fetchedNotes: (Note & { set_name?: string })[] = payload.notes ?? [];
        if (noteSet) {
          fetchedNotes = fetchedNotes.filter((n) =>
            (n.set_name ?? "Note 1").toLowerCase() === noteSet.toLowerCase()
          );
        } else if (noteTitle) {
          fetchedNotes = fetchedNotes.filter((n) =>
            n.title.toLowerCase() === noteTitle.toLowerCase()
          );
        }
        setNotes(fetchedNotes);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load notes.");
      })
      .finally(() => setLoading(false));
  }, [deptId, noteSet, noteTitle]);

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

  if (!session.isApproved && !session.isAdmin) {
    return <AccessRestrictedGuard status={session.registrationStatus} name={session.name} />;
  }

  return (
    <div className="app-shell">
      <Navbar session={session} onLogout={handleLogout} />
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
            <span
              className="breadcrumb__link"
              onClick={() => router.push(`/subjects?dept=${deptId}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && router.push(`/subjects?dept=${deptId}`)}
            >
              {dept?.name}
            </span>
            <span className="breadcrumb__sep">›</span>
            <span>Notes</span>
          </div>

          {/* Header */}
          <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                <span style={{ fontSize: 32 }}>📓</span>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--brand)", margin: 0 }}>
                  {dept?.name} — Notes
                </h1>
              </div>
              <p className="page-subtitle">Study materials and key concepts for your exam preparation.</p>
            </div>
            <button
              id="back-to-dept-btn"
              className="btn btn--secondary btn--sm"
              onClick={() => router.push(`/subjects?dept=${deptId}`)}
            >
              ← Back to Department
            </button>
          </div>

          {/* Content */}
          {loading && (
            <div className="loading-center" style={{ minHeight: 200 }}>
              <div className="spinner" />
              <span>Loading notes…</span>
            </div>
          )}

          {!loading && error && (
            <div
              style={{
                padding: "24px",
                borderRadius: "var(--radius-lg)",
                background: "rgba(220,38,38,0.05)",
                border: "1px solid rgba(220,38,38,0.2)",
                color: "var(--error)",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {!loading && !error && notes.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "56px 24px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                color: "var(--text-muted)",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 14 }}>📭</div>
              <div style={{ fontWeight: 600, fontSize: 16, color: "var(--text)", marginBottom: 6 }}>No notes yet</div>
              <div style={{ fontSize: 14 }}>
                Notes for this department haven&apos;t been added yet. Check back soon!
              </div>
            </div>
          )}

          {!loading && !error && notes.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {notes.map((note) => (
                <div
                  key={note.id}
                  id={`note-${note.id}`}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "24px 28px",
                    boxShadow: "var(--shadow-sm)",
                    transition: "box-shadow 0.15s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)"; }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--brand)", margin: 0 }}>
                      {note.title}
                    </h2>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, marginLeft: 12, marginTop: 2 }}>
                      {new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.75, whiteSpace: "pre-wrap", margin: 0 }}>
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={
      <div className="loading-center" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
        <span>Loading…</span>
      </div>
    }>
      <NotesContent />
    </Suspense>
  );
}

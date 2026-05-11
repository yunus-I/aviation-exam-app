"use client";

import { useEffect, useState } from "react";
import { MINI_APP_COPY } from "@/features/auth/copy";
import type { MiniAppCandidateSession } from "@/features/auth/repository";
import { ExamWorkbench } from "@/features/exam/exam-workbench";
import type { RegistrationStatus } from "@/types/db";

type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type SessionResponse = {
  ok: boolean;
  telegramUser?: TelegramUser;
  session?: MiniAppCandidateSession | null;
  error?: string;
};

type ViewState =
  | { kind: "loading" }
  | { kind: "outside_telegram" }
  | { kind: "error"; message: string }
  | {
      kind: "ready";
      telegramUser: TelegramUser;
      session: MiniAppCandidateSession | null;
    };

type TabId = "dashboard" | "exam" | "profile" | "help";
type StatusTone = "success" | "warning" | "danger" | "neutral";
type StatusDetails = {
  badge: string;
  title: string;
  description: string;
  action: string;
  tone: StatusTone;
};

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

function getStatusTone(status: RegistrationStatus | "not_found") {
  switch (status) {
    case "approved":
      return "success";
    case "pending_review":
    case "submitted":
      return "warning";
    case "rejected":
      return "danger";
    case "draft":
    default:
      return "neutral";
  }
}

function getStatusCopy(session: MiniAppCandidateSession | null): StatusDetails {
  if (!session) {
    return {
      badge: "No Registration",
      title: MINI_APP_COPY.notFoundTitle,
      description: MINI_APP_COPY.notFoundDescription,
      action: MINI_APP_COPY.notFoundAction,
      tone: "neutral" as const,
    };
  }

  const content =
    MINI_APP_COPY.statusCards[session.registrationStatus] ??
    MINI_APP_COPY.statusCards.draft;

  return {
    badge: content.badge,
    title: content.title,
    description: content.description,
    action: content.action,
    tone: getStatusTone(session.registrationStatus),
  };
}

function StatusCard({
  badge,
  title,
  description,
  action,
  tone,
}: {
  badge: string;
  title: string;
  description: string;
  action: string;
  tone: StatusTone;
}) {
  return (
    <section className={`mini-card mini-card--status mini-card--${tone}`}>
      <div className="mini-card__topline">
        <span className="mini-badge">{badge}</span>
      </div>
      <div className="mini-card__body">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="mini-card__footer">{action}</div> : null}
    </section>
  );
}

export function MiniAppShell() {
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    const initDataRaw = webApp?.initData?.trim();

    if (!webApp || !initDataRaw) {
      setState({ kind: "outside_telegram" });
      return;
    }

    webApp.ready();
    webApp.expand();

    void fetch("/api/mini-app/session", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ initDataRaw }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as SessionResponse;

        if (!response.ok || !payload.ok || !payload.telegramUser) {
          throw new Error(payload.error ?? "Unable to load session.");
        }

        setState({
          kind: "ready",
          telegramUser: payload.telegramUser,
          session: payload.session ?? null,
        });
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Unable to load session.";
        setState({ kind: "error", message });
      });
  }, []);

  const session = state.kind === "ready" ? state.session : null;
  const telegramUser = state.kind === "ready" ? state.telegramUser : null;
  const isApproved = session?.registrationStatus === "approved";

  let statusDetails: StatusDetails;

  if (state.kind === "loading") {
    statusDetails = {
      badge: "Loading",
      title: MINI_APP_COPY.loadingTitle,
      description: MINI_APP_COPY.loadingDescription,
      action: "Please keep this Mini App open.",
      tone: "neutral",
    };
  } else if (state.kind === "outside_telegram") {
    statusDetails = {
      badge: "Telegram Only",
      title: MINI_APP_COPY.loginTitle,
      description: MINI_APP_COPY.loginDescription,
      action: MINI_APP_COPY.loginHint,
      tone: "neutral",
    };
  } else if (state.kind === "error") {
    statusDetails = {
      badge: "Connection Error",
      title: "We couldn't verify your account",
      description: state.message,
      action: "Try reopening the Mini App from Telegram.",
      tone: "danger",
    };
  } else {
    statusDetails = getStatusCopy(state.session);
  }

  const profileRows = [
    {
      label: "Name",
      value: session?.fullName ?? "Not available",
    },
    {
      label: "Telegram",
      value: telegramUser?.username
        ? `@${telegramUser.username}`
        : telegramUser?.first_name ?? "Waiting for Telegram",
    },
    {
      label: "Department",
      value: session?.departmentName ?? "Not selected",
    },
    {
      label: "Region",
      value: session?.regionName ?? "Not selected",
    },
    {
      label: "Status",
      value: session ? session.registrationStatus.replaceAll("_", " ") : "Not registered",
    },
    {
      label: "Access",
      value: isApproved ? "Exam unlocked" : "Exam locked",
    },
  ];

  return (
    <main className="mini-app-shell">
      <section className="mini-app-frame">
        <header className="mini-app-header">
          <div>
            <p className="mini-app-title">EAU Entrance Prep</p>
            <p className="mini-app-subtitle">
              {telegramUser?.first_name ?? "Student"} {isApproved ? "is ready" : "dashboard"}
            </p>
          </div>
          <span className={`mini-pill mini-pill--${statusDetails.tone}`}>
            {statusDetails.badge}
          </span>
        </header>

        <section className="mini-app-content">
          {activeTab === "dashboard" && (
            <div className="mini-tab-panel">
              <StatusCard {...statusDetails} />

              <section className="mini-card">
                <div className="mini-card__topline">
                  <span className="mini-section-label">Quick Overview</span>
                </div>
                <div className="mini-stat-grid">
                  <article className="mini-stat">
                    <span>Department</span>
                    <strong>{session?.departmentName ?? "Pending"}</strong>
                  </article>
                  <article className="mini-stat">
                    <span>Region</span>
                    <strong>{session?.regionName ?? "Pending"}</strong>
                  </article>
                  <article className="mini-stat">
                    <span>Access</span>
                    <strong>{isApproved ? "Ready" : "Locked"}</strong>
                  </article>
                </div>
              </section>
            </div>
          )}

          {activeTab === "exam" && (
            <div className="mini-tab-panel">
              {isApproved && session ? (
                <ExamWorkbench
                  candidateId={session.candidateId}
                  studentName={session.fullName ?? "Student"}
                />
              ) : (
                <section className="mini-card mini-card--exam-lock">
                  <div className="mini-card__topline">
                    <span className="mini-section-label">Exam Access</span>
                  </div>
                  <div className="mini-card__body">
                    <h2>{statusDetails.title}</h2>
                    <p>{statusDetails.description}</p>
                  </div>
                  <div className="mini-card__footer">{statusDetails.action}</div>
                </section>
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <div className="mini-tab-panel">
              <section className="mini-card">
                <div className="mini-card__topline">
                  <span className="mini-section-label">Student Profile</span>
                </div>
                <dl className="mini-profile-list">
                  {profileRows.map((row) => (
                    <div key={row.label} className="mini-profile-row">
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>
          )}

          {activeTab === "help" && (
            <div className="mini-tab-panel">
              <section className="mini-card">
                <div className="mini-card__topline">
                  <span className="mini-section-label">Help</span>
                </div>
                <div className="mini-help-list">
                  <article>
                    <strong>Use the bot to register</strong>
                    <p>Complete your registration and upload the receipt before opening the exam.</p>
                  </article>
                  <article>
                    <strong>Wait for approval</strong>
                    <p>The exam tab unlocks only after your registration is approved.</p>
                  </article>
                  <article>
                    <strong>Open from Telegram</strong>
                    <p>Always launch this Mini App from the bot so your Telegram identity is verified.</p>
                  </article>
                </div>
              </section>
            </div>
          )}
        </section>

        <nav className="mini-tabbar" aria-label="Bottom Tabs">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "exam", label: "Exam" },
            { id: "profile", label: "Profile" },
            { id: "help", label: "Help" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={[
                "mini-tabbar__item",
                activeTab === tab.id ? "mini-tabbar__item--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setActiveTab(tab.id as TabId)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
}

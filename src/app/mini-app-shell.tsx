"use client";

import { useEffect, useState } from "react";
import { APP_COPY } from "@/config/app";
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

function StatusPanel({
  title,
  description,
  badge,
  action,
  tone,
}: {
  title: string;
  description: string;
  badge: string;
  action: string;
  tone: "success" | "warning" | "danger" | "neutral";
}) {
  return (
    <section className={`status-panel status-panel--${tone}`}>
      <div className="status-badge">{badge}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="status-action">{action}</div>
    </section>
  );
}

export function MiniAppShell() {
  const [state, setState] = useState<ViewState>({ kind: "loading" });

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

  const renderStatusPanel = () => {
    if (state.kind === "loading") {
      return (
        <StatusPanel
          badge="Loading"
          title={MINI_APP_COPY.loadingTitle}
          description={MINI_APP_COPY.loadingDescription}
          action="Please keep this screen open."
          tone="neutral"
        />
      );
    }

    if (state.kind === "outside_telegram") {
      return (
        <StatusPanel
          badge="Telegram Only"
          title={MINI_APP_COPY.loginTitle}
          description={MINI_APP_COPY.loginDescription}
          action={MINI_APP_COPY.loginHint}
          tone="neutral"
        />
      );
    }

    if (state.kind === "error") {
      return (
        <StatusPanel
          badge="Connection Error"
          title="We couldn't verify your account"
          description={state.message}
          action="Try reopening the Mini App from Telegram."
          tone="danger"
        />
      );
    }

    if (!state.session) {
      return (
        <StatusPanel
          badge="No Registration"
          title={MINI_APP_COPY.notFoundTitle}
          description={MINI_APP_COPY.notFoundDescription}
          action={MINI_APP_COPY.notFoundAction}
          tone="neutral"
        />
      );
    }

    const content =
      MINI_APP_COPY.statusCards[state.session.registrationStatus] ??
      MINI_APP_COPY.statusCards.draft;

    return (
      <StatusPanel
        badge={content.badge}
        title={content.title}
        description={content.description}
        action={content.action}
        tone={getStatusTone(state.session.registrationStatus)}
      />
    );
  };

  const session = state.kind === "ready" ? state.session : null;
  const telegramUser = state.kind === "ready" ? state.telegramUser : null;
  const isApproved = session?.registrationStatus === "approved";

  return (
    <main className="page-shell page-shell--dashboard">
      <section className="dashboard-stage">
        <div className="dashboard-hero">
          <div>
            <p className="eyebrow">{MINI_APP_COPY.heroKicker}</p>
            <h1 className="dashboard-title">{MINI_APP_COPY.heroTitle}</h1>
            <p className="lede dashboard-lede">{MINI_APP_COPY.heroDescription}</p>
          </div>
          <div className="hero-orbit" aria-hidden="true">
            <span className="hero-orbit__ring hero-orbit__ring--one" />
            <span className="hero-orbit__ring hero-orbit__ring--two" />
            <span className="hero-orbit__core" />
          </div>
        </div>

        <div className="dashboard-grid">
          {renderStatusPanel()}

          <section className="identity-panel">
            <div className="identity-header">
              <span className="section-kicker">Account Snapshot</span>
              <h2>Student profile</h2>
            </div>

            <dl className="identity-list">
              <div>
                <dt>App</dt>
                <dd>{APP_COPY.title}</dd>
              </div>
              <div>
                <dt>Telegram</dt>
                <dd>
                  {telegramUser?.username
                    ? `@${telegramUser.username}`
                    : telegramUser?.first_name ?? "Waiting for Telegram"}
                </dd>
              </div>
              <div>
                <dt>Full name</dt>
                <dd>{session?.fullName ?? "Not available yet"}</dd>
              </div>
              <div>
                <dt>Department</dt>
                <dd>{session?.departmentName ?? "Not selected yet"}</dd>
              </div>
              <div>
                <dt>Region</dt>
                <dd>{session?.regionName ?? "Not selected yet"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  {session
                    ? session.registrationStatus.replaceAll("_", " ")
                    : "Not registered"}
                </dd>
              </div>
            </dl>
          </section>

          {isApproved ? (
            <ExamWorkbench
              candidateId={session.candidateId}
              studentName={session.fullName ?? "Student"}
            />
          ) : (
            <section className="feature-panel">
              <span className="section-kicker">What Comes Next</span>
              <h2>Phase 4 delivery</h2>
              <div className="feature-stack">
                <article>
                  <strong>Secure access gate</strong>
                  <p>
                    Telegram WebApp identity is verified on the server before we
                    show account data.
                  </p>
                </article>
                <article>
                  <strong>Status-aware dashboard</strong>
                  <p>
                    Approved, pending, rejected, and missing-registration
                    states each get their own UX.
                  </p>
                </article>
                <article>
                  <strong>Exam-ready shell</strong>
                  <p>
                    This layout is now ready for the next phase where the real
                    exam dashboard and engine will plug in.
                  </p>
                </article>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

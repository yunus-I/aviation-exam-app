"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveSession, loadSession } from "@/lib/session";

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

export default function EntryPage() {
  const router = useRouter();

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    const initDataRaw = webApp?.initData?.trim();

    if (webApp && initDataRaw) {
      webApp.ready();
      webApp.expand();

      fetch("/api/mini-app/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initDataRaw }),
      })
        .then(async (res) => {
          const payload = await res.json();
          if (payload.ok && payload.session && (payload.session.registrationStatus === "approved" || payload.session.isAdmin)) {
            const ts = payload.session;
            const newSession = {
              id: ts.candidateId,
              name: ts.fullName || payload.telegramUser?.first_name || "Telegram User",
              studentId: `TG-${payload.telegramUser?.id}`,
              department: ts.departmentName || "General",
              avatarInitials: (ts.fullName || payload.telegramUser?.first_name || "T")[0].toUpperCase(),
              loginAt: Date.now(),
              isApproved: true,
              isAdmin: Boolean(ts.isAdmin),
              registrationStatus: "approved",
            };
            saveSession(newSession);
            router.replace("/home");
          } else {
            // Not approved -> save restricted session
            saveRestrictedSession(payload.session?.registrationStatus, payload.telegramUser?.first_name);
          }
        })
        .catch(() => {
          saveRestrictedSession();
        });
    } else {
      fallbackToLocalOrRestricted();
    }

    function fallbackToLocalOrRestricted() {
      const existing = loadSession();
      if (existing) {
        router.replace("/home");
      } else {
        saveRestrictedSession();
      }
    }

    function saveRestrictedSession(status?: string, firstName?: string) {
      const restrictedSession = {
        id: crypto.randomUUID(),
        name: firstName || "Student",
        studentId: "unapproved",
        department: "",
        avatarInitials: (firstName || "S")[0].toUpperCase(),
        loginAt: Date.now(),
        isApproved: false,
        isAdmin: false,
        registrationStatus: status || "unregistered",
      };
      saveSession(restrictedSession);
      router.replace("/home");
    }
  }, [router]);

  return (
    <div className="loading-center" style={{ minHeight: "100vh" }}>
      <div className="spinner" />
      <span>Loading…</span>
    </div>
  );
}


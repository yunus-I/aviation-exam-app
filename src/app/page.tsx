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
    const session = loadSession();
    if (session) {
      router.replace("/home");
      return;
    }

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
          if (payload.ok && payload.session?.registrationStatus === "approved") {
            const ts = payload.session;
            const newSession = {
              id: ts.candidateId,
              name: ts.fullName || payload.telegramUser?.first_name || "Telegram User",
              studentId: `TG-${payload.telegramUser?.id}`,
              department: ts.departmentName || "General",
              avatarInitials: (ts.fullName || payload.telegramUser?.first_name || "T")[0].toUpperCase(),
              loginAt: Date.now(),
            };
            saveSession(newSession);
            router.replace("/home");
          } else {
            // Not approved yet -> Demo access
            loginAsDemo();
          }
        })
        .catch(() => loginAsDemo());
    } else {
      // Outside Telegram -> Demo access
      loginAsDemo();
    }

    function loginAsDemo() {
      const demoSession = {
        id: crypto.randomUUID(),
        name: "Demo Student",
        studentId: "demo",
        department: "", // empty so they can choose department on /home
        avatarInitials: "DS",
        loginAt: Date.now(),
      };
      saveSession(demoSession);
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


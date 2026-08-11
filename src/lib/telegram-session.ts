import { loadSession, saveSession, clearSession, StudentSession } from "@/lib/session";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: {
            id?: number;
            first_name?: string;
            last_name?: string;
            username?: string;
          };
        };
        ready: () => void;
        expand: () => void;
      };
    };
  }
}

/**
 * Extracts active Telegram user ID from initData or initDataUnsafe
 */
export function getActiveTelegramUserId(): number | null {
  if (typeof window === "undefined") return null;
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return null;

  // 1. Try initDataUnsafe.user.id
  if (webApp.initDataUnsafe?.user?.id) {
    return Number(webApp.initDataUnsafe.user.id);
  }

  // 2. Try parsing initData string directly
  const initDataRaw = webApp.initData?.trim();
  if (initDataRaw) {
    try {
      const params = new URLSearchParams(initDataRaw);
      const userStr = params.get("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.id) {
          return Number(user.id);
        }
      }
    } catch {}
  }

  return null;
}

/**
 * Synchronizes and validates client session with Telegram WebApp initData.
 * Ensures that if the Telegram user changes (e.g. switching accounts on same device),
 * the session is updated to match the active Telegram account.
 */
export async function syncTelegramSession(): Promise<StudentSession | null> {
  if (typeof window === "undefined") return null;

  const webApp = window.Telegram?.WebApp;
  let initDataRaw = webApp?.initData?.trim();

  // If Telegram WebApp object exists but initData is not ready yet, wait briefly
  if (webApp && !initDataRaw) {
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 60));
      initDataRaw = window.Telegram?.WebApp?.initData?.trim();
      if (initDataRaw) break;
    }
  }

  const activeTgId = getActiveTelegramUserId();
  const existingSession = loadSession();

  // Inside Telegram with initData available
  if (webApp && initDataRaw) {
    try {
      webApp.ready();
      webApp.expand();
    } catch {}

    // Check if existing session matches active Telegram user ID
    if (existingSession && activeTgId) {
      const storedTgId = existingSession.studentId?.startsWith("TG-")
        ? Number(existingSession.studentId.replace("TG-", ""))
        : null;

      // Session matches current Telegram user!
      if (storedTgId === activeTgId) {
        return existingSession;
      }
    }

    // Account changed or session missing/mismatched -> Fetch fresh session for active Telegram account
    clearSession();

    try {
      const res = await fetch("/api/mini-app/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initDataRaw }),
      });

      const payload = await res.json();

      if (
        payload.ok &&
        payload.session &&
        (payload.session.registrationStatus === "approved" || payload.session.isAdmin)
      ) {
        const ts = payload.session;
        const freshSession: StudentSession = {
          id: ts.candidateId,
          name: ts.fullName || payload.telegramUser?.first_name || "Telegram User",
          studentId: `TG-${payload.telegramUser?.id ?? activeTgId}`,
          department: ts.departmentName || "General",
          avatarInitials: (ts.fullName || payload.telegramUser?.first_name || "T")[0].toUpperCase(),
          loginAt: Date.now(),
          isApproved: true,
          isAdmin: Boolean(ts.isAdmin),
          registrationStatus: "approved",
        };
        saveSession(freshSession);
        return freshSession;
      } else {
        const restrictedSession: StudentSession = {
          id: crypto.randomUUID(),
          name: payload.telegramUser?.first_name || "Student",
          studentId: payload.telegramUser?.id ? `TG-${payload.telegramUser.id}` : activeTgId ? `TG-${activeTgId}` : "unapproved",
          department: payload.session?.departmentName || "",
          avatarInitials: (payload.telegramUser?.first_name || "S")[0].toUpperCase(),
          loginAt: Date.now(),
          isApproved: false,
          isAdmin: false,
          registrationStatus: payload.session?.registrationStatus || "unregistered",
        };
        saveSession(restrictedSession);
        return restrictedSession;
      }
    } catch {
      // If network fails and existing session matches active TG user, use existing
      if (existingSession && activeTgId) {
        const storedTgId = existingSession.studentId?.startsWith("TG-")
          ? Number(existingSession.studentId.replace("TG-", ""))
          : null;
        if (storedTgId === activeTgId) return existingSession;
      }

      const restrictedSession: StudentSession = {
        id: crypto.randomUUID(),
        name: "Student",
        studentId: activeTgId ? `TG-${activeTgId}` : "unapproved",
        department: "",
        avatarInitials: "S",
        loginAt: Date.now(),
        isApproved: false,
        isAdmin: false,
        registrationStatus: "unregistered",
      };
      saveSession(restrictedSession);
      return restrictedSession;
    }
  }

  // Outside Telegram (normal browser)
  if (existingSession) {
    return existingSession;
  }

  const defaultRestricted: StudentSession = {
    id: crypto.randomUUID(),
    name: "Student",
    studentId: "unapproved",
    department: "",
    avatarInitials: "S",
    loginAt: Date.now(),
    isApproved: false,
    isAdmin: false,
    registrationStatus: "unregistered",
  };
  saveSession(defaultRestricted);
  return defaultRestricted;
}

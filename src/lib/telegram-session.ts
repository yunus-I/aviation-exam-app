import { loadSession, saveSession, clearSession, generateSafeId, StudentSession } from "@/lib/session";

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
 * Extracts raw initData from URL hash or query params if Telegram SDK has not populated it yet.
 */
function getRawInitDataFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash);
      const tgWebAppData = params.get("tgWebAppData");
      if (tgWebAppData) return tgWebAppData;
    }
    const search = window.location.search.startsWith("?") ? window.location.search.slice(1) : window.location.search;
    if (search) {
      const params = new URLSearchParams(search);
      const tgWebAppData = params.get("tgWebAppData");
      if (tgWebAppData) return tgWebAppData;
    }
  } catch {}
  return null;
}

/**
 * Extracts active Telegram user ID from initData, initDataUnsafe, or location hash
 */
export function getActiveTelegramUserId(): number | null {
  if (typeof window === "undefined") return null;
  const webApp = window.Telegram?.WebApp;

  // 1. Try initDataUnsafe.user.id
  if (webApp?.initDataUnsafe?.user?.id) {
    return Number(webApp.initDataUnsafe.user.id);
  }

  // 2. Try parsing initData string directly from WebApp or location
  const initDataRaw = webApp?.initData?.trim() || getRawInitDataFromLocation();
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

async function refreshSessionInBackground(existingSession: StudentSession): Promise<void> {
  try {
    const webApp = window.Telegram?.WebApp;
    const initDataRaw = webApp?.initData?.trim() || getRawInitDataFromLocation();
    const activeTgId = getActiveTelegramUserId();

    if (!initDataRaw && !activeTgId) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("/api/mini-app/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        initDataRaw: initDataRaw || undefined,
        telegramUserId: activeTgId || undefined,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const payload = await res.json();
    if (payload.ok && payload.session) {
      const ts = payload.session;
      const isApproved = ts.registrationStatus === "approved" || Boolean(ts.isAdmin);
      const updated: StudentSession = {
        ...existingSession,
        department: ts.departmentName || existingSession.department,
        isApproved,
        isAdmin: Boolean(ts.isAdmin),
        registrationStatus: ts.registrationStatus,
      };
      saveSession(updated);
    }
  } catch {}
}

/**
 * Synchronizes and validates client session with Telegram WebApp initData.
 * Ensures that if the Telegram user changes (e.g. switching accounts on same device),
 * the session is updated to match the active Telegram account.
 * Guaranteed to never throw an uncaught exception.
 */
export async function syncTelegramSession(): Promise<StudentSession | null> {
  if (typeof window === "undefined") return null;

  try {
    const existingSession = loadSession();
    let webApp = window.Telegram?.WebApp;

    // Fast path: If we already have a valid session in local storage, return it instantly!
    // This allows 0ms instant page loads without staring at spinners.
    if (existingSession && (existingSession.isApproved || existingSession.isAdmin)) {
      // Fire background verification without blocking UI
      setTimeout(() => {
        refreshSessionInBackground(existingSession);
      }, 50);
      return existingSession;
    }

    // 1. If Telegram script is still loading, poll briefly (up to 400ms max)
    if (!webApp) {
      for (let i = 0; i < 8; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        webApp = window.Telegram?.WebApp;
        if (webApp) break;
      }
    }

    // Call ready & expand immediately to notify Telegram container
    if (webApp) {
      try {
        webApp.ready();
        webApp.expand();
      } catch {}
    }

    let initDataRaw = webApp?.initData?.trim();

    // 2. If webApp exists but initData is not ready yet, wait up to 600ms.
    // On slower Android WebViews and iOS Telegram builds the SDK populates
    // initData asynchronously after the ready() call, so we need extra time.
    if (webApp && !initDataRaw) {
      for (let i = 0; i < 6; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        initDataRaw = window.Telegram?.WebApp?.initData?.trim();
        if (initDataRaw) break;
      }
    }

    // 3. Fallback to location hash / search if still not available
    if (!initDataRaw) {
      initDataRaw = getRawInitDataFromLocation() ?? "";
    }

    const activeTgId = getActiveTelegramUserId();

    // Inside Telegram with initData available or Telegram user ID detected
    if (initDataRaw || activeTgId) {
      // Check if existing session matches active Telegram user ID
      if (existingSession && activeTgId) {
        const storedTgId = existingSession.studentId?.startsWith("TG-")
          ? Number(existingSession.studentId.replace("TG-", ""))
          : null;

        if (storedTgId === activeTgId) {
          return existingSession;
        }
      }

      // Fetch fresh session for active Telegram account with a 3.5s timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch("/api/mini-app/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            initDataRaw: initDataRaw || undefined,
            telegramUserId: activeTgId || undefined,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const payload = await res.json();

        if (
          payload.ok &&
          payload.session &&
          (payload.session.registrationStatus === "approved" || payload.session.isAdmin)
        ) {
          const ts = payload.session;
          const freshSession: StudentSession = {
            id: ts.candidateId || generateSafeId(),
            name: ts.fullName || payload.telegramUser?.first_name || "Telegram User",
            studentId: `TG-${payload.telegramUser?.id ?? activeTgId}`,
            department: ts.departmentName || "General",
            avatarInitials: (ts.fullName || payload.telegramUser?.first_name || "T")[0]?.toUpperCase() || "T",
            loginAt: Date.now(),
            isApproved: true,
            isAdmin: Boolean(ts.isAdmin),
            registrationStatus: "approved",
          };
          saveSession(freshSession);
          return freshSession;
        } else {
          const restrictedSession: StudentSession = {
            id: generateSafeId(),
            name: payload.telegramUser?.first_name || "Student",
            studentId: payload.telegramUser?.id ? `TG-${payload.telegramUser.id}` : activeTgId ? `TG-${activeTgId}` : "unapproved",
            department: payload.session?.departmentName || "",
            avatarInitials: (payload.telegramUser?.first_name || "S")[0]?.toUpperCase() || "S",
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
          id: generateSafeId(),
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
      id: generateSafeId(),
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
  } catch {
    // Top-level fail-safe: always return a valid session object
    const fallback: StudentSession = {
      id: generateSafeId(),
      name: "Student",
      studentId: "unapproved",
      department: "",
      avatarInitials: "S",
      loginAt: Date.now(),
      isApproved: false,
      isAdmin: false,
      registrationStatus: "unregistered",
    };
    try {
      saveSession(fallback);
    } catch {}
    return fallback;
  }
}


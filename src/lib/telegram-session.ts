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
 * Extracts raw initData from URL hash, query params, or sessionStorage.
 */
function getRawInitDataFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  try {
    // 1. Try reading from cached sessionStorage first
    const cached = sessionStorage.getItem("eau_raw_init_data");
    if (cached) return cached;

    // 2. Try parsing location hash
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash);
      const tgWebAppData = params.get("tgWebAppData");
      if (tgWebAppData) {
        try { sessionStorage.setItem("eau_raw_init_data", tgWebAppData); } catch {}
        return tgWebAppData;
      }
      if (params.has("hash") && params.has("auth_date")) {
        try { sessionStorage.setItem("eau_raw_init_data", hash); } catch {}
        return hash;
      }
    }

    // 3. Try parsing location search
    const search = window.location.search.startsWith("?") ? window.location.search.slice(1) : window.location.search;
    if (search) {
      const params = new URLSearchParams(search);
      const tgWebAppData = params.get("tgWebAppData");
      if (tgWebAppData) {
        try { sessionStorage.setItem("eau_raw_init_data", tgWebAppData); } catch {}
        return tgWebAppData;
      }
      if (params.has("hash") && params.has("auth_date")) {
        try { sessionStorage.setItem("eau_raw_init_data", search); } catch {}
        return search;
      }
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
    const timer = setTimeout(() => controller.abort(), 6000);
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

    // Call ready & expand immediately to notify Telegram container
    if (webApp) {
      try {
        webApp.ready();
        webApp.expand();
      } catch {}
    }

    const activeTgId = getActiveTelegramUserId();

    // Fast path: If we already have a valid session in local storage that matches
    // active Telegram user, return it instantly!
    if (existingSession && (existingSession.isApproved || existingSession.isAdmin)) {
      if (activeTgId) {
        const storedTgId = existingSession.studentId?.startsWith("TG-")
          ? Number(existingSession.studentId.replace("TG-", ""))
          : null;
        if (storedTgId === activeTgId) {
          setTimeout(() => { refreshSessionInBackground(existingSession); }, 50);
          return existingSession;
        }
      } else {
        // No activeTgId detected yet, trust existing approved session and verify in background
        setTimeout(() => { refreshSessionInBackground(existingSession); }, 50);
        return existingSession;
      }
    }

    // 1. If Telegram script is still initializing, wait up to 1000ms
    if (!webApp) {
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        webApp = window.Telegram?.WebApp;
        if (webApp) break;
      }
    }

    if (webApp) {
      try {
        webApp.ready();
        webApp.expand();
      } catch {}
    }

    let initDataRaw = webApp?.initData?.trim();

    // 2. If webApp exists but initData is not ready yet, wait up to 1000ms.
    if (webApp && !initDataRaw) {
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        initDataRaw = window.Telegram?.WebApp?.initData?.trim();
        if (initDataRaw) break;
      }
    }

    // 3. Fallback to location hash / search / sessionStorage if still not available
    if (!initDataRaw) {
      initDataRaw = getRawInitDataFromLocation() ?? "";
    } else {
      try { sessionStorage.setItem("eau_raw_init_data", initDataRaw); } catch {}
    }

    const currentTgId = activeTgId || getActiveTelegramUserId();

    // Inside Telegram with initData available or Telegram user ID detected
    if (initDataRaw || currentTgId) {
      // Check if existing session matches active Telegram user ID
      if (existingSession && currentTgId) {
        const storedTgId = existingSession.studentId?.startsWith("TG-")
          ? Number(existingSession.studentId.replace("TG-", ""))
          : null;

        if (storedTgId === currentTgId && (existingSession.isApproved || existingSession.isAdmin)) {
          return existingSession;
        }
      }

      // Fetch fresh session for active Telegram account with an 8.0s timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch("/api/mini-app/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            initDataRaw: initDataRaw || undefined,
            telegramUserId: currentTgId || undefined,
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
            studentId: `TG-${payload.telegramUser?.id ?? currentTgId}`,
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
            studentId: payload.telegramUser?.id ? `TG-${payload.telegramUser.id}` : currentTgId ? `TG-${currentTgId}` : "unapproved",
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
        // If network fails and existing session exists, PRESERVE IT! Do not downgrade.
        if (existingSession) {
          return existingSession;
        }

        const restrictedSession: StudentSession = {
          id: generateSafeId(),
          name: "Student",
          studentId: currentTgId ? `TG-${currentTgId}` : "unapproved",
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


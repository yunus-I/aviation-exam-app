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
export function getRawInitDataFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  try {
    // 1. Try parsing location hash first (freshest data from Telegram launch)
    const rawHash = window.location.hash || "";
    const hash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
    if (hash) {
      const params = new URLSearchParams(hash);
      const tgWebAppData = params.get("tgWebAppData");
      if (tgWebAppData) {
        try { sessionStorage.setItem("eau_raw_init_data", tgWebAppData); } catch {}
        return tgWebAppData;
      }
      if (params.has("hash") && (params.has("auth_date") || params.has("user"))) {
        try { sessionStorage.setItem("eau_raw_init_data", hash); } catch {}
        return hash;
      }
      if (hash.startsWith("tgWebAppData=")) {
        const val = hash.slice("tgWebAppData=".length);
        try { sessionStorage.setItem("eau_raw_init_data", val); } catch {}
        return val;
      }
    }

    // 2. Try parsing location search (some Telegram Web / Desktop clients)
    const rawSearch = window.location.search || "";
    const search = rawSearch.startsWith("?") ? rawSearch.slice(1) : rawSearch;
    if (search) {
      const params = new URLSearchParams(search);
      const tgWebAppData = params.get("tgWebAppData");
      if (tgWebAppData) {
        try { sessionStorage.setItem("eau_raw_init_data", tgWebAppData); } catch {}
        return tgWebAppData;
      }
      if (params.has("hash") && (params.has("auth_date") || params.has("user"))) {
        try { sessionStorage.setItem("eau_raw_init_data", search); } catch {}
        return search;
      }
    }

    // 3. Try reading from cached sessionStorage if non-empty
    const cached = sessionStorage.getItem("eau_raw_init_data");
    if (cached && cached.trim().length > 5) return cached.trim();
  } catch {}
  return null;
}

/**
 * Extracts active Telegram user ID from initData, initDataUnsafe, or location
 */
export function getActiveTelegramUserId(): number | null {
  if (typeof window === "undefined") return null;
  const webApp = window.Telegram?.WebApp;

  // 1. Try initDataUnsafe.user.id
  if (webApp?.initDataUnsafe?.user?.id) {
    const id = Number(webApp.initDataUnsafe.user.id);
    if (!isNaN(id) && id > 0) return id;
  }

  // 2. Try parsing initData string directly from WebApp or location
  const initDataRaw = webApp?.initData?.trim() || getRawInitDataFromLocation();
  if (initDataRaw) {
    try {
      let clean = initDataRaw;
      if (clean.startsWith("#")) clean = clean.slice(1);
      if (clean.startsWith("?")) clean = clean.slice(1);
      if (clean.startsWith("tgWebAppData=")) clean = clean.slice("tgWebAppData=".length);

      const params = new URLSearchParams(clean);
      let userStr = params.get("user");
      if (!userStr && clean.includes("user=")) {
        const match = clean.match(/user=([^&]+)/);
        if (match) userStr = match[1];
      }
      if (userStr) {
        try { userStr = decodeURIComponent(userStr); } catch {}
        const user = JSON.parse(userStr);
        if (user?.id) {
          const id = Number(user.id);
          if (!isNaN(id) && id > 0) return id;
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
        if (typeof webApp.ready === "function") webApp.ready();
        if (typeof webApp.expand === "function") webApp.expand();
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

    // 1. If Telegram script is still initializing on slow devices, wait up to 2500ms
    if (!webApp) {
      for (let i = 0; i < 25; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        webApp = window.Telegram?.WebApp;
        if (webApp) break;
      }
    }

    if (webApp) {
      try {
        if (typeof webApp.ready === "function") webApp.ready();
        if (typeof webApp.expand === "function") webApp.expand();
      } catch {}
    }

    let initDataRaw = webApp?.initData?.trim();

    // 2. If webApp exists but initData is not ready yet, wait up to 2000ms
    if (webApp && !initDataRaw) {
      for (let i = 0; i < 20; i++) {
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


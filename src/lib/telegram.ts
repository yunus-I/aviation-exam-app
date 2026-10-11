import { createHmac } from "node:crypto";
import { env } from "@/lib/env";

export type TelegramWebAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export type VerifiedTelegramInitData = {
  authDate: number;
  hash: string;
  queryId?: string;
  user: TelegramWebAppUser | null;
  raw: string;
};

function sanitizeInitData(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("#")) cleaned = cleaned.slice(1);
  if (cleaned.startsWith("?")) cleaned = cleaned.slice(1);

  if (cleaned.startsWith("tgWebAppData=")) {
    cleaned = cleaned.slice("tgWebAppData=".length);
    try {
      cleaned = decodeURIComponent(cleaned);
    } catch {}
  } else if (cleaned.includes("tgWebAppData=")) {
    try {
      const p = new URLSearchParams(cleaned);
      const inner = p.get("tgWebAppData");
      if (inner) cleaned = inner;
    } catch {}
  }

  // Handle double URL-encoding if still encoded (e.g. contains %26 instead of &)
  if (!cleaned.includes("&") && cleaned.includes("%26")) {
    try {
      cleaned = decodeURIComponent(cleaned);
    } catch {}
  }

  return cleaned;
}

function buildDataCheckString(params: URLSearchParams) {
  return Array.from(params.entries())
    .filter(([key]) => key !== "hash" && key !== "signature")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

export function extractTelegramUser(initDataRaw: string): TelegramWebAppUser | null {
  if (!initDataRaw) return null;
  const cleaned = sanitizeInitData(initDataRaw);
  try {
    const params = new URLSearchParams(cleaned);
    let userStr = params.get("user");
    if (!userStr && cleaned.includes("user=")) {
      const match = cleaned.match(/user=([^&]+)/);
      if (match) userStr = decodeURIComponent(match[1]);
    }
    if (userStr) {
      if (userStr.startsWith("%")) {
        try { userStr = decodeURIComponent(userStr); } catch {}
      }
      const user = JSON.parse(userStr);
      if (user?.id) return user as TelegramWebAppUser;
    }
  } catch {}
  return null;
}

export function extractTelegramUserId(initDataRaw: string): number | null {
  const user = extractTelegramUser(initDataRaw);
  return user?.id ? Number(user.id) : null;
}

export function verifyTelegramInitData(initDataRaw: string): VerifiedTelegramInitData | null {
  if (!initDataRaw) return null;

  const botToken = env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  const cleaned = sanitizeInitData(initDataRaw);
  const params = new URLSearchParams(cleaned);
  const hash = params.get("hash");
  const authDate = params.get("auth_date");

  if (!hash || !authDate) {
    return null;
  }

  const secret = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const dataCheckString = buildDataCheckString(params);
  const calculatedHash = createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  if (calculatedHash.toLowerCase() !== hash.toLowerCase()) {
    // Secondary fallback: build data-check-string from raw pair splitting
    // to protect against URLSearchParams query decoding variance (spaces, +, etc.)
    const rawPairs: string[] = [];
    const parts = cleaned.split("&");
    for (const part of parts) {
      const eqIdx = part.indexOf("=");
      if (eqIdx > 0) {
        const k = decodeURIComponent(part.slice(0, eqIdx));
        if (k !== "hash" && k !== "signature") {
          const v = decodeURIComponent(part.slice(eqIdx + 1));
          rawPairs.push(`${k}=${v}`);
        }
      }
    }
    rawPairs.sort((a, b) => a.localeCompare(b));
    const altCheckString = rawPairs.join("\n");
    const altHash = createHmac("sha256", secret)
      .update(altCheckString)
      .digest("hex");

    if (altHash.toLowerCase() !== hash.toLowerCase()) {
      return null;
    }
  }

  const user = extractTelegramUser(cleaned);

  return {
    authDate: Number(authDate),
    hash,
    queryId: params.get("query_id") ?? undefined,
    user,
    raw: cleaned,
  } satisfies VerifiedTelegramInitData;
}

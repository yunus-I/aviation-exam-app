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

function buildDataCheckString(params: URLSearchParams) {
  return Array.from(params.entries())
    .filter(([key]) => key !== "hash")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

export function verifyTelegramInitData(initDataRaw: string) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  const params = new URLSearchParams(initDataRaw);
  const hash = params.get("hash");
  const authDate = params.get("auth_date");

  if (!hash || !authDate) {
    return null;
  }

  const secret = createHmac("sha256", "WebAppData")
    .update(env.TELEGRAM_BOT_TOKEN)
    .digest();

  const calculatedHash = createHmac("sha256", secret)
    .update(buildDataCheckString(params))
    .digest("hex");

  if (calculatedHash !== hash) {
    return null;
  }

  const userParam = params.get("user");
  let user: TelegramWebAppUser | null = null;

  if (userParam) {
    user = JSON.parse(userParam) as TelegramWebAppUser;
  }

  return {
    authDate: Number(authDate),
    hash,
    queryId: params.get("query_id") ?? undefined,
    user,
    raw: initDataRaw,
  } satisfies VerifiedTelegramInitData;
}

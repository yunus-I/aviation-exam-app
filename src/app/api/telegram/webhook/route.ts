import { NextRequest, NextResponse } from "next/server";
import { getTelegramBot } from "@/features/bot/bot";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const REQUIRED_UPDATES = ["message", "callback_query", "edited_message"];

async function verifyAndRepairWebhook() {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN is not configured" };
  }

  const rawBaseUrl = env.NEXT_PUBLIC_MINI_APP_URL || "https://aviation-cyan.vercel.app";
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");
  const expectedWebhookUrl = `${baseUrl}/api/telegram/webhook`;

  try {
    const infoRes = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`,
      { cache: "no-store" },
    );
    const infoData = await infoRes.json();
    const currentWebhook = infoData?.result;

    const currentUrl = currentWebhook?.url || "";
    const allowed = (currentWebhook?.allowed_updates as string[]) || [];
    const hasCallbackQuery = allowed.includes("callback_query");
    const hasMessage = allowed.includes("message");

    const isHealthy = currentUrl === expectedWebhookUrl && hasCallbackQuery && hasMessage;

    if (isHealthy) {
      return {
        ok: true,
        status: "healthy",
        webhook: currentWebhook,
      };
    }

    // Auto-repair webhook registration
    console.log(`[Telegram Webhook] Auto-repairing webhook registration to ${expectedWebhookUrl}...`);
    const setRes = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: expectedWebhookUrl,
          allowed_updates: REQUIRED_UPDATES,
        }),
      },
    );
    const setResult = await setRes.json();

    return {
      ok: setResult.ok,
      status: "repaired",
      previous: currentWebhook,
      result: setResult,
    };
  } catch (error: any) {
    console.error("[Telegram Webhook] Verification/Repair error:", error);
    return {
      ok: false,
      error: error?.message || "Unknown error verifying webhook",
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    if (!update || typeof update !== "object") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const bot = await getTelegramBot();
    await bot.handleUpdate(update);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  const check = await verifyAndRepairWebhook();
  return NextResponse.json({
    route: "telegram-webhook",
    ...check,
  });
}


import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getTelegramBot } from "@/features/bot/bot";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const secretHeader = request.headers.get("x-telegram-bot-api-secret-token");

    if (
      env.TELEGRAM_BOT_WEBHOOK_SECRET &&
      secretHeader !== env.TELEGRAM_BOT_WEBHOOK_SECRET
    ) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const update = await request.json();
    const bot = getTelegramBot();

    await bot.handleUpdate(update);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({
    ok: true,
    route: "telegram-webhook",
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getTelegramBot } from "@/features/bot/bot";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    const bot = await getTelegramBot();

    await bot.handleUpdate(update);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error", error);
    return NextResponse.json({ ok: true });
  }
}

export function GET() {
  return NextResponse.json({
    ok: true,
    route: "telegram-webhook",
  });
}

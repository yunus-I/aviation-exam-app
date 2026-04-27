import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export function GET() {
  const checks = {
    appName: Boolean(env.NEXT_PUBLIC_APP_NAME),
    miniAppUrl: Boolean(env.NEXT_PUBLIC_MINI_APP_URL),
    botUsername: Boolean(env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME),
    supabaseUrl: Boolean(env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRoleKey: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
    databaseUrl: Boolean(env.DATABASE_URL),
    telegramBotToken: Boolean(env.TELEGRAM_BOT_TOKEN),
    telegramWebhookSecret: Boolean(env.TELEGRAM_BOT_WEBHOOK_SECRET),
    telegramAdminChatId: Boolean(env.TELEGRAM_ADMIN_CHAT_ID),
  };

  const ready = Object.values(checks).every(Boolean);

  return NextResponse.json({
    ok: true,
    ready,
    checks,
    timestamp: new Date().toISOString(),
  });
}

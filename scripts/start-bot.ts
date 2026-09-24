import dotenv from "dotenv";

dotenv.config();

const PROD_WEBHOOK_URL = "https://aviation-cyan.vercel.app/api/telegram/webhook";
const REQUIRED_UPDATES = ["message", "callback_query", "edited_message"];

async function restoreWebhook(token: string) {
  console.log(`\nRestoring production Telegram webhook to: ${PROD_WEBHOOK_URL}...`);
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: PROD_WEBHOOK_URL,
        allowed_updates: REQUIRED_UPDATES,
      }),
    });
    const result = await res.json();
    if (result.ok) {
      console.log("Production webhook restored successfully! Allowed updates: message, callback_query, edited_message");
    } else {
      console.error("Failed to restore webhook:", result);
    }
  } catch (err) {
    console.error("Network error restoring production webhook:", err);
  }
}

async function main() {
  const { getTelegramBot } = await import("@/features/bot/bot");
  const { env } = await import("@/lib/env");

  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  const token = env.TELEGRAM_BOT_TOKEN;
  let restored = false;

  const cleanup = async () => {
    if (restored) return;
    restored = true;
    await restoreWebhook(token);
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  console.log("Starting Telegram bot in polling mode...");
  console.log("IMPORTANT: Production webhook will be automatically restored when you stop (Ctrl+C).");

  const bot = await getTelegramBot();

  bot.catch((error) => {
    console.error("Telegram bot runtime error:", error);
  });

  await bot.start({
    onStart: () => {
      console.log("Bot started in polling mode. Press Ctrl+C to stop and restore production webhook.");
    },
  });
}

main().catch(async (error) => {
  console.error("Fatal error:", error);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (token) {
    await restoreWebhook(token);
  }
  process.exit(1);
});


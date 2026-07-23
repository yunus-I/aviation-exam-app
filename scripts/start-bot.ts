import dotenv from "dotenv";

dotenv.config();

async function main() {
  const { getTelegramBot } = await import("@/features/bot/bot");
  const { env } = await import("@/lib/env");

  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  console.log("Starting Telegram bot in polling mode...");

  const bot = await getTelegramBot();

  bot.catch((error) => {
    console.error("Telegram bot runtime error:", error);
  });

  await bot.start();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
